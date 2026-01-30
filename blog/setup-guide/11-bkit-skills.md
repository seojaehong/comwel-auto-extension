# [Claude Code 완벽 가이드] 11편: bkit 스킬 활용 (Starter / Dynamic)

## 이전 편 요약

10편에서는 PDCA 방법론을 배웠습니다. 이번 편에서는 레벨별 스킬을 활용하는 방법을 알아봅니다.

---

## 레벨 시스템

bkit은 프로젝트 복잡도에 따라 3가지 레벨을 제공합니다:

| 레벨 | 대상 | 기술 스택 |
|------|------|-----------|
| **Starter** | 초보자, 정적 사이트 | HTML, CSS, JS |
| **Dynamic** | 풀스택 앱 | Next.js + bkend.ai |
| **Enterprise** | 대규모 시스템 | K8s, 마이크로서비스 |

---

## Starter 레벨

### 대상

- 프로그래밍 초보자
- 포트폴리오 사이트
- 랜딩 페이지
- 간단한 정적 웹사이트

### 활성화

```
/starter
```

또는 프로젝트 초기화:

```
/starter init
```

### 기술 스택

- HTML5
- CSS3 (또는 Tailwind)
- Vanilla JavaScript
- 정적 호스팅 (Vercel, Netlify)

### 9단계 파이프라인 (Starter)

```
Phase 1: 스키마/용어 정의    → 간단하게
Phase 2: 코딩 컨벤션        → 기본만
Phase 3: 목업 개발          → HTML/CSS
Phase 5: 디자인 시스템      → 선택사항
Phase 6: UI 구현            → 정적 UI
Phase 7: SEO               → SEO만 (보안 제외)
Phase 9: 배포              → 정적 호스팅
```

**Phase 4 (API), Phase 8 (리뷰)는 Starter에서 생략**

### 예시: 포트폴리오 사이트

```
포트폴리오 웹사이트 만들어줘.
내 이름은 홍길동이고, 웹 개발자야.
프로젝트 3개 소개 섹션이 필요해.
```

---

## Dynamic 레벨

### 대상

- 로그인이 필요한 앱
- 데이터베이스 연동
- 풀스택 웹 애플리케이션
- SaaS, MVP

### 활성화

```
/dynamic
```

또는:

```
/dynamic init
```

### 기술 스택

- **프론트엔드**: Next.js (App Router)
- **백엔드**: bkend.ai (BaaS)
- **인증**: bkend.ai Auth
- **데이터베이스**: bkend.ai DB
- **배포**: Vercel

### bkend.ai란?

**bkend.ai**는 Backend-as-a-Service 플랫폼입니다.

직접 서버를 만들지 않고도:
- 사용자 인증 (로그인/회원가입)
- 데이터베이스 (CRUD)
- 파일 저장소
- API 자동 생성

### 9단계 파이프라인 (Dynamic)

```
Phase 1: 스키마/용어 정의    → 상세하게
Phase 2: 코딩 컨벤션        → 확장
Phase 3: 목업 개발          → HTML/CSS/JS + JSON
Phase 4: API 설계/구현      → bkend.ai 연동
Phase 5: 디자인 시스템      → 컴포넌트 라이브러리
Phase 6: UI + API 통합      → 실제 연동
Phase 7: SEO + 보안         → 둘 다
Phase 8: 리뷰              → 코드 품질 검사
Phase 9: 배포              → Vercel
```

### 예시: 할 일 관리 앱

```
/dynamic init

할 일 관리 앱 만들어줘.
- 회원가입/로그인
- 할 일 CRUD
- 완료 체크
- 카테고리 분류
```

---

## Starter vs Dynamic 비교

| 항목 | Starter | Dynamic |
|------|---------|---------|
| 백엔드 | 없음 | bkend.ai |
| 로그인 | 없음 | 있음 |
| 데이터베이스 | 없음 | 있음 |
| 복잡도 | 낮음 | 중간 |
| 학습 곡선 | 완만 | 보통 |
| 비용 | 무료 | bkend.ai 요금 |

---

## 레벨 선택 가이드

### Starter를 선택하세요:
- "프로그래밍 처음이에요"
- "포트폴리오 사이트 만들래요"
- "회사 소개 페이지요"
- "로그인 기능 필요 없어요"

### Dynamic을 선택하세요:
- "로그인 기능 필요해요"
- "데이터 저장해야 해요"
- "회원 관리가 필요해요"
- "실제 서비스 만들 거예요"

---

## 개발 파이프라인 시작

### Starter

```
/development-pipeline start

레벨: Starter
프로젝트: 개인 포트폴리오
```

### Dynamic

```
/development-pipeline start

레벨: Dynamic
프로젝트: 할 일 관리 앱
```

파이프라인이 시작되면 각 Phase를 순서대로 안내합니다.

---

## 다음 편 예고

12편에서는 **bkit 에이전트 활용**을 알아봅니다.

- gap-detector: 갭 분석
- code-analyzer: 코드 품질
- 자동 트리거 키워드

[12편 보러가기 →](#)

---

*이전 글: [10편 - PDCA 방법론](#)*
*다음 글: [12편 - bkit 에이전트 활용](#)*
