# Context
Chrome M140부터 WebRTC RTP extension ID 처리 방식이 변경됨

# Problem
기존 mediasoup / mediasoup-client 조합에서 미디어 송수신 실패 발생
(InvalidAccessError)

# Decision
mediasoup@3.19.14 및 mediasoup-client 최신 버전으로 업그레이드
Node.js >=22 요구사항 수용

# Explanation
## RTP Extension ID 변경 배경
### Q. RTP Extension ID란 무엇인가? (비유: 택배 송장)
우리가 영상 통화를 할 때 단순히 영상 데이터만 보내는 게 아니라, "이 영상의 각도는 이렇고, 볼륨은 이 정도야" 같은 추가 정보(메타데이터)를 같이 보냄 => 이걸 RTP Extension이라고 함
- 기존 방식 (M140 이전): "1번 송장은 각도 정보, 2번 송장은 볼륨 정보"라고 미리 딱 정해놓고 통화를 시작함. 중간에 새 정보가 필요해도 번호가 안 바뀌니 서버가 헷갈릴 일이 없었음
- 변경된 방식 (M140 이후): 크롬이 이제는 효율성을 위해 ID 번호를 실시간으로, 혹은 동적으로 할당하기 시작 => "방금까진 1번이 각도였는데, 지금부터는 3번이 각도야!"라고 갑자기 바꿔버림

## SDP 처리 방식 변경
### Q. SDP 처리 방식이란?(비유: 통신 규약서 업데이트)
**SDP(Session Description Protocol)**는 브라우저와 서버가 통화하기 전에 주고받는 "우리 이렇게 통화하자"라는 계약서
- 과거의 mediasoup: "처음에 계약서 쓸 때 ID가 1번이었으니까, 통화 끝날 때까지 1번만 받을게"라고 생각
- 문제: 브라우저(Chrome M140+)는 계약서 내용은 그대로인데, 실제 통화 중에 ID 번호를 동적으로 바꿔서 데이터를 보냄
- 결과: 서버는 "어? 난 1번 기다리는데 왜 3번이 들어와? 이거 이상한 데이터네!"라며 연결을 끊어버림 => InvalidAccessError 오류 발생

# Consequences
- Node.js 18 이하 미지원
- Chrome 최신 버전과의 호환성 확보
