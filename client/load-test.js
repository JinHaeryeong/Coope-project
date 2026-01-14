import http from "k6/http";
import { sleep, check } from "k6";

// 1. 테스트 설정
export const options = {
    stages: [
        { duration: "10s", target: 50 }, // 10초 동안 유저 50명으로 증가
        { duration: "20s", target: 100 }, // 20초 동안 유저 100명으로 증가 및 유지
        { duration: "10s", target: 0 }, // 10초 동안 서서히 종료
    ],
    thresholds: {
        // 95%의 유저가 0.2초(200ms) 이내에 응답을 받아야 함
        http_req_duration: ["p(95)<200"],
        // 에러율이 0.1% 미만이어야 함 (사실상 0%여야 성공)
        http_req_failed: ["rate<0.001"],
    },
};

export default function () {
    // 테스트할 주소
    const url = "http://localhost:3000/notice";

    const res = http.get(url);

    // 2. 검증 항목
    check(res, {
        "상태코드 200(성공)": (r) => r.status === 200,
        "응답 시간 0.2초 이내": (r) => r.timings.duration < 200,
    });

    // sleep(1); // 실제 유저처럼 1초 대기
}
