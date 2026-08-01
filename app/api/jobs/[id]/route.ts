import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const job = await getJob(params.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.recruiterId !== user.id) {
    return NextResponse.json({ error: "You don't have access to this role." }, { status: 403 });
  }

  const body = await req.json();
  const patch: { title?: string; requirement?: string; salaryRange?: string; status?: "open" | "closed" } = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.requirement === "string") patch.requirement = body.requirement;
  if (typeof body.salaryRange === "string") patch.salaryRange = body.salaryRange.trim();
  if (body.status === "open" || body.status === "closed") patch.status = body.status;

  const updated = await updateJob(params.id, patch);
  return NextResponse.json({ job: updated });
}
