import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";
import { PlanType } from "@prisma/client";
import { z } from "zod";
import { PLAN_LIMITS, getAudioLimits } from "@/lib/constants/plans";
import { addMonths } from "@/lib/utils/date";

const patchBodySchema = z.object({
  plan: z.enum(["free", "pro", "enterprise"]).optional(),
  subscriptionStatus: z.enum(["active", "canceled", "past_due"]).optional(),
  currentPeriodEnd: z.string().datetime().optional().nullable(), // ISO date or null to clear
  role: z.enum(["user", "admin"]).optional(),
  resetAudioMinutes: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return createErrorResponse({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { projects: true } },
      subscription: true,
      projects: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: { select: { outputs: true } },
        },
      },
    },
  });

  if (!user) {
    return createErrorResponse({ error: "User not found", code: "NOT_FOUND" }, 404);
  }

  return createSuccessResponse(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session) || !session) {
    return createErrorResponse({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const { id: targetUserId } = await params;
  const body = await request.json();
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse(
      { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
      400
    );
  }

  const { plan, subscriptionStatus, currentPeriodEnd, role, resetAudioMinutes } = parsed.data;

  // Prevent admin from removing their own admin role or last admin
  if (role === "user" && targetUserId === session.user.id) {
    return createErrorResponse(
      { error: "Cannot remove your own admin role", code: "FORBIDDEN" },
      403
    );
  }
  if (role === "user" && targetUserId !== session.user.id) {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    const targetIsAdmin = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });
    if (adminCount <= 1 && targetIsAdmin?.role === "admin") {
      return createErrorResponse(
        { error: "Cannot remove the last admin", code: "FORBIDDEN" },
        403
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) {
    updates.role = role;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: updates,
    });
  }

  const subUpdates: Record<string, unknown> = {};
  if (plan !== undefined) {
    subUpdates.plan = plan;
    subUpdates.planType =
      plan === "pro" ? PlanType.TEXT : plan === "enterprise" ? PlanType.TEXT_AUDIO : PlanType.TEXT;
    const audioLimits = plan === "enterprise" ? getAudioLimits("enterprise") : null;
    if (audioLimits) {
      subUpdates.audioMinutesLimit = audioLimits.audioMinutesPerMonth;
      subUpdates.audioMinutesResetAt = addMonths(new Date(), 1);
    } else if (plan === "free" || plan === "pro") {
      subUpdates.audioMinutesLimit = null;
      subUpdates.audioMinutesResetAt = null;
    }
  }
  if (subscriptionStatus !== undefined) subUpdates.status = subscriptionStatus;
  if (currentPeriodEnd !== undefined) subUpdates.currentPeriodEnd = currentPeriodEnd === null ? null : new Date(currentPeriodEnd);
  if (resetAudioMinutes === true) subUpdates.audioMinutesUsedThisPeriod = 0;

  if (Object.keys(subUpdates).length > 0) {
    await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        planType: PlanType.TEXT,
        ...(subUpdates as {
          plan?: string;
          planType?: PlanType;
          status?: string;
          audioMinutesUsedThisPeriod?: number;
          audioMinutesLimit?: number | null;
          audioMinutesResetAt?: Date | null;
          currentPeriodEnd?: Date | null;
        }),
      },
      update: subUpdates as {
        plan?: string;
        planType?: PlanType;
        status?: string;
        audioMinutesUsedThisPeriod?: number;
        audioMinutesLimit?: number | null;
        audioMinutesResetAt?: Date | null;
        currentPeriodEnd?: Date | null;
      },
    });
  }

  const updated = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscription: { select: { plan: true, status: true, audioMinutesUsedThisPeriod: true } },
    },
  });

  return createSuccessResponse(updated);
}
