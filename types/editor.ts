/**
 * Editor-related types for the content repurposing tool
 */

import { Platform } from "@/lib/constants/platforms";

/**
 * Options for editor configuration
 */
export type EditorOptions = {
  placeholder?: string;
  readonly?: boolean;
  enableFormatting?: boolean;
  enableLinks?: boolean;
  enableLists?: boolean;
};

/**
 * Props for the ContentEditor component
 */
export type ContentEditorProps = {
  content: string;
  onChange: (content: string) => void;
  options?: EditorOptions;
};

/**
 * Character count information for content
 */
export type CharacterCountInfo = {
  current: number;
  max: number;
  platform: Platform;
  isValid: boolean;
  warning?: string;
};