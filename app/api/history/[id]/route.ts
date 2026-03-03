import { NextResponse } from "next/server";
import { getRecord } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const record = await getRecord(params.id);
  if (!record) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, record });
}
