/**
 * Content editor component using TipTap
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import { ContentEditorProps } from '@/types/editor';
import { DEFAULT_EDITOR_OPTIONS } from '@/lib/constants/editor';
import EditorToolbar from './editor-toolbar';
import CharacterCountDisplay from './character-count-display';
import { useState, useEffect, memo } from 'react';
import { getCharacterCountInfo } from '@/lib/utils/editor';
import { Platform } from '@/lib/constants/platforms';

interface ExtendedContentEditorProps extends ContentEditorProps {
  platform?: Platform;
}

function ContentEditor({
  content,
  onChange,
  options = {},
  platform
}: ExtendedContentEditorProps) {
  const editorOptions = { ...DEFAULT_EDITOR_OPTIONS, ...options };
  const effectivePlatform = platform || 'linkedin'; // Use the direct platform prop
  const [charCountInfo, setCharCountInfo] = useState(() =>
    getCharacterCountInfo(content, effectivePlatform)
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: editorOptions.placeholder,
      }),
      Link.configure({
        openOnClick: true,
      }),
      CharacterCount.configure({
        limit: 10000, // Set a high limit, we'll handle platform-specific limits separately
      }),
    ],
    content,
    editable: !editorOptions.readonly,
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);

      // Update character count info
      setCharCountInfo(getCharacterCountInfo(htmlContent, effectivePlatform));
    },
  });

  // Update character count when content prop changes
  useEffect(() => {
    setCharCountInfo(getCharacterCountInfo(content, effectivePlatform));
  }, [content, effectivePlatform]);

  return (
    <div className="border rounded-lg overflow-hidden">
      {editor && <EditorToolbar editor={editor} />}
      <div aria-label="Content editor">
      <EditorContent
        editor={editor}
        className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto"
      />
      </div>
      {platform && (
        <div className="p-2 bg-gray-50 border-t">
          <CharacterCountDisplay info={charCountInfo} />
        </div>
      )}
    </div>
  );
}

export default memo(ContentEditor);