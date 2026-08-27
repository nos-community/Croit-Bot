## Croit-Bot

#### 명령어 등록 양식
**경로** : Croit-Bot/src/bot/commands/...

```
export const [명령어 이름]Command = {
  data: new SlashCommandBuilder()
    .setName("[명령어 이름]")
    .setDescription("[발송될 채팅]"),

  async execute(interaction) {
    // 명령어 실행
  },
};
```

1. ``npm run typecheck``
2. ``npm run format:check``
- **동작** : 상위 두 개 검사 통과 시 npm run commands:deploy 을 통해 명령어 등록

#### 마이그레이션 양식
**경로** : Croit-Bot/src/bot/commands/prisma/schema.prisma

1. 원하는 모델(테이블)이나 필드(컬럼)를 추가/수정
2. 마이그레이션 파일 생성 및 DB 적용
```
npx prisma migrate dev --name [작업이름]
```
- **동작** : 변경된 schema.prisma를 분석해 prisma/migrations/ 폴더 안에 새로운 SQL 파일을 생성하고, 연동된 DB(Supabase)에 변경 사항을 즉시 적용
- **예시** : ``npx prisma migrate dev --name add_grade_update_request``
3. TypeScript용 Client 타입 갱신
```
npx prisma generate
```
- **동작** : 최신 DB 스키마에 맞춰 TypeScript 코드에서 사용할 prisma.user나 prisma.gradeUpdateRequest 같은 자동완성 및 타입 정의(Prisma Client)를 다시 생성

**데이터 초기화가 필요한 특수 상황** <br />
마이그레이션 이력이 꼬였거나 개발 중 DB를 깨끗하게 비우고 새로 시작하고 싶을 때 사용
- **마이그레이션 이력 유지하며 DB 리셋** :
```
npx prisma migrate reset
```
- **최신 스키마 강제 동기화 (오류 해결용 & 업데이트용)** :
```
npx prisma db push
npx prisma generate
```

---

## 쿠키 구조 (Cookie Structure)

- **M573SSID**: e-amusement 메인 세션 인증 쿠키
- **incap_ses\_ / visid_incap_**: 보안 방화벽(Incapsula) 세션 유지용 쿠키 <br />

- **Domain:** `p.eagate.573.jp`
- **메인 페이지 URL:** `https://p.eagate.573.jp/gate/p/home/`
  - **Response:** `text/html` (메인 홈 페이지 구조)
  - **비로그인 특징:** 사이드바 메뉴에 로그인 링크(`href="/gate/p/login.html?path=/gate/p/home/"`) 포함

### 로그인 Endpoints & Request

- **로그인 요청 URL:** `https://p.eagate.573.jp/gate/k/login_exec.html?code={CODE}&state={STATE}`
- **Request Method:** `GET`
- **Redirect Location:** `https://p.eagate.573.jp/gate/p/home/` (`HTTP 302`)

### 세션 쿠키 (Session Cookie)

- **발급 쿠키 (Response Header `Set-Cookie`):** `M573SSID`
- **쿠키 속성 명세:**
  - `Domain`: `.573.jp`
  - `Path`: `/`
  - `HttpOnly`: `True` _(JavaScript 접근 불가)_
  - `Secure`: `True`
  - `SameSite`: `None`
- **쿠키 활용:**
  - 로그인 성공 후 메인 페이지 및 API 호출 시 `Request Header`의 `Cookie:`에 `M573SSID` 세션 토큰 첨부 필요
  - 방화벽/보안 솔루션(Incapsula) 쿠키: `incap_ses_*`, `visid_incap_*` (요청 실패 시 함께 세팅 검토)

### 로그인 상태 확인 API

- **API URL:** `https://p.eagate.573.jp/gate/p/common/tk/getinfo.html` _(또는 `/tare/getinfo.html`)_
- **Request Method:** `GET`
- **Response Format:** `JSON` (`application/json`)
- **로그인 판별 조건:** 응답 JSON 내 `status == 1` 및 `snsid` 데이터 존재 여부로 세션 유효성 검증
