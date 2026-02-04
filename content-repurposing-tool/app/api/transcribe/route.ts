import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { canUseAudio, getAudioLimits } from "@/lib/constants/plans";
import type { Plan } from "@/lib/constants/plans";
import { checkAudioQuota, incrementAudioMinutesUsed } from "@/lib/services/quota";
import { transcribeAudioFile, normalizeTranscript } from "@/lib/services/transcription";
import { WHISPER_COST_PER_MINUTE } from "@/lib/constants/ai-models";
import fs from "fs/promises";
import path from "path";
import os from "os";

const ALLOWED_MIMES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
];

/**
 * POST /api/transcribe
 * Transcribe an audio file only (no project update).
 * Plan text_audio required; counts toward audio quota.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    const plan = (subscription?.plan ?? "free") as Plan;
    if (!canUseAudio(plan)) {
      return Response.json(
        { error: "Audio not available on your plan. Upgrade to Text + Audio." },
        { status: 400 }
      );
    }

    const audioLimits = getAudioLimits(plan);
    if (!audioLimits) {
      return Response.json({ error: "Audio limits not configured" }, { status: 400 });
    }

    const audioQuota = await checkAudioQuota(userId);
    if (!audioQuota.allowed) {
      return Response.json({ error: "Audio quota not available" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Missing or invalid file", details: "Send a single audio file as 'file'" },
        { status: 400 }
      );
    }

    const maxBytes = audioLimits.maxAudioFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return Response.json(
        {
          error: "File too large",
          details: `Max ${audioLimits.maxAudioFileSizeMb} MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)} MB.`,
        },
        { status: 400 }
      );
    }

    const mime = file.type?.toLowerCase() ?? "";
    const allowed = ALLOWED_MIMES.some((m) => mime === m) || mime.startsWith("audio/");
    if (!allowed) {
      return Response.json(
        { error: "Invalid file type", details: "Use MP3, M4A, WAV, WebM, OGG, or FLAC." },
        { status: 400 }
      );
    }

    const ext = mime.includes("mpeg") || mime.includes("mp3") ? "mp3" : mime.includes("m4a") || mime.includes("mp4") ? "m4a" : "webm";
    const tempPath = path.join(os.tmpdir(), `transcribe-${userId}-${Date.now()}.${ext}`);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(tempPath, buffer);
    } catch {
      return Response.json({ error: "Failed to process file" }, { status: 500 });
    }

    try {
      const result = await transcribeAudioFile(tempPath);
      const normalized = normalizeTranscript(result.text);
      const durationMinutes = (result.durationSeconds ?? 0) / 60;

      if (durationMinutes > 0 && !audioQuota.canAddMinutes(durationMinutes)) {
        return Response.json(
          {
            error: "Audio quota exceeded",
            details: `This audio is ${durationMinutes.toFixed(1)} min. You have ${(audioQuota.limitMinutes ?? 0) - audioQuota.usedMinutes} min left this period.`,
          },
          { status: 400 }
        );
      }

      const costEstimate =
        durationMinutes > 0 ? durationMinutes * WHISPER_COST_PER_MINUTE : undefined;

      await incrementAudioMinutesUsed(userId, durationMinutes);

      return Response.json({
        text: normalized,
        rawText: result.text,
        language: result.language,
        durationSeconds: result.durationSeconds,
        costEstimate,
      });
    } finally {
      try {
        await fs.unlink(tempPath);
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.error("transcribe API error:", err);
    return Response.json(
      { error: "Transcription failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
