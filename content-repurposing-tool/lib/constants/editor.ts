/**
 * Editor constants for the content repurposing tool
 */

import { Platform } from "@/lib/constants/platforms";

/**
 * Platform-specific character limits
 */
export const PLATFORM_CHARACTER_LIMITS: Record<Platform, number> = {
  linkedin: 3000,
  twitter: 280,
  email: 10000, // This is actually word limit, but we'll handle that separately
  instagram: 2200,
  facebook: 5000,
  tiktok: 150,
  youtube: 5000,
};

/**
 * Editor toolbar buttons
 */
export const EDITOR_TOOLBAR_BUTTONS = [
  "bold",
  "italic",
  "underline",
  "strike",
  "link",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
] as const;

export type EditorToolbarButton = typeof EDITOR_TOOLBAR_BUTTONS[number];

/**
 * Default editor options
 */
export const DEFAULT_EDITOR_OPTIONS = {
  placeholder: "Start writing your content here...",
  readonly: false,
  enableFormatting: true,
  enableLinks: true,
  enableLists: true,
};