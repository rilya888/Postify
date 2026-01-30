/**
 * API route for updating output content
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { updateOutputContent } from '@/lib/services/editor';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const outputId = params.id;

    const { content } = await request.json();

    if (typeof content !== 'string') {
      return new Response('Invalid content', { status: 400 });
    }

    const updatedOutput = await updateOutputContent(outputId, userId, content);

    return new Response(JSON.stringify(updatedOutput), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating output:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const outputId = params.id;

    // Import prisma here to avoid top-level import issues
    const { prisma } = await import('@/lib/db/prisma');

    // Find the output and verify ownership
    const output = await prisma.output.findUnique({
      where: { id: outputId },
      include: { project: true }
    });

    if (!output || output.project.userId !== userId) {
      return new Response('Output not found or access denied', { status: 404 });
    }

    return new Response(JSON.stringify(output), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching output:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}