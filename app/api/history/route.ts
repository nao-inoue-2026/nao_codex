import { NextResponse } from "next/server";
import { inputSchema, outputSchema } from "@/lib/schema";
import { readHistory, saveRecord } from "@/lib/storage";

export async function GET() {
  const list = await readHistory();
  return NextResponse.json({ ok: true, records: list });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = inputSchema.parse(body.input);
    const output = outputSchema.parse(body.output);
    const record = await saveRecord(input, output);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "保存に失敗しました" },
      { status: 400 }
    );
  }
}
