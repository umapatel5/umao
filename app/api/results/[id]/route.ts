import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-service";
import { getResultForUser } from "@/lib/results/result-repository";

type ResultRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: ResultRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to view this interview result." }, { status: 401 });
  }

  const result = await getResultForUser(user.id, params.id);

  if (!result) {
    return NextResponse.json({ error: "Interview result not found." }, { status: 404 });
  }

  return NextResponse.json({ result });
}
