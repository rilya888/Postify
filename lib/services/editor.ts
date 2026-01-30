/**
 * Editor service for the content repurposing tool
 */

import { prisma } from '@/lib/db/prisma';
import { checkProjectQuota } from './quota';
import { Logger } from '@/lib/utils/logger';
import { logProjectChange } from './project-history';

/**
 * Update content for an output
 * Integrates with quota system and saves changes to database
 */
export async function updateOutputContent(
  outputId: string,
  userId: string,
  newContent: string,
  options?: {
    trackChanges?: boolean;
  }
) {
  // Check user quota before saving
  const quota = await checkProjectQuota(userId);
  if (!quota.canCreate) {
    throw new Error(`Quota exceeded: ${quota.current}/${quota.limit}`);
  }

  // Find the output and verify ownership
  const output = await prisma.output.findUnique({
    where: { id: outputId },
    include: { project: true }
  });

  if (!output || output.project.userId !== userId) {
    throw new Error('Output not found or access denied');
  }

  // Update the output content
  const updatedOutput = await prisma.output.update({
    where: { id: outputId },
    data: {
      content: newContent,
      isEdited: true,
      originalContent: output.originalContent || output.content
    }
  });

  // Log the change to history if requested
  if (options?.trackChanges !== false) {
    await logProjectChange(output.projectId, userId, 'edit_output', {
      outputId,
      platform: output.platform,
      wasEdited: true,
      contentLength: newContent.length,
    });
  }

  // Log update completion
  Logger.info('Output content updated', {
    userId,
    outputId,
    platform: output.platform,
  });

  return updatedOutput;
}

/**
 * Revert an output to its original content
 */
export async function revertOutputContent(
  outputId: string,
  userId: string
) {
  // Find the output and verify ownership
  const output = await prisma.output.findUnique({
    where: { id: outputId },
    include: { project: true }
  });

  if (!output || output.project.userId !== userId) {
    throw new Error('Output not found or access denied');
  }

  if (!output.originalContent) {
    throw new Error('No original content to revert to');
  }

  // Update the output content back to original
  const revertedOutput = await prisma.output.update({
    where: { id: outputId },
    data: {
      content: output.originalContent,
      isEdited: false,
    }
  });

  // Log the change to history
  await logProjectChange(output.projectId, userId, 'revert_output', {
    outputId,
    platform: output.platform,
    wasEdited: false,
  });

  // Log revert completion
  Logger.info('Output content reverted', {
    userId,
    outputId,
    platform: output.platform,
  });

  return revertedOutput;
}

/**
 * Get an output by ID with user verification
 */
export async function getOutputById(
  outputId: string,
  userId: string
) {
  const output = await prisma.output.findUnique({
    where: { id: outputId },
    include: { project: true }
  });

  if (!output || output.project.userId !== userId) {
    throw new Error('Output not found or access denied');
  }

  return output;
}