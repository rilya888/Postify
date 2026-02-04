/**
 * API route for restoring output content to a specific version
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { revertOutputToVersion } from '@/lib/services/editor';

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const outputId = params.id;
    const versionId = params.versionId;
    const revertedOutput = await revertOutputToVersion(
      outputId,
      versionId,
      session.user.id
    );

    return jsonResponse(revertedOutput, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found') || message.includes('access denied')) {
      return jsonResponse({ error: 'Output or version not found or access denied' }, 404);
    }
    if (message.includes('does not belong')) {
      return jsonResponse({ error: 'Version does not belong to this output' }, 400);
    }
    console.error('Error restoring output version:', error);
    return jsonResponse({ error: 'Internal server error', details: message }, 500);
  }
}
