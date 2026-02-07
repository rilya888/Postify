import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { Logger } from "@/lib/utils/logger";
import { getEffectivePlan, canUseAudio, getAudioLimits } from "@/lib/constants/plans";
import { checkAudioQuota, incrementAudioMinutesUsed } from "@/lib/services/quota";
import { checkTranscribeRateLimit } from "@/lib/utils/rate-limit";
import {
  transcribeAudioFile,
  normalizeTranscript as normalizeTranscriptText,
} from "@/lib/services/transcription";
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
 * POST /api/projects/[id]/ingest-audio
 * Ingest audio file: transcribe with Whisper, save Transcript, update project.sourceContent, delete file (Stage 4).
 * Only for plan text_audio; rejects if plan is text.
 */
export async function POST(
  request: NextRequest,
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

    const [user, subscription] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
      prisma.subscription.findUnique({ where: { userId } }),
    ]);
    const plan = getEffectivePlan(subscription, user?.createdAt ?? null);
    if (!canUseAudio(plan)) {
      return Response.json(
        {
          error: "Audio upload not available",
          details: "Your plan does not include audio. Upgrade to Max or Enterprise.",
        },
        { status: 400 }
      );
    }

    const audioLimits = getAudioLimits(plan);
    if (!audioLimits) {
      return Response.json(
        { error: "Audio limits not configured for your plan" },
        { status: 400 }
      );
    }

    const audioQuota = await checkAudioQuota(userId);
    if (!audioQuota.allowed) {
      return Response.json(
        { error: "Audio quota not available for your plan" },
        { status: 400 }
      );
    }

    const transcribeRateLimit = checkTranscribeRateLimit(userId, plan);
    if (!transcribeRateLimit.allowed) {
      const retryAfter = transcribeRateLimit.retryAfterSeconds ?? 3600;
      return Response.json(
        { error: "Too many transcription requests", details: "Rate limit exceeded. Try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
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
    const tempPath = path.join(os.tmpdir(), `ingest-${projectId}-${Date.now()}.${ext}`);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(tempPath, buffer);
    } catch (writeErr) {
      Logger.error("Failed to write temp audio file", writeErr as Error, { projectId });
      return Response.json(
        { error: "Failed to process file" },
        { status: 500 }
      );
    }

    const sourceAsset = await prisma.sourceAsset.create({
      data: {
        projectId,
        userId,
        type: "audio",
        fileUrlOrPath: tempPath,
      },
    });

    let result: { text: string; language?: string; durationSeconds?: number };
    try {
      result = await transcribeAudioFile(tempPath);
    } catch (transcribeErr) {
      Logger.error("Transcription failed", transcribeErr as Error, { projectId, sourceAssetId: sourceAsset.id });
      await prisma.transcript.create({
        data: {
          sourceAssetId: sourceAsset.id,
          rawTranscript: "",
          status: "failed",
        },
      });
      try {
        await fs.unlink(tempPath);
      } catch {
        // ignore
      }
      await prisma.sourceAsset.update({
        where: { id: sourceAsset.id },
        data: { fileUrlOrPath: null },
      });
      return Response.json(
        {
          error: "Transcription failed",
          details: transcribeErr instanceof Error ? transcribeErr.message : "Unknown error",
        },
        { status: 502 }
      );
    }

    try {
      await fs.unlink(tempPath);
    } catch {
      // ignore
    }

    const normalized = normalizeTranscriptText(result.text);
    const durationMinutes = (result.durationSeconds ?? 0) / 60;

    if (durationMinutes > 0 && !audioQuota.canAddMinutes(durationMinutes)) {
      await prisma.transcript.create({
        data: {
          sourceAssetId: sourceAsset.id,
          rawTranscript: result.text,
          normalizedTranscript: normalized,
          language: result.language ?? undefined,
          durationSeconds: result.durationSeconds ?? undefined,
          transcriptionModel: "whisper-1",
          status: "completed",
        },
      });
      await prisma.sourceAsset.update({
        where: { id: sourceAsset.id },
        data: { fileUrlOrPath: null, durationSeconds: result.durationSeconds ?? undefined },
      });
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

    await prisma.transcript.create({
      data: {
        sourceAssetId: sourceAsset.id,
        rawTranscript: result.text,
        normalizedTranscript: normalized,
        language: result.language ?? undefined,
        durationSeconds: result.durationSeconds ?? undefined,
        transcriptionModel: "whisper-1",
        costEstimate: costEstimate ?? undefined,
        status: "completed",
      },
    });

    await prisma.sourceAsset.update({
      where: { id: sourceAsset.id },
      data: { fileUrlOrPath: null, durationSeconds: result.durationSeconds ?? undefined },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { sourceContent: normalized, updatedAt: new Date() },
    });

    if (subscription && subscription.audioMinutesLimit == null && audioLimits) {
      await prisma.subscription.update({
        where: { userId },
        data: { audioMinutesLimit: audioLimits.audioMinutesPerMonth },
      });
    }
    await incrementAudioMinutesUsed(userId, durationMinutes);

    return Response.json({
      success: true,
      transcript: {
        rawTranscript: result.text,
        normalizedTranscript: normalized,
        language: result.language,
        durationSeconds: result.durationSeconds,
      },
      projectId,
    });
  } catch (err) {
    Logger.error("Error in ingest-audio", err as Error, {
      stack: process.env.NODE_ENV === "development" ? (err instanceof Error ? err.stack : undefined) : undefined,
    });
    return Response.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
