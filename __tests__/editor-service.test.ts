/**
 * Unit tests for editor service (updateOutputContent, revertOutputContent, getOutputById)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaOutputFindUnique = vi.fn();
const mockPrismaOutputUpdate = vi.fn();
const mockCheckProjectQuota = vi.fn();
const mockLogProjectChange = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    output: {
      findUnique: (...args: unknown[]) => mockPrismaOutputFindUnique(...args),
      update: (...args: unknown[]) => mockPrismaOutputUpdate(...args),
    },
  },
}));

vi.mock("@/lib/services/quota", () => ({
  checkProjectQuota: (...args: unknown[]) => mockCheckProjectQuota(...args),
}));

vi.mock("@/lib/services/project-history", () => ({
  logProjectChange: (...args: unknown[]) => mockLogProjectChange(...args),
}));

vi.mock("@/lib/utils/logger", () => ({
  Logger: { info: vi.fn() },
}));

import {
  updateOutputContent,
  revertOutputContent,
  getOutputById,
} from "@/lib/services/editor";

describe("editor service", () => {
  const outputId = "out-1";
  const userId = "user-1";
  const projectId = "proj-1";
  const mockOutput = {
    id: outputId,
    projectId,
    platform: "linkedin",
    content: "Original content",
    originalContent: null as string | null,
    isEdited: false,
    project: { userId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckProjectQuota.mockResolvedValue({ canCreate: true, current: 1, limit: 10 });
    mockPrismaOutputFindUnique.mockResolvedValue(mockOutput);
    mockPrismaOutputUpdate.mockImplementation((args: { where: { id: string }; data: object }) =>
      Promise.resolve({ ...mockOutput, ...args.data })
    );
    mockLogProjectChange.mockResolvedValue(undefined);
  });

  describe("updateOutputContent", () => {
    it("throws when quota exceeded", async () => {
      mockCheckProjectQuota.mockResolvedValueOnce({ canCreate: false, current: 10, limit: 10 });

      await expect(
        updateOutputContent(outputId, userId, "New content")
      ).rejects.toThrow("Quota exceeded");
      expect(mockPrismaOutputUpdate).not.toHaveBeenCalled();
    });

    it("throws when output not found", async () => {
      mockPrismaOutputFindUnique.mockResolvedValueOnce(null);

      await expect(
        updateOutputContent(outputId, userId, "New content")
      ).rejects.toThrow("not found");
      expect(mockPrismaOutputUpdate).not.toHaveBeenCalled();
    });

    it("throws when output belongs to another user", async () => {
      mockPrismaOutputFindUnique.mockResolvedValueOnce({
        ...mockOutput,
        project: { userId: "other-user" },
      });

      await expect(
        updateOutputContent(outputId, userId, "New content")
      ).rejects.toThrow("access denied");
      expect(mockPrismaOutputUpdate).not.toHaveBeenCalled();
    });

    it("updates content and logs history on success", async () => {
      const result = await updateOutputContent(outputId, userId, "Updated text");

      expect(result.content).toBe("Updated text");
      expect(result.isEdited).toBe(true);
      expect(mockPrismaOutputUpdate).toHaveBeenCalledWith({
        where: { id: outputId },
        data: expect.objectContaining({
          content: "Updated text",
          isEdited: true,
          originalContent: "Original content",
        }),
      });
      expect(mockLogProjectChange).toHaveBeenCalledWith(
        projectId,
        userId,
        "edit_output",
        expect.any(Object)
      );
    });
  });

  describe("revertOutputContent", () => {
    beforeEach(() => {
      mockPrismaOutputFindUnique.mockResolvedValue({
        ...mockOutput,
        originalContent: "Original content",
      });
    });

    it("throws when output not found", async () => {
      mockPrismaOutputFindUnique.mockResolvedValueOnce(null);

      await expect(revertOutputContent(outputId, userId)).rejects.toThrow("not found");
      expect(mockPrismaOutputUpdate).not.toHaveBeenCalled();
    });

    it("throws when no original content", async () => {
      mockPrismaOutputFindUnique.mockResolvedValueOnce({
        ...mockOutput,
        originalContent: null,
      });

      await expect(revertOutputContent(outputId, userId)).rejects.toThrow(
        "No original content"
      );
      expect(mockPrismaOutputUpdate).not.toHaveBeenCalled();
    });

    it("reverts content and logs history on success", async () => {
      const result = await revertOutputContent(outputId, userId);

      expect(result.content).toBe("Original content");
      expect(result.isEdited).toBe(false);
      expect(mockPrismaOutputUpdate).toHaveBeenCalledWith({
        where: { id: outputId },
        data: { content: "Original content", isEdited: false },
      });
      expect(mockLogProjectChange).toHaveBeenCalledWith(
        projectId,
        userId,
        "revert_output",
        expect.any(Object)
      );
    });
  });

  describe("getOutputById", () => {
    it("throws when output not found", async () => {
      mockPrismaOutputFindUnique.mockResolvedValueOnce(null);

      await expect(getOutputById(outputId, userId)).rejects.toThrow("not found");
    });

    it("throws when output belongs to another user", async () => {
      mockPrismaOutputFindUnique.mockResolvedValueOnce({
        ...mockOutput,
        project: { userId: "other-user" },
      });

      await expect(getOutputById(outputId, userId)).rejects.toThrow("access denied");
    });

    it("returns output when found and owned", async () => {
      const result = await getOutputById(outputId, userId);

      expect(result).toEqual(mockOutput);
      expect(mockPrismaOutputFindUnique).toHaveBeenCalledWith({
        where: { id: outputId },
        include: { project: true },
      });
    });
  });
});
