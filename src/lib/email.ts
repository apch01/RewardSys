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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      reply_to: replyTo,
      subject: "Reset your KindPoints password",
      html: `<p>Use this link to reset your KindPoints password:</p><p><a href="${input.resetUrl}">${input.resetUrl}</a></p><p>This link expires in 1 hour.</p>`
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend password reset email failed", { status: response.status, detail });
    throw new Error("Password reset email could not be sent.");
  }
}