import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateOutput } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const output = await generateOutput(body);
    return NextResponse.json({ ok: true, output });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "出力の形式が不正です。再生成してください。", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "生成に失敗しました" },
      { status: 500 }
    );
  }
}
