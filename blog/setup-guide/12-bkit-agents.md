# [Claude Code 완벽 가이드] 12편: bkit 에이전트 활용

## 이전 편 요약

11편에서는 Starter/Dynamic 레벨별 스킬을 배웠습니다. 이번 편에서는 **bkit 에이전트**를 알아봅니다.

---

## 에이전트란?

**에이전트**는 특정 작업에 전문화된 AI 도우미입니다.

스킬이 "명령어"라면, 에이전트는 "전문가"입니다.

```
스킬: /pdca analyze (명령어 실행)
에이전트: gap-detector (분석 전문가가 직접 분석)
```

---

## 주요 에이전트 목록

| 에이전트 | 역할 | 자동 트리거 키워드 |
|----------|------|-------------------|
| `gap-detector` | 설계-구현 갭 분석 | 검증해줘, verify |
| `code-analyzer` | 코드 품질 분석 | 분석해줘, analyze |
| `pdca-iterator` | 자동 반복 개선 | 개선해줘, improve |
| `report-generator` | 완료 리포트 생성 | 보고서 만들어줘, report |
| `starter-guide` | 초보자 가이드 | 도움말, help |
| `design-validator` | 설계 문서 검증 | 설계 검토해줘 |
| `qa-monitor` | Docker 로그 QA | 테스트해줘 |

---

## gap-detector (갭 분석)

### 역할

설계 문서와 실제 구현 코드를 비교합니다.

### 사용법

```
로그인 기능 검증해줘
```

또는

```
설계서랑 구현 비교해줘
```

### 자동 트리거

다음 키워드가 포함되면 자동 실행:
- 검증, verify, 確認, 验证
- 맞아?, 이거 괜찮아?, is this right?

### 출력 예시

```
📊 Gap Analysis Report
─────────────────────────────
Feature: 로그인 기능
Design: docs/02-design/login-design.md
Implementation: src/features/login/

Match Rate: 75%

✅ Implemented:
- POST /api/login
- 요청 형식 (email, password)

❌ Missing:
- 응답에 user 객체 없음
- 401 에러 처리 미구현

💡 Recommendation:
- 응답 객체에 user 추가
- 에러 핸들링 구현
```

---

## code-analyzer (코드 분석)

### 역할

코드 품질, 보안, 성능 이슈를 분석합니다.

### 사용법

```
코드 분석해줘
```

```
품질 검사해줘
```

```
보안 스캔해줘
```

### 자동 트리거

- 분석, analyze, 分析
- 품질, quality
- 이상해, 뭔가 이상해, something wrong

### 검사 항목

1. **코드 품질**
   - 복잡도
   - 중복 코드
   - 네이밍 컨벤션

2. **보안**
   - SQL 인젝션 가능성
   - XSS 취약점
   - 하드코딩된 비밀번호

3. **성능**
   - N+1 쿼리
   - 메모리 누수 패턴
   - 불필요한 렌더링

### 출력 예시

```
🔍 Code Analysis Report
─────────────────────────────
Files Analyzed: 15
Issues Found: 3

🔴 Critical:
- src/api/user.js:42 - SQL injection risk

🟡 Warning:
- src/utils/helper.js:15 - Unused variable
- src/components/List.jsx:28 - Missing key prop

🟢 Info:
- Consider splitting large function at line 120
```

---

## pdca-iterator (자동 개선)

### 역할

매칭률이 90%가 될 때까지 자동으로 수정합니다.

### 사용법

```
자동 수정해줘
```

```
반복 개선해줘
```

### 자동 트리거

- Gap 분석 결과가 90% 미만일 때
- 개선해줘, improve, 改善
- 고쳐줘, fix this

### 작동 방식

```
1. Gap 분석 실행
   ↓
2. 누락 항목 확인
   ↓
3. 코드 자동 수정
   ↓
4. 재분석
   ↓
5. 90% 미만? → 2번으로
   90% 이상? → 완료
```

### 규칙

- 최대 5회 반복
- 각 반복마다 리포트 생성
- 90% 도달 시 report-generator 호출

---

## report-generator (리포트 생성)

### 역할

PDCA 사이클 완료 리포트를 생성합니다.

### 사용법

```
완료 보고서 만들어줘
```

```
진행 상황 요약해줘
```

### 자동 트리거

- 보고서, report, 報告
- 뭐 했어?, status?
- 요약, summary

### 출력 예시

```markdown
# PDCA Completion Report

## Feature: 로그인 기능

### Summary
- Plan: ✅ Completed
- Design: ✅ Completed
- Implementation: ✅ Completed
- Gap Analysis: 95%

### Timeline
- Started: 2024-01-15
- Completed: 2024-01-15

### Deliverables
- docs/01-plan/login-plan.md
- docs/02-design/login-design.md
- src/features/login/
- docs/04-report/login-report.md

### Lessons Learned
- 에러 처리 설계 단계에서 더 상세히
```

---

## starter-guide (초보자 가이드)

### 역할

프로그래밍 초보자를 위한 친절한 설명을 제공합니다.

### 자동 트리거

- 초보자, 처음, beginner
- 도움말, help, 助けて
- 이해 안 돼, 설명해, don't understand

### 특징

- 전문 용어 대신 쉬운 말
- 단계별 상세 설명
- 예시 코드 포함

---

## 에이전트 자동 트리거 (8개 언어)

bkit은 8개 언어로 자동 트리거를 지원합니다:

| 언어 | 검증 | 분석 | 개선 | 보고서 |
|------|------|------|------|--------|
| 한국어 | 검증해줘 | 분석해줘 | 개선해줘 | 보고서 |
| English | verify | analyze | improve | report |
| 日本語 | 確認 | 分析 | 改善 | 報告 |
| 中文 | 验证 | 分析 | 改进 | 报告 |
| Español | verificar | analizar | mejorar | informe |
| Français | vérifier | analyser | améliorer | rapport |
| Deutsch | prüfen | analysieren | verbessern | Bericht |
| Italiano | verificare | analizzare | migliorare | rapporto |

---

## 에이전트 조합 활용

### 개발 완료 후 검증 플로우

```
1. "검증해줘" → gap-detector 실행
2. 75% 나옴 → "자동 수정해줘" → pdca-iterator
3. 92% 달성 → "보고서 만들어줘" → report-generator
```

### 코드 리뷰 플로우

```
1. "코드 분석해줘" → code-analyzer
2. 이슈 발견 → 수정
3. "다시 분석해줘" → code-analyzer
4. 이슈 없음 → 완료
```

---

## 다음 편 예고

13편에서는 **확장프로그램 배포하기**를 알아봅니다.

- 다른 사람에게 공유하는 방법
- Chrome 웹 스토어 등록
- 개발자 모드 설치 가이드

[13편 보러가기 →](#)

---

*이전 글: [11편 - bkit 스킬 활용](#)*
*다음 글: [13편 - 확장프로그램 배포](#)*
