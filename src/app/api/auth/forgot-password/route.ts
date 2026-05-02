import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string };
    const email = body.email?.toLowerCase().trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const token = await createPasswordResetToken(email);
    let devResetUrl: string | undefined;

    if (token) {
      const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail({ to: email, resetUrl });
      if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) devResetUrl = resetUrl;
    }

    return NextResponse.json({ ok: true, devResetUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send password reset email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}