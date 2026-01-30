# [Claude Code 완벽 가이드] 9편: bkit 플러그인 설치

## 이전 편 요약

8편에서는 CLAUDE.md로 프로젝트 설정하는 방법을 배웠습니다. 이번 편부터 **bkit 플러그인**을 알아봅니다.

---

## bkit이란?

**bkit (Vibecoding Kit)**은 Claude Code의 플러그인입니다.

### 주요 기능
- 📋 **PDCA 방법론**: 체계적인 개발 프로세스
- 🎯 **레벨별 가이드**: Starter / Dynamic / Enterprise
- 🤖 **전문 에이전트**: 코드 분석, 갭 분석, 리포트 등
- 📝 **스킬**: 개발 파이프라인, 코드 리뷰 등

### 왜 bkit인가?

Claude Code만으로도 충분히 코딩할 수 있지만, bkit을 사용하면:
- 더 체계적인 개발
- 일관된 코드 품질
- 문서화 자동화
- 베스트 프랙티스 적용

---

## bkit 설치

### 1. 플러그인 마켓플레이스 접근

Claude Code에서:

```
/install bkit@bkit-marketplace
```

또는

```
bkit 플러그인 설치해줘
```

### 2. 설치 확인

```
/plugins
```

결과:
```
Installed plugins:
- bkit@bkit-marketplace (v1.4.7) ✓
```

---

## bkit 활성화

### settings.json 확인

`~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": []
  },
  "enabledPlugins": {
    "bkit@bkit-marketplace": true
  }
}
```

### Claude Code 재시작

설치 후 Claude Code를 재시작하면 bkit이 활성화됩니다.

```
/exit
claude
```

---

## bkit 시작하기

### 첫 실행

Claude Code를 시작하면 bkit 환영 메시지가 나타납니다:

```
🎯 bkit Vibecoding Kit v1.4.7

무엇을 도와드릴까요?
- Learn bkit: bkit 사용법 배우기
- Learn Claude Code: Claude Code 사용법
- Start new project: 새 프로젝트 시작
- Start freely: 자유롭게 시작
```

### 선택지

| 선택 | 설명 |
|------|------|
| Learn bkit | bkit 기능과 PDCA 방법론 학습 |
| Learn Claude Code | Claude Code 기본 사용법 |
| Start new project | 레벨 선택 후 프로젝트 시작 |
| Start freely | 가이드 없이 자유롭게 |

---

## bkit 스킬 목록

`/`로 시작하는 스킬들:

### 레벨별 스킬
| 스킬 | 설명 |
|------|------|
| `/starter` | 정적 웹사이트, 초보자용 |
| `/dynamic` | 풀스택 앱, bkend.ai BaaS |
| `/enterprise` | 마이크로서비스, K8s |

### PDCA 스킬
| 스킬 | 설명 |
|------|------|
| `/pdca plan` | 계획 수립 |
| `/pdca design` | 설계 문서 |
| `/pdca do` | 구현 |
| `/pdca analyze` | 갭 분석 |
| `/pdca report` | 완료 리포트 |

### 파이프라인 스킬
| 스킬 | 설명 |
|------|------|
| `/development-pipeline` | 9단계 개발 파이프라인 |
| `/phase-1-schema` ~ `/phase-9-deployment` | 각 단계별 가이드 |

---

## bkit 에이전트

bkit은 전문 에이전트를 제공합니다:

| 에이전트 | 역할 |
|----------|------|
| `gap-detector` | 설계-구현 갭 분석 |
| `code-analyzer` | 코드 품질 분석 |
| `pdca-iterator` | 자동 반복 개선 |
| `report-generator` | 완료 리포트 생성 |
| `starter-guide` | 초보자 가이드 |

자동으로 활성화되거나, 키워드로 호출됩니다:
- "분석해줘" → code-analyzer
- "검증해줘" → gap-detector
- "보고서 만들어줘" → report-generator

---

## 간단한 테스트

### 1. 스킬 실행

```
/starter
```

Starter 레벨 가이드가 활성화됩니다.

### 2. 도움말

```
/bkit
```

bkit 기능 목록을 보여줍니다.

---

## 다음 편 예고

10편에서는 **PDCA 방법론**을 자세히 알아봅니다.

- Plan → Design → Do → Check → Act
- 각 단계별 산출물
- 실제 적용 예시

[10편 보러가기 →](#)

---

*이전 글: [8편 - 프로젝트 설정](#)*
*다음 글: [10편 - PDCA 방법론 이해](#)*
