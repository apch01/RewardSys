import { Resend } from "resend";

export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "KindPoints <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Password reset link for ${input.to}: ${input.resetUrl}`);
    }
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: "Reset your KindPoints password",
    html: `<p>Use this link to reset your KindPoints password:</p><p><a href="${input.resetUrl}">${input.resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    ...(replyTo ? { replyTo } : {})
  });

  if (error) {
    const detail = getResendErrorMessage(error);
    console.error("Resend password reset email failed", error);

    if (process.env.NODE_ENV !== "production" && detail) {
      throw new Error(`Password reset email could not be sent: ${detail}`);
    }

    throw new Error("Password reset email could not be sent.");
  }
}

function getResendErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}
