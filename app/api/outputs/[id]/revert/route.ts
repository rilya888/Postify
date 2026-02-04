/**
 * API route for reverting output content to original
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { revertOutputContent } from '@/lib/services/editor';

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const outputId = params.id;
    const revertedOutput = await revertOutputContent(outputId, session.user.id);

    return jsonResponse(revertedOutput, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found') || message.includes('access denied')) {
      return jsonResponse({ error: 'Output not found or access denied' }, 404);
    }
    if (message.includes('No original content')) {
      return jsonResponse(
        { error: 'No original content to revert to', details: message },
        400
      );
    }
    console.error('Error reverting output:', error);
    return jsonResponse({ error: 'Internal server error', details: message }, 500);
  }
}
