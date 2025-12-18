# Allra AI Skills

Allra 팀의 AI 코딩 도구용 Skills 모음입니다. 팀별로 구분된 Plugin을 통해 코딩 표준과 Best Practice를 공유합니다.

**지원 도구:**
- Claude Code (공식 지원)
- GitHub Copilot (참고 자료)
- Cursor AI (참고 자료)
- 기타 AI 코딩 어시스턴트

## 📦 Plugins

### 1. Backend Plugin (`allra-backend-skills`)

백엔드 팀 전용 Skills

**포함된 Skills:**
- **API 설계**: 패키지 구조, DTO 네이밍, REST API 표준
- **데이터베이스**: QueryDSL, @Transactional, JPA Entity 설계
- **에러 핸들링**: 커스텀 예외, Global Exception Handler, 로깅

**기술 스택:**
- Java 17, Spring Boot 3.2.4
- JPA/Hibernate, QueryDSL 5.0.0
- MariaDB, MongoDB, Redis

### 2. Common Plugin (`allra-common-skills`)

전체 팀 공통 Skills (향후 추가 예정)

**계획된 Skills:**
- 코드 리뷰 가이드
- Git 커밋 메시지 규칙
- PR 템플릿

### 3. Frontend Plugin (향후 추가)

프론트엔드 팀용 Skills (향후 추가 예정)

## 🚀 설치 방법 (Personal Skills)

### 1. 처음 설치 (1회만)

```bash
# allra-ai-skills clone
cd ~
git clone https://github.com/Allra-Fintech/allra-ai-skills.git

# Personal Skills로 복사 (모든 프로젝트에서 사용 가능)
mkdir -p ~/.claude/skills
cp -r ~/allra-ai-skills/backend-plugin/skills/* ~/.claude/skills/
```

### 2. 설치 확인

```bash
ls ~/.claude/skills/
# api-design  database-schema  error-handling
```

### 3. Skills 업데이트

```bash
cd ~/allra-ai-skills
git pull
cp -r backend-plugin/skills/* ~/.claude/skills/
```

**끝!** 이제 모든 프로젝트에서 자동으로 Allra 표준이 적용됩니다.

## 📂 디렉토리 구조

```
allra-ai-skills/
├── backend-plugin/           # 백엔드 팀용
│   ├── .claude-plugin/
│   │   └── plugin.json      # Claude Code 메타데이터
│   └── skills/
│       ├── api-design/
│       │   └── SKILL.md     # 모든 AI 도구 호환
│       ├── database-schema/
│       │   └── SKILL.md
│       └── error-handling/
│           └── SKILL.md
│
├── common-plugin/            # 전체 팀 공용
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── skills/
│
└── frontend-plugin/          # 프론트엔드 팀용 (향후)
```

## 📖 Skills 사용 방법

### Claude Code

Skills는 **자동으로 적용**됩니다. 상황에 맞는 Skill을 자동으로 선택합니다.

**예시 1: API 생성**
```
사용자: "User API를 만들어줘"
```
→ `api-design` Skill 자동 적용: 도메인별 패키지 구조, DTO record 작성, Validation 적용

**예시 2: QueryDSL 쿼리**
```
사용자: "사용자 검색 기능을 만들어줘"
```
→ `database-schema` Skill 자동 적용: Repository+Support 구조, @QueryProjection, @Transactional

### 다른 AI 도구

Skill 문서를 컨텍스트로 제공하거나, 프롬프트에 포함하세요:

```
"다음 Allra 백엔드 표준을 따라 User API를 작성해줘:

[backend-plugin/skills/api-design/SKILL.md 내용 붙여넣기]
```

## 🛠️ 기술 표준

### Backend Skills 주요 규칙

#### 패키지 구조
```
└── {domain}
    ├── api          // 컨트롤러
    ├── dto          // Request/Response
    ├── entity       // JPA 엔티티
    ├── repository   // 데이터 접근
    └── service      // 비즈니스 로직
```

#### DTO 네이밍
- `{Operation}Request`: 요청 DTO
- `{Operation}Response`: 응답 DTO
- `{Entity}Dto`: 내부 사용 DTO
- **모두 record로 작성**

#### @Transactional 필수
- 읽기 전용: `@Transactional(readOnly = true)`
- 변경 작업: `@Transactional`
- 모든 public 메서드에 명시

#### QueryDSL
- Repository + RepositorySupport 패턴
- @QueryProjection 사용
- From절에 맞는 Repository에 정의

## 🔄 업데이트

### Claude Code

```bash
/plugin update allra-backend-skills@allra-ai-skills
```

자동 업데이트 활성화:
```json
{
  "autoUpdatePlugins": true
}
```

### 다른 AI 도구

Git pull로 최신 Skill 문서를 받아 사용:
```bash
git pull origin main
```

## 👥 기여하기

새로운 Skill을 추가하거나 기존 Skill을 개선하려면:

1. 브랜치 생성
2. Skill 작성 (SKILL.md)
3. PR 생성
4. 리뷰 후 merge

## 📝 Skill 작성 가이드

새로운 Skill을 작성할 때는 다음 형식을 따릅니다:

```markdown
---
name: skill-name
description: 명확한 설명. Use when [구체적인 사용 시점].
---

# Skill 제목

## Instructions
구체적인 단계별 가이드

## When to Use
자동 적용 조건 (AI 도구용)

## Examples
실제 사용 예시

## Checklist
확인사항
```

**Tips:**
- AI 도구 중립적으로 작성 (특정 도구에 의존하지 않음)
- 구체적인 코드 예시 포함
- 체크리스트로 검증 가능하게 작성

## 📄 라이선스

MIT License

## 📮 문의

- Backend Team: backend@allra.com
- Engineering Team: eng@allra.com

---

**Built for AI-powered development** 🤖
