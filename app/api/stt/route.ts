import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { audioContent } = await req.json();

    if (!audioContent) {
      return NextResponse.json({ error: "오디오 데이터가 없습니다." }, { status: 400 });
    }

    // base64 데이터에서 실제 오디오 데이터만 추출
    const base64Audio = audioContent.replace(/^data:audio\/\w+;codecs=opus;base64,/, '');

    // base64를 Buffer로 변환
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Whisper API 호출을 위한 파일 생성
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    // Whisper API 호출
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "ko",
      response_format: "text"
    });

    // 응답이 문자열이므로 그대로 transcript로 사용
    const transcript = response.toString();

    if (!transcript || transcript.trim() === "") {
      return NextResponse.json({ error: "음성 인식 결과가 없습니다." }, { status: 400 });
    }

    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    console.error("STT(음성 인식) 처리 중 오류 발생:", err);

    let errorMessage = "음성 인식(STT) 변환에 실패했습니다.";

    // 에러 타입 가드 (instanceof Error)
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 