const fs = require('fs');

// 훅 실행 로깅
console.error('🚀 디스패처 실행됨!');

// ========================================
// 프로젝트 구조 분석 함수
// ========================================
function analyzeProjectStructure() {
    try {
        const buildGradle = fs.readFileSync('build.gradle', 'utf8');

        return {
            // 검증 라이브러리
            hasValidation: buildGradle.includes('spring-boot-starter-validation') ||
                buildGradle.includes('jakarta.validation'),
            validationLibrary: 'Jakarta Validation (@Valid, @NotNull 등)',

            // 보안/인증
            hasSecurity: buildGradle.includes('spring-boot-starter-security'),
            authMethod: buildGradle.includes('spring-boot-starter-security') ? 'Spring Security' : 'None',

            // 로깅
            hasLogging: true, // Spring Boot 기본 제공
            logger: 'Slf4j (@Slf4j, log.info())',

            // 데이터 접근
            hasJpa: buildGradle.includes('spring-boot-starter-data-jpa'),
            hasRedis: buildGradle.includes('spring-boot-starter-data-redis'),

            // API 문서화
            hasSwagger: buildGradle.includes('springdoc') || buildGradle.includes('swagger'),

            // 응답 패턴
            responsePattern: 'ApiResponse<T> 래퍼 클래스'
        };
    } catch (e) {
        return null;
    }
}

function provideProjectSpecificAdvice(entityName, fileType) {
    const project = analyzeProjectStructure();
    if (!project) return;

    console.error(`\n🔍 프로젝트 분석 결과:`);

    if (project.hasValidation) {
        console.error(`   ✅ 검증: ${project.validationLibrary} 사용`);
    }

    if (project.hasSecurity) {
        console.error(`   🔐 인증: ${project.authMethod} 적용 중`);
    }

    console.error(`   📝 로깅: ${project.logger} 패턴 유지`);

    if (project.hasJpa) {
        console.error(`   💾 DB: Spring Data JPA 사용`);
    }

    if (project.hasRedis) {
        console.error(`   ⚡ 캐시: Redis 사용 중`);
    }

    if (project.hasSwagger) {
        console.error(`   📖 API 문서: SpringDoc/Swagger 어노테이션 추가 필요`);
    }

    console.error(`   📤 응답: ${project.responsePattern} 형식 준수\n`);
}

try {
    const input = fs.readFileSync(0, 'utf8');
    const data = JSON.parse(input);

    const toolName = data.tool_name;
    const filePath = data.tool_input.path || data.tool_input.file_path || (data.tool_input.args && data.tool_input.args[0]) || '';

    console.error(`🔧 Tool: ${toolName}, 📁 File: ${filePath}`);

    // ========================================
    // 규칙 1: application-prod.yml 수정 차단 (프로덕션 보호)
    // ========================================
    if (filePath.includes('application-prod.yml') || filePath.includes('application-production.yml')) {
        if (toolName === 'Edit' || toolName === 'Write') {
            console.error("❌ 보안 규칙 위반: 프로덕션 설정 파일은 수정할 수 없습니다.");
            process.exit(0);
        }
    }

    // ========================================
    // 규칙 2: 테스트 파일에 @Disabled 없이 실제 API 호출 경고
    // ========================================
    if (filePath.includes('src/test/') && filePath.endsWith('Test.java')) {
        if (toolName === 'Write') {
            const content = data.tool_input.content || '';
            // 실제 API URL 포함 + @Disabled 없음
            if (content.includes('api.tosspayments.com') && !content.includes('@Disabled')) {
                console.error("⚠️ 경고: 실제 API를 호출하는 테스트는 @Disabled 추가를 권장합니다.");
                // 경고만 하고 차단하지는 않음
            }
        }
    }

    // ========================================
    // 아키텍트 멘토 규칙 1: Controller 수정 시 멘토링
    // ========================================
    if (filePath.includes('/controller/') && (toolName === 'Edit' || toolName === 'Write')) {
        const fileName = filePath.split('/').pop() || '';
        const entityName = fileName.replace(/Controller\.java$/i, '');

        console.error(`\n🎯 [Controller 수정 감지] ${entityName} API Controller를 수정하려고 합니다.`);
        console.error(`📚 아키텍트 멘토의 조언: Controller 수정 전에 다음을 확인하세요:`);
        console.error(`   - ${entityName}.java (Entity 모델)`);
        console.error(`   - ${entityName}Service.java (비즈니스 로직)`);
        console.error(`   - ${entityName}Repository.java (데이터 접근)`);
        console.error(`   - 기존 API 패턴과의 일관성`);

        provideProjectSpecificAdvice(entityName, 'controller');

        console.error(`먼저 관련 파일들을 읽고 계획을 세워주세요!`);
        process.exit(0);
    }

    // ========================================
    // 아키텍트 멘토 규칙 2: Entity 파일 수정 시 영향도 경고
    // ========================================
    if (filePath.includes('/entity/') && (toolName === 'Edit' || toolName === 'Write')) {
        const fileName = filePath.split('/').pop() || '';
        const entityName = fileName.replace(/\.java$/i, '');

        console.error(`\n🗃️ [Entity 수정 경고] ${entityName} 데이터 모델 변경은 신중해야 합니다!`);
        console.error(`📋 체크리스트:`);
        console.error(`   □ 기존 데이터 호환성 확인`);
        console.error(`   □ API 응답 변경 여부`);
        console.error(`   □ DB 마이그레이션 필요성`);
        console.error(`   □ 연관된 Repository/Service 수정 필요성`);

        provideProjectSpecificAdvice(entityName, 'entity');

        console.error(`영향도를 분석한 후 계획을 세워주세요.`);
        process.exit(0);
    }

    // ========================================
    // 아키텍트 멘토 규칙 3: Service 수정 시 멘토링
    // ========================================
    if (filePath.includes('/service/') && filePath.endsWith('Service.java') && (toolName === 'Edit' || toolName === 'Write')) {
        const fileName = filePath.split('/').pop() || '';
        const serviceName = fileName.replace(/Service\.java$/i, '');

        console.error(`\n⚙️ [Service 수정 감지] ${serviceName}Service 비즈니스 로직을 수정하려고 합니다.`);
        console.error(`📚 아키텍트 멘토의 조언:`);
        console.error(`   - 트랜잭션 범위 확인 (@Transactional)`);
        console.error(`   - 예외 처리 일관성`);
        console.error(`   - 단위 테스트 커버리지`);

        provideProjectSpecificAdvice(serviceName, 'service');

        process.exit(0);
    }

    // 모든 규칙 통과
    console.error("✅ 모든 규칙 통과");
    process.exit(0);

} catch (error) {
    console.error(`❌ 디스패처 오류: ${error.message}`);
    process.exit(0); // 오류 시에도 작업 진행
}
