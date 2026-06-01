import { NextRequest, NextResponse } from "next/server";
import { notionVerifyDatabase } from "../notion-helpers";

export async function POST(req: NextRequest) {
  const { token, databaseId } = await req.json();
  if (!token || !databaseId) {
    return NextResponse.json({ error: "Token dan Database ID wajib diisi" }, { status: 400 });
  }
  const result = await notionVerifyDatabase(token, databaseId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Database tidak ditemukan" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, title: result.title });
}
