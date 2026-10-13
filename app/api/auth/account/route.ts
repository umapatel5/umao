import { NextResponse } from "next/server";
import { updateAccount } from "@/lib/auth/auth-service";
import { guardRequest, readJson, requestError } from "@/lib/security/request-guard";

export async function PATCH(request: Request) {
  const guard = await guardRequest(request, "account", 10);
  if (guard.error) return guard.error;
  let body;
  try { body = await readJson(request, 128_000) as Record<string, string>; } catch (error) { return requestError(error); }
  if (!body || (body.name === undefined && body.newPassword === undefined) || ["name", "currentPassword", "newPassword"].some((key) => body[key] !== undefined && (typeof body[key] !== "string" || (key !== "currentPassword" && body[key].length > 128)))) {
    return NextResponse.json({ error: "Invalid account update." }, { status: 400 });
  }
  try {
    const result = await updateAccount({ name: body.name, currentPassword: body.currentPassword, newPassword: body.newPassword });
    return NextResponse.json(result, { status: "error" in result ? result.status : 200 });
  } catch {
    return NextResponse.json({ error: "Account changes could not be saved. Try again later." }, { status: 503 });
  }
}
