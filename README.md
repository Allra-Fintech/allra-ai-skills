# Allra AI Skills

Allra 팀의 AI 코딩 도구용 Skills 모음입니다. 코딩 표준과 Best Practice를 공유합니다.

**지원 도구:**
- Claude Code
- GitHub Copilot
- Cursor AI
- 기타 AI 코딩 어시스턴트

---

## 🚀 설치 방법 (Personal Skills)

### 방법 1: Claude Code 사용 (권장)

Claude Code를 사용하는 경우 `/plugin` 명령어로 간편하게 설치할 수 있습니다:

```bash
# 1. 저장소 clone
cd ~
git clone https://github.com/Allra-Fintech/allra-ai-skills.git

# 2. Claude Code에서 플러그인 등록
/plugin install ~/allra-ai-skills/backend-plugin
/plugin install ~/allra-ai-skills/common-plugin
/plugin install ~/allra-ai-skills/frontend-plugin
```

> **💡 Tip:** 플러그인 설치 시 **로컬에 저장(Save to Local)**을 선택하면 로컬에서 작업하는 모든 프로젝트에 적용할 수 있습니다.

설치 후 `/skills` 명령어로 확인할 수 있습니다.

#### Skills 업데이트

**자동 업데이트 (권장):**
1. `/plugin` 명령어 실행
2. **Marketplace** 탭 선택
3. 설치된 플러그인에서 **Enable auto-update** 설정

### 방법 2: 수동 설치

```bash
# 1. allra-ai-skills clone
cd ~
git clone https://github.com/Allra-Fintech/allra-ai-skills.git

# 2. Personal Skills로 복사 (모든 프로젝트에서 사용 가능)
mkdir -p ~/.claude/skills
cp -r ~/allra-ai-skills/*/skills/* ~/.claude/skills/
```

#### 설치 확인

```bash
ls ~/.claude/skills/
```

#### Skills 업데이트

```bash
cd ~/allra-ai-skills
git pull
cp -r */skills/* ~/.claude/skills/
```

**끝!** 이제 모든 프로젝트에서 자동으로 Allra 표준이 적용됩니다.

---

## 📂 디렉토리 구조

```
allra-ai-skills/
├── backend-plugin/
│   └── skills/
│       └── [Backend Skills]
├── common-plugin/
│   └── skills/
│       └── [Common Skills]
└── frontend-plugin/
    └── skills/
        └── [Frontend Skills]
```

---

## 📖 Skills 사용 방법

### Claude Code

Skills는 **자동으로 적용**됩니다. 상황에 맞는 Skill을 자동으로 선택합니다.

```
사용자: "API를 만들어줘"
→ 관련 Skill 자동 적용
```

### 다른 AI 도구

각 Skill의 `SKILL.md` 파일을 참고하여 프롬프트나 설정에 활용하세요.

---

## 👥 기여하기

새로운 Skill을 추가하거나 기존 Skill을 개선하려면:

1. 브랜치 생성
2. Skill 작성 (SKILL.md)
3. PR 생성
4. 리뷰 후 merge

---

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
자동 적용 조건

## Examples
실제 사용 예시

## Checklist
확인사항
```

**Tips:**
- AI 도구 중립적으로 작성
- 구체적인 코드 예시 포함
- 체크리스트로 검증 가능하게 작성

---

## 📄 라이선스

MIT License

## 📮 문의

- Engineering Team: eng@allra.com

---

**Built for AI-powered development** 🤖
