import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateContentPack } from "@/lib/services/content-pack";
import { getActiveBrandVoice } from "@/lib/services/brand-voice";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import type { Plan } from "@/lib/constants/plans";

/**
 * POST /api/projects/[id]/content-pack
 * Build and return Content Pack for the project (no post generation).
 * Auth + project ownership required.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id: projectId } = await context.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.userId !== userId) {
      return Response.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    const plan = (subscription?.plan ?? "free") as Plan;
    const maxChars = PLAN_LIMITS[plan]?.maxCharactersPerContent ?? PLAN_LIMITS.free.maxCharactersPerContent;
    if (project.sourceContent.length > maxChars) {
      return Response.json(
        { error: "Source content exceeds plan limit" },
        { status: 400 }
      );
    }

    const brandVoice = await getActiveBrandVoice(userId);
    const pack = await getOrCreateContentPack(projectId, userId, project.sourceContent, {
      brandVoiceId: brandVoice?.id ?? undefined,
      brandVoiceUpdatedAt: brandVoice?.updatedAt ? brandVoice.updatedAt.toISOString() : undefined,
      plan,
    });

    return Response.json({ pack });
  } catch (err) {
    console.error("content-pack API error:", err);
    return Response.json(
      { error: "Failed to build content pack", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
