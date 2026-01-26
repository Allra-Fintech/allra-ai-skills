const fs = require('fs');

// 훅 실행 로깅
console.error('🚀 디스패처 실행됨!');

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
            process.exit(2);
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

    // 모든 규칙 통과
    console.error("✅ 모든 규칙 통과");
    process.exit(0);

} catch (error) {
    console.error(`❌ 디스패처 오류: ${error.message}`);
    process.exit(0); // 오류 시에도 작업 진행
}
