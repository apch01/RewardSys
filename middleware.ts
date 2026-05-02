export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!api/auth|signin|signup|forgot-password|reset-password|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon.svg).*)"]
};