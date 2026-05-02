import { NextResponse } from "next/server";
import { consumePasswordResetToken } from "@/lib/db";
import { hashPassword, isStrongEnoughPassword } from "@/lib/passwords";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string; password?: string };
    const token = body.token?.trim();
    const password = body.password ?? "";

    if (!token) {
      return NextResponse.json({ error: "Reset token is missing." }, { status: 400 });
    }

    if (!isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await consumePasswordResetToken(token, hashPassword(password));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset your password.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}