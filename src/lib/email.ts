import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const from = process.env.EMAIL_FROM ?? (user ? `KindPoints <${user}>` : undefined);

  if (!user || !pass || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Password reset link for ${input.to}: ${input.resetUrl}`);
      return;
    }
    throw new Error("Password reset email could not be sent.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      replyTo: process.env.EMAIL_REPLY_TO,
      subject: "Reset your KindPoints password",
      html: `<p>Use this link to reset your KindPoints password:</p><p><a href="${input.resetUrl}">${input.resetUrl}</a></p><p>This link expires in 1 hour.</p>`
    });
  } catch (error) {
    console.error("Gmail SMTP password reset email failed", error);
    const detail = error instanceof Error ? error.message : undefined;

    if (process.env.NODE_ENV !== "production" && detail) {
      throw new Error(`Password reset email could not be sent: ${detail}`);
    }

    throw new Error("Password reset email could not be sent.");
  }
}
