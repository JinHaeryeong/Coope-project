"use server"
import nodemailer from 'nodemailer';

// 서버 실행 시점에 환경 변수 체크
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // 465 포트는 true, 587 포트는 false
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_KEY,
    },
});

export const sendEmail = async (email: string, content: string) => {
    // 1. 환경 변수 누락 확인
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_KEY) {
        console.error("이메일 설정(GMAIL_USER 또는 GMAIL_APP_KEY)이 없습니다.");
        return { success: false, message: "서버 설정 오류로 메일을 보낼 수 없습니다." };
    }

    const mailOptions = {
        from: `Coope 고객지원 <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '[Coope] 문의 주신 내용에 대한 답변드립니다',
        html: `
        <div style="
            text-align: center; 
            max-width: 600px; 
            margin: 0 auto;
            padding: 40px 20px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            font-family: 'Pretendard', sans-serif;
            color: #111827;
        ">
            <h2 style="margin-bottom: 24px;">문의 답변 안내</h2>
            <div style="
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 24px;
                line-height: 1.6;
            ">
                ${content}
            </div>
            <p style="font-size: 14px; color: #6b7280;">
                본 답변은 고객지원 > 자주묻는질문 > 1:1문의 > 문의내역에서도 확인이 가능합니다.
            </p>
        </div>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.info("이메일 전송 완료: " + info.response);
        return { success: true, message: "이메일 전송 성공" };
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("이메일 전송 중 오류:", error.message);
        } else {
            console.error("알 수 없는 오류 발생", error);
        }
        return { success: false, message: "이메일 전송 실패" };
    }
};