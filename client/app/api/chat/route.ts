import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, previousMessages } = await req.json();

    // 이전 메시지 형식 변환
    const formattedMessages = previousMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content
    }));

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `당신은 GPT-3.5-turbo 모델을 기반으로 한 웹 애플리케이션의 AI 어시스턴트입니다. 
          이 웹사이트는 문서 관리와 협업을 위한 플랫폼입니다.
          주요 기능으로는:
          - 문서 생성 및 관리
          - 실시간 협업
          - 검색 기능
          - AI 어시스턴트 (당신)
          등이 있습니다.
          
          사용자의 질문에 대해 웹사이트의 기능과 관련된 정확하고 상세한 답변을 제공해주세요.
          특히 버튼이나 UI 요소들의 기능에 대해 명확하게 설명해주세요.
          답변은 친절하고 전문적인 톤으로 작성해주세요.
          
          만약 사용자가 당신의 모델 버전에 대해 질문하면, GPT-3.5-turbo 모델을 사용한다고 정확하게 알려주세요.`,
        },
        ...formattedMessages,
        {
          role: "user",
          content: message,
        },
      ],
      model: "gpt-3.5-turbo",
      stream: true
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 