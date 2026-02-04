import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { checkAudioQuota } from "@/lib/services/quota";

/**
 * GET /api/subscription/features
 * Returns plan features for the current user (Stage 3: text vs text_audio).
 * UI uses this to show/hide "Upload audio" and display limits.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audio = await checkAudioQuota(session.user.id);

  return NextResponse.json({
    planType: audio.planType,
    canUseAudio: audio.allowed,
    audioLimits:
      audio.limitMinutes != null
        ? { usedMinutes: audio.usedMinutes, limitMinutes: audio.limitMinutes }
        : null,
  });
}
