/**
 * API route for updating output content
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { updateOutputContent } from '@/lib/services/editor';
import { prisma } from '@/lib/db/prisma';
import { checkOutputUpdateRateLimit } from '@/lib/utils/rate-limit';
import { sanitizeContent } from '@/lib/utils/editor';
import { PLATFORM_CHARACTER_LIMITS } from '@/lib/constants/editor';
import type { Platform } from '@/lib/constants/platforms';

function jsonResponse(body: object, status: number, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    const outputId = params.id;

    const rateLimit = checkOutputUpdateRateLimit(userId);
    if (!rateLimit.allowed) {
      return jsonResponse(
        {
          error: 'Too many requests',
          details: 'Rate limit exceeded. Try again later.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        429,
        rateLimit.retryAfterSeconds
          ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
          : undefined
      );
    }

    const output = await prisma.output.findUnique({
      where: { id: outputId },
      include: { project: true },
    });

    if (!output || output.project.userId !== userId) {
      return jsonResponse(
        { error: 'Output not found or access denied' },
        404
      );
    }

    let body: { content?: string };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { content } = body;
    if (typeof content !== 'string') {
      return jsonResponse({ error: 'Invalid content', details: 'content must be a string' }, 400);
    }

    const limit = PLATFORM_CHARACTER_LIMITS[output.platform as Platform];
    if (content.length > limit) {
      return jsonResponse(
        {
          error: 'Content exceeds platform limit',
          details: `Maximum ${limit} characters for ${output.platform}. Current: ${content.length}.`,
        },
        400
      );
    }

    const sanitized = sanitizeContent(content);
    const updatedOutput = await updateOutputContent(outputId, userId, sanitized);

    return jsonResponse(updatedOutput, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.startsWith('Quota exceeded')) {
      return jsonResponse(
        { error: 'Quota exceeded', details: message },
        403
      );
    }
    console.error('Error updating output:', error);
    return jsonResponse(
      { error: 'Internal server error', details: message },
      500
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    const outputId = params.id;

    const output = await prisma.output.findUnique({
      where: { id: outputId },
      include: { project: true },
    });

    if (!output || output.project.userId !== userId) {
      return jsonResponse(
        { error: 'Output not found or access denied' },
        404
      );
    }

    return jsonResponse(output, 200);
  } catch (error) {
    console.error('Error fetching output:', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : undefined,
      },
      500
    );
  }
}