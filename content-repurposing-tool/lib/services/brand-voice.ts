import { prisma } from "@/lib/db/prisma";
import { BrandVoice } from "@prisma/client";

/**
 * Create a new brand voice profile for a user
 */
export async function createBrandVoice(
  userId: string,
  data: {
    name: string;
    description?: string;
    tone: string;
    style: string;
    vocabulary: string[];
    avoidVocabulary: string[];
    sentenceStructure: string;
    personality: string;
    examples: string[];
  }
): Promise<BrandVoice> {
  return await prisma.brandVoice.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      tone: data.tone,
      style: data.style,
      vocabulary: data.vocabulary,
      avoidVocabulary: data.avoidVocabulary,
      sentenceStructure: data.sentenceStructure,
      personality: data.personality,
      examples: data.examples,
    },
  });
}

/**
 * Get a brand voice by ID
 */
export async function getBrandVoiceById(
  id: string,
  userId: string
): Promise<BrandVoice | null> {
  return await prisma.brandVoice.findUnique({
    where: {
      id,
      userId,
    },
  });
}

/**
 * Get all brand voices for a user
 */
export async function getUserBrandVoices(userId: string): Promise<BrandVoice[]> {
  return await prisma.brandVoice.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get the active brand voice for a user
 */
export async function getActiveBrandVoice(userId: string): Promise<BrandVoice | null> {
  return await prisma.brandVoice.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });
}

/**
 * Update a brand voice
 */
export async function updateBrandVoice(
  id: string,
  userId: string,
  data: Partial<{
    name: string;
    description?: string;
    tone: string;
    style: string;
    vocabulary: string[];
    avoidVocabulary: string[];
    sentenceStructure: string;
    personality: string;
    examples: string[];
    isActive: boolean;
  }>
): Promise<BrandVoice> {
  // If setting this as active, deactivate others
  if (data.isActive === true) {
    await prisma.brandVoice.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  return await prisma.brandVoice.update({
    where: {
      id,
      userId,
    },
    data,
  });
}

/**
 * Delete a brand voice
 */
export async function deleteBrandVoice(id: string, userId: string): Promise<boolean> {
  try {
    await prisma.brandVoice.delete({
      where: {
        id,
        userId,
      },
    });
    return true;
  } catch (error) {
    console.error("Error deleting brand voice:", error);
    return false;
  }
}

/**
 * Set a brand voice as active for a user
 */
export async function setActiveBrandVoice(id: string, userId: string): Promise<boolean> {
  try {
    // First, deactivate all brand voices for the user
    await prisma.brandVoice.updateMany({
      where: {
        userId,
      },
      data: {
        isActive: false,
      },
    });

    // Then activate the selected one
    await prisma.brandVoice.update({
      where: {
        id,
        userId,
      },
      data: {
        isActive: true,
      },
    });

    return true;
  } catch (error) {
    console.error("Error setting active brand voice:", error);
    return false;
  }
}