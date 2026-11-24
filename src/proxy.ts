import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional password gate for public deployments, so strangers can't spend the
 * Anthropic credits behind /api/copilotkit. When DEMO_PASSWORD is set, every
 * page and API route asks for it once (HTTP Basic auth; the username is
 * ignored). When it isn't set, as in local dev, the app stays open.
 */
export function proxy(request: NextRequest) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) return NextResponse.next();

  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    if (safeEqual(supplied, password)) return NextResponse.next();
  }

  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Scrum board demo", charset="UTF-8"' },
  });
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const config = {
  // Everything, including /api/copilotkit, except build assets and the icon.
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};
