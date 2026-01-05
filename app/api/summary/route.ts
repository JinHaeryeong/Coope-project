import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "요약할 텍스트가 없습니다." }, { status: 400 });
    }

    const systemPrompt = `
당신은 텍스트 요약 전문가입니다. 사용자가 제공한 텍스트의 **주요 내용**만 간결하고 명확하게 한글로 요약해 주세요. 
불필요한 세부 내용, 키워드, 부가 설명은 포함하지 마세요.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const summary = completion.choices[0]?.message?.content || "";

    if (!summary) {
      return NextResponse.json({ error: "텍스트 정리 실패" }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    console.error("텍스트 정리 중 오류:", error);

    let errorMessage = "텍스트 변환에 실패했습니다.";

    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
