import { NextResponse } from "next/server";
import { createParentWithPassword } from "@/lib/db";
import { hashPassword, isStrongEnoughPassword } from "@/lib/passwords";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string };
    const email = body.email?.toLowerCase().trim();
    const password = body.password ?? "";
    const name = body.name?.trim() || null;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (!isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await createParentWithPassword({ email, name, passwordHash: hashPassword(password) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create your account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}