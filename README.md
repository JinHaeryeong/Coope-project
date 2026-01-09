# Coope: Mediasoup SFU 기반 실시간 협업 플랫폼

<p align="center">
  <img width="554" height="117"  alt="logo" src="https://github.com/user-attachments/assets/ee9196c1-a378-453f-a262-ed885714b888" />
</p>

> "Next.js와 Mediasoup SFU 아키텍처를 결합한 고성능 다자간 화상 회의 및 실시간 협업 툴" 본 프로젝트는 WebRTC Mesh 방식의 한계를 SFU(Selective Forwarding Unit) 방식으로 해결하고, 실시간 문서 동기화 기능을 결합한 협업 플랫폼입니다.


---

## 🧠 프로젝트 개요
### 📌 목표
* SFU 기반 미디어 서버 구축: Mesh 방식의 한계를 넘어 Mediasoup을 활용한 저지연(Low-latency) 다자간 통신 구현
* 실시간 데이터 동기화: Convex를 활용하여 문서나 사용자 상태를 대기 시간 없이 실시간으로 동기화
* 인프라 아키텍처 실습: Vercel(Front)과 AWS EC2(Back)를 분리 배포하여 실제 서비스와 유사한 인프라 환경 구축


### 🛠️ **사용 기술**
![diagram-export-2026 -1 -9 -오후-11_41_49](https://github.com/user-attachments/assets/e300643c-ea76-4974-b7d4-51702d5cc301)

### 👉 **환경**
* Runtime: Node.js v22+, TypeScript
* Key Frameworks: Next.js, Express
* Real-time: Mediasoup (SFU), Socket.io, Convex(DB)
* Auth: Clerk
* OS: Windows 11

---

## 📁 프로젝트 구조
```
📦 
├─ .gitignore
├─ .gitmessage.txt
├─ README.md
├─ client
│  ├─ app
│  │  ├─ (auth)
│  │  │  └─ (routes)
│  │  │     ├─ layout.tsx
│  │  │     ├─ sign-in
│  │  │     │  └─ [[...sign-in]]
│  │  │     │     └─ page.tsx
│  │  │     └─ sign-up
│  │  │        └─ [[...sign-up]]
│  │  │           └─ page.tsx
│  │  ├─ (main)
│  │  │  ├─ (routes)
│  │  │  │  └─ workspace
│  │  │  │     └─ [workspaceId]
│  │  │  │        ├─ documents
│  │  │  │        │  ├─ [documentId]
│  │  │  │        │  │  └─ page.tsx
│  │  │  │        │  └─ page.tsx
│  │  │  │        └─ friends
│  │  │  │           └─ page.tsx
│  │  │  ├─ _components
│  │  │  │  ├─ banner.tsx
│  │  │  │  ├─ call
│  │  │  │  │  ├─ WebRtcComponent.tsx
│  │  │  │  │  ├─ callModal.tsx
│  │  │  │  │  ├─ callPreJoinModal.tsx
│  │  │  │  │  └─ miniCallPopup.tsx
│  │  │  │  ├─ friends
│  │  │  │  │  ├─ addFriend.tsx
│  │  │  │  │  ├─ chat-input.tsx
│  │  │  │  │  ├─ friend-list-item.tsx
│  │  │  │  │  ├─ friend.tsx
│  │  │  │  │  ├─ friendRequestList.tsx
│  │  │  │  │  ├─ message-item.tsx
│  │  │  │  │  └─ userList.tsx
│  │  │  │  ├─ invite-button.tsx
│  │  │  │  ├─ item.tsx
│  │  │  │  ├─ navbar.tsx
│  │  │  │  ├─ navigation.tsx
│  │  │  │  ├─ trash-box.tsx
│  │  │  │  ├─ user-item.tsx
│  │  │  │  └─ workspace
│  │  │  │     ├─ document-list.tsx
│  │  │  │     ├─ menu.tsx
│  │  │  │     └─ title.tsx
│  │  │  └─ layout.tsx
│  │  ├─ (marketing)
│  │  │  ├─ (routes)
│  │  │  │  ├─ csAdmin
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ customerService
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ function
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ inquiryPage
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ inquiryWrite
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ introduction
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ notice
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ noticeEditPage
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ noticePage
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ support
│  │  │  │     └─ page.tsx
│  │  │  ├─ _components
│  │  │  │  ├─ ScrollToTop.tsx
│  │  │  │  ├─ answerWrite.tsx
│  │  │  │  ├─ answers.tsx
│  │  │  │  ├─ commentForm.tsx
│  │  │  │  ├─ commentList.tsx
│  │  │  │  ├─ faq.tsx
│  │  │  │  ├─ footer.tsx
│  │  │  │  ├─ heading.tsx
│  │  │  │  ├─ heroes.tsx
│  │  │  │  ├─ imageModal.tsx
│  │  │  │  ├─ logo.tsx
│  │  │  │  ├─ modal.tsx
│  │  │  │  ├─ navbar.tsx
│  │  │  │  ├─ noticeWrite.tsx
│  │  │  │  ├─ policy.tsx
│  │  │  │  └─ term.tsx
│  │  │  ├─ admin
│  │  │  │  ├─ SearchUsers.tsx
│  │  │  │  ├─ _actions.ts
│  │  │  │  └─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ api
│  │  │  ├─ chat
│  │  │  │  └─ route.ts
│  │  │  ├─ edgestore
│  │  │  │  └─ [...edgestore]
│  │  │  │     └─ route.ts
│  │  │  ├─ stt
│  │  │  │  └─ route.ts
│  │  │  └─ summary
│  │  │     └─ route.ts
│  │  ├─ error.tsx
│  │  ├─ globals.css
│  │  ├─ invite
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ components.json
│  ├─ components
│  │  ├─ ai-chat-modal.tsx
│  │  ├─ chat-context.tsx
│  │  ├─ cover.tsx
│  │  ├─ editor.tsx
│  │  ├─ icon-picker.tsx
│  │  ├─ modals
│  │  │  ├─ confirm-modal.tsx
│  │  │  ├─ cover-image-modal.tsx
│  │  │  ├─ invite-modal.tsx
│  │  │  └─ settings-modal.tsx
│  │  ├─ mode-toggle.tsx
│  │  ├─ providers
│  │  │  ├─ convex-provider.tsx
│  │  │  ├─ modal-provider.tsx
│  │  │  └─ theme-provider.tsx
│  │  ├─ search-command.tsx
│  │  ├─ single-image-dropzone.tsx
│  │  ├─ spinner.tsx
│  │  ├─ toolbar.tsx
│  │  └─ ui
│  │     ├─ accordion.tsx
│  │     ├─ alert-dialog.tsx
│  │     ├─ alert.tsx
│  │     ├─ avatar.tsx
│  │     ├─ button.tsx
│  │     ├─ card.tsx
│  │     ├─ command.tsx
│  │     ├─ dialog.tsx
│  │     ├─ dropdown-menu.tsx
│  │     ├─ form.tsx
│  │     ├─ input.tsx
│  │     ├─ label.tsx
│  │     ├─ pagination.tsx
│  │     ├─ popover.tsx
│  │     ├─ radio-group.tsx
│  │     ├─ resizable.tsx
│  │     ├─ scroll-area.tsx
│  │     ├─ separator.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ table.tsx
│  │     └─ textarea.tsx
│  ├─ convex
│  │  ├─ README.md
│  │  ├─ _generated
│  │  │  ├─ api.d.ts
│  │  │  ├─ api.js
│  │  │  ├─ dataModel.d.ts
│  │  │  ├─ server.d.ts
│  │  │  └─ server.js
│  │  ├─ aiChat.ts
│  │  ├─ auth.config.js
│  │  ├─ chat.ts
│  │  ├─ comments.ts
│  │  ├─ documents.ts
│  │  ├─ friends.ts
│  │  ├─ http.ts
│  │  ├─ inquiries.ts
│  │  ├─ notices.ts
│  │  ├─ rooms.ts
│  │  ├─ schema.ts
│  │  ├─ tsconfig.json
│  │  ├─ users.ts
│  │  └─ workspace.ts
│  ├─ eslint.config.mjs
│  ├─ hooks
│  │  ├─ use-cover-image.ts
│  │  ├─ use-enter-workspace.ts
│  │  ├─ use-invite.ts
│  │  ├─ use-mediasoup.ts
│  │  ├─ use-recorder-ai.ts
│  │  ├─ use-scroll-top.ts
│  │  ├─ use-search.ts
│  │  ├─ use-settings.ts
│  │  └─ useMoveScroll.ts
│  ├─ lib
│  │  ├─ action.ts
│  │  ├─ edgestore.ts
│  │  └─ utils.ts
│  ├─ middleware.ts
│  ├─ next.config.ts
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.mjs
│  ├─ public
│  │  ├─ chat.png
│  │  ├─ documents-dark.png
│  │  ├─ documents.png
│  │  ├─ empty-dark.png
│  │  ├─ empty.png
│  │  ├─ error-dark.png
│  │  ├─ error.png
│  │  ├─ example1.png
│  │  ├─ example2.png
│  │  ├─ file.svg
│  │  ├─ fonts
│  │  │  └─ PretendardVariable.woff2
│  │  ├─ functionPeople.png
│  │  ├─ globe.svg
│  │  ├─ icons
│  │  │  └─ favicon.ico
│  │  ├─ introduction.png
│  │  ├─ logo-dark.png
│  │  ├─ logo-dark.svg
│  │  ├─ logo.png
│  │  ├─ logo.svg
│  │  ├─ moon.png
│  │  ├─ mountain.jpg
│  │  ├─ next.svg
│  │  ├─ reading-dark.png
│  │  ├─ reading.png
│  │  ├─ robot.png
│  │  ├─ robot_dark.png
│  │  ├─ robots.txt
│  │  ├─ support1.png
│  │  ├─ universe.jpg
│  │  ├─ vercel.svg
│  │  ├─ wave.svg
│  │  └─ window.svg
│  ├─ styles
│  │  └─ globals.css
│  ├─ tailwind.config.ts
│  ├─ tsconfig.json
│  ├─ types
│  │  └─ globals.d.ts
│  └─ utils
│     └─ roles.ts
└─ server
   ├─ package-lock.json
   ├─ package.json
   ├─ server.ts
   ├─ src
   │  ├─ config
   │  │  ├─ mediasoupConfig.ts
   │  │  └─ openaiConfig.ts
   │  ├─ controllers
   │  │  └─ sttController.ts
   │  ├─ mediasoup
   │  │  └─ manager.ts
   │  ├─ routes
   │  │  └─ apiRouter.ts
   │  └─ socket
   │     ├─ index.ts
   │     └─ roomHandler.ts
   └─ tsconfig.json
```
©generated by [Project Tree Generator](https://woochanleee.github.io/project-tree-generator)

---
## 실행 방법
### 1. 사전 작업
- Clerk, Convex, EdgeStore 회원가입 필요, OPENAI의 API Key 필요
- Clerk, Convex 공식문서 참고 => Clerk <=> Convex 사이에 유저 정보 삽입, 수정, 삭제 시 User 테이블이 반영되도록 WebHook 설정 필요
- 환경변수 설정 필요 => .env.example 파일 참고

### 2. 필요한 패키지 설치
#### 터미널 창 2개 필요

> 터미널 1(Front)
- cd client
- npm i
> 터미널 2(Back)
- cd server
- npm i


### 3. 실행
#### 터미널 창 3개 필요
- 터미널 1 (Convex): npx convex dev(처음 할때만 필요 이후엔 클라우드 기반이라 필요 X)
- 터미널 2, 터미널 3 (Front, Back): npm run dev
---

## 🧪예시 결과
(수정중)

---

## 🧩핵심 기능
### SFU 다자간 화상 회의 (WebRTC, Mediasoup)
- 서버에서 미디어 스트림을 중계하는 SFU 방식을 채택하여 다수 참여 시에도 클라이언트 부하 최적화.
- 전체화면 모드: 반응형 레이아웃을 통한 몰입감 있는 회의 환경 제공.

### AI 회의 기록 및 요약 (OpenAI, STT)
- 실시간 마이크 스트림을 캡처하여 Whisper 모델로 텍스트 변환.
- 회의 내용을 분석하여 AI 요약본을 자동으로 생성하고 문서로 저장.

### 실시간 워크스페이스 (Convex)
- 노션 스타일의 블록 기반 문서 편집기 및 실시간 초대/권한 관리.
- 친구 요청, 실시간 온라인 상태 확인

---

## 🛠️ 개발 중 겪은 문제 & 해결 방법
### ✅ Clerk - Convex 간 실시간 유저 데이터 동기화 이슈
문제: Clerk에서 회원가입/수정 발생 시 Convex 데이터베이스의 유저 테이블에 즉시 반영되지 않는 현상

원인: 
- 엔드포인트 설정 오류: Convex HTTP Action 전용 도메인(.site)이 아닌 일반 Deployment URL을 사용하여 Clerk의 Webhook 호출 실패
- 보안 검증 누락: Clerk에서 전송한 Webhook Payload의 신뢰성을 보장하기 위한 svix 서명 검증(Signing Secret) 프로세스 미비

해결:
- convex/http.ts를 구현하여 전용 Webhook 엔드포인트를 구축
- Clerk 대시보드와 Convex 환경 변수 간 Signing Secret을 동기화하고, svix 라이브러리를 활용해 요청 무결성 검증 로직을 추가하여 보안과 데이터 정합성을 동시에 해결

### ✅ GPT API 대화 맥락 유지 및 클라이언트 사이드 캐싱
문제: AI 채팅 이용 중 페이지를 새로고침하거나 브라우저를 재시작하면 기존 대화 내역이 유실되어 대화의 맥락(Context)이 끊기는 불편함 발생

원인: 채팅 데이터가 React State(메모리)에만 저장되어 있어, 브라우저 세션이 종료되면 데이터가 초기화됨

해결:

- Context API + LocalStorage: React Context를 사용하여 전역 상태를 관리하되, useEffect를 통해 상태가 변경될 때마다 브라우저의 LocalStorage에 동기화하여 데이터 지속성 확보.

- 데이터 최적화 전략:

1. 용량 제한: 무한히 늘어날 수 있는 대화 내역을 방지하기 위해 최대 저장 개수를 100개로 제한(slice).
2. 만료 정책(TTL): 사용자 프라이버시 및 최신성 유지를 위해 7일이 지난 오래된 데이터는 필터링하여 자동 삭제하는 로직 구현.

### ✅ WebRTC 미디어 동기화 Race Condition 해결
문제: 사용자가 회의 입장 시, 기존 참여자의 스트림이 즉시 로드되지 않는 현상 발생

원인: 미디어 서버의 프로듀서 목록 송신 시점과 클라이언트 Mediasoup Device 로딩 완료 시점 간의 비동기 타이밍 문제 (Device가 준비되기 전 데이터를 수신하여 처리 실패)

해결: 클라이언트가 장치 준비를 마치고 능동적으로 서버에 목록을 요청하는 Pull 방식(getExistingProducers)으로 리팩토링하여 완벽한 동기화 보장

### ✅ 투명 레이어 클릭 간섭(Z-Index) 이슈
문제: 상단 네비게이션 바가 투명함에도 불구하고 특정 영역의 버튼 클릭이 작동하지 않음.

원인: absolute 포지셔닝된 상단 바가 w-full로 설정되어 보이지 않게 클릭 이벤트를 가로챔.

해결: pointer-events: none을 부모 레이어에 설정하고, 실제 인터랙션이 필요한 아이콘에만 pointer-events: auto를 부여하여 해결.

### ✅ AWS EC2 배포 환경의 보안 컨텍스트(HTTPS) 이슈
문제: 로컬 환경과 달리 배포 환경에서 카메라, 마이크, 화면 공유 등 미디어 스트림이 작동하지 않는 현상 발생

원인: WebRTC 보안 정책상 미디어 디바이스 접근(getUserMedia)은 보안 컨텍스트(HTTPS) 내에서만 허용 => Vercel로 배포된 프론트엔드(HTTPS)에서 SSL이 적용되지 않은 EC2 서버(HTTP)로 요청을 보낼 때 Mixed Content 오류 및 보안 거부 발생.

해결: 도메인 확보 후 A 레코드를 설정하여 EC2 인스턴스와 연결하고, Nginx를 역방향 프록시(Reverse Proxy)로 구성한 뒤 Certbot(Let's Encrypt)을 통해 SSL 인증서를 발급받아 HTTPS 환경을 구축하여 해결

---
## 🔧 추후 보완점
1. 다자간 통화 UI 및 반응형 웹 완성
- 현재 상태: Mediasoup(SFU) 기반으로 다자간 통화가 가능한 인프라는 구축되어 있으나, UI 및 로직상 1:1 연결에 최적화되어 있음.
- 개선 방향: 1:1 채팅방을 넘어 다수 참여자가 포함된 그룹 채팅방 기능을 구현하고, 여러 명의 비디오 스트림을 효율적으로 배치하려고함

2. Mediasoup 오케스트레이션 및 상태 동기화 (Redis 활용)
- 프론트와 백엔드를 큰 프로젝트로 해보는 것이 처음이라 폴더 구조를 나누는 것에 미숙했습니다. 이후에는 폴더나 파일들을 좀 더 세세하게 나
- 화면 크기에 따른 반응형 사이트로 리팩토링 진행
- 오류 발생 코드 수정

3. 오토스케일링(Auto-scaling) 및 인프라 안정화
- 현재 상태: 단일 EC2 인스턴스 환경에서 운영
- 개선 방향: 트래픽 증가에 따라 서버 자원을 유동적으로 조절할 수 있도록 AWS Auto Scaling을 적용하고, 로드 밸런서를 통해 부하 분산 처리를 자동화하여 서비스 안정성을 높일 예정

4. UX/UI 고도화 및 반응형 디자인 완성
- 현재 상태: 핵심 기능 위주의 인터페이스 구현
- 개선 방향: 사용자 경험(UX) 향상을 위해 모바일 환경에서도 최적화된 반응형 디자인을 보완하고, 미디어 연결 상태를 시각적으로 피드백해주는 인디케이터 등 세밀한 UI 요소를 추가할 예정


---
## 🔗 참고 자료
* Convex Docs - https://docs.convex.dev/home
* Clerk Docs - https://clerk.com/docs
* MediasoupDiscourseGroup- [https://mediasoup.discourse.group/t/mediasoup-doesnt-support-in-chrome-version-140/6857](https://mediasoup.discourse.group/t/urgent-upgrade-to-mediasoup-client-3-15-0-asap/6821)
* [WebRTC] mediasoup로 webRTC SFU 구현하기 - https://olive-su.tistory.com/390
* [WebRTC] EC2, Nginx로 WebSocket 서버 배포하기 + HTTPS/WSS - https://93960028.tistory.com/106
* Fullstack Notion Clone - https://youtu.be/0OaDyjB9Ib8?si=lKqW-kyjQPIpD_um



## 📃 라이선스
MIT License
