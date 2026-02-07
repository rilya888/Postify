import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { getEffectivePlan, getPlanCapabilities } from '@/lib/constants/plans';
import {
  createBrandVoice,
  getBrandVoiceById,
  getUserBrandVoices,
  updateBrandVoice,
  deleteBrandVoice,
  getActiveBrandVoice
} from '@/lib/services/brand-voice';

async function canUseBrandVoiceFeature(userId: string): Promise<boolean> {
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);
  const plan = getEffectivePlan(subscription, user?.createdAt ?? null);
  return getPlanCapabilities(plan).canUseBrandVoice;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    if (!(await canUseBrandVoiceFeature(userId))) {
      return new Response(
        JSON.stringify({ error: 'Brand voice is available on Enterprise plan only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    let brandVoices;
    
    if (activeOnly) {
      const activeVoice = await getActiveBrandVoice(userId);
      brandVoices = activeVoice ? [activeVoice] : [];
    } else {
      brandVoices = await getUserBrandVoices(userId);
    }

    return new Response(JSON.stringify(brandVoices), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching brand voices:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch brand voices' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    if (!(await canUseBrandVoiceFeature(userId))) {
      return new Response(
        JSON.stringify({ error: 'Brand voice is available on Enterprise plan only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.tone || !data.style || !data.sentenceStructure || !data.personality) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const brandVoice = await createBrandVoice(userId, {
      name: data.name,
      description: data.description,
      tone: data.tone,
      style: data.style,
      vocabulary: data.vocabulary || [],
      avoidVocabulary: data.avoidVocabulary || [],
      sentenceStructure: data.sentenceStructure,
      personality: data.personality,
      examples: data.examples || [],
    });

    return new Response(JSON.stringify(brandVoice), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating brand voice:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create brand voice' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    if (!(await canUseBrandVoiceFeature(userId))) {
      return new Response(
        JSON.stringify({ error: 'Brand voice is available on Enterprise plan only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Brand voice ID is required', { status: 400 });
    }

    const data = await request.json();

    // Check if the brand voice belongs to the user
    const existingVoice = await getBrandVoiceById(id, userId);
    if (!existingVoice) {
      return new Response('Brand voice not found or access denied', { status: 404 });
    }

    // Build partial update: only include defined fields
    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.tone !== undefined) updatePayload.tone = data.tone;
    if (data.style !== undefined) updatePayload.style = data.style;
    if (data.vocabulary !== undefined) updatePayload.vocabulary = data.vocabulary;
    if (data.avoidVocabulary !== undefined) updatePayload.avoidVocabulary = data.avoidVocabulary;
    if (data.sentenceStructure !== undefined) updatePayload.sentenceStructure = data.sentenceStructure;
    if (data.personality !== undefined) updatePayload.personality = data.personality;
    if (data.examples !== undefined) updatePayload.examples = data.examples;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    const updatedVoice = await updateBrandVoice(id, userId, updatePayload as Parameters<typeof updateBrandVoice>[2]);

    return new Response(JSON.stringify(updatedVoice), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating brand voice:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update brand voice' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    if (!(await canUseBrandVoiceFeature(userId))) {
      return new Response(
        JSON.stringify({ error: 'Brand voice is available on Enterprise plan only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Brand voice ID is required', { status: 400 });
    }

    // Check if the brand voice belongs to the user
    const existingVoice = await getBrandVoiceById(id, userId);
    if (!existingVoice) {
      return new Response('Brand voice not found or access denied', { status: 404 });
    }

    const success = await deleteBrandVoice(id, userId);
    if (!success) {
      return new Response('Failed to delete brand voice', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting brand voice:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete brand voice' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
