import { NextResponse } from "next/server";
import { updateAccount } from "@/lib/auth/auth-service";

export async function PATCH(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || (body.name === undefined && body.newPassword === undefined) || ["name", "currentPassword", "newPassword"].some((key) => body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > 128))) {
    return NextResponse.json({ error: "Invalid account update." }, { status: 400 });
  }
  try {
    const result = await updateAccount({ name: body.name, currentPassword: body.currentPassword, newPassword: body.newPassword });
    return NextResponse.json(result, { status: "error" in result ? result.status : 200 });
  } catch {
    return NextResponse.json({ error: "Account changes could not be saved. Try again later." }, { status: 503 });
  }
}
