"use server"
import nodemailer from 'nodemailer';



const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_KEY,
    },
});

export const sendEmail = async (email: string, content: string) => {

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: '[Coope] 문의 주신 내용에 대한 답변드립니다',
        html: `
    <div style='
      text-align: center; 
      width: 50%; 
      height: 60%;
      margin: 15%;
      padding: 20px;
      box-shadow: 1px 1px 3px 0px #999;
      '><h2>${content}</h2><br/>
      <h4>전송된 답변은 고객지원 > 자주묻는질문 > 1:1문의 > 문의내역 의 각 문의내에서도 확인이 가능합니다.</h4></div>`,
    };

    try {
        // 콜백 대신 Promise 방식으로 하기

        const info = await transporter.sendMail(mailOptions);
        console.info("Email sent: " + info.response);

        return { success: true, message: "이메일 전송 성공" };
    } catch (error: unknown) {
        // error가 unknown일 때 처리 (빌드 에러 해결)
        if (error instanceof Error) {
            console.error("이메일 전송 중 오류:", error.message);
        } else {
            console.error("알 수 없는 오류 발생", error);
        }
        return { success: false, message: "이메일 전송 실패" };
    }
};