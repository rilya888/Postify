/**
 * API route for listing output version history
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getOutputVersions } from '@/lib/services/editor';

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const outputId = params.id;
    const versions = await getOutputVersions(outputId, session.user.id);

    return jsonResponse({ versions }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found') || message.includes('access denied')) {
      return jsonResponse({ error: 'Output not found or access denied' }, 404);
    }
    console.error('Error fetching output versions:', error);
    return jsonResponse({ error: 'Internal server error', details: message }, 500);
  }
}
