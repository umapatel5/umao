import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-service";
import { getResultForUser } from "@/lib/results/result-repository";

type InterviewRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: InterviewRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to view this interview." }, { status: 401 });
  }

  const { id } = await params;
  const result = await getResultForUser(user.id, id);

  if (!result) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  return NextResponse.json({ result });
}
