/**
 * Editor toolbar component
 */

"use client";

import { useTranslations } from "next-intl";
import { memo } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon,
  Redo,
  Undo
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  editor: Editor;
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  const t = useTranslations("editorToolbar");
  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50" role="toolbar" aria-label={t("toolbarAriaLabel")}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!canUndo}
        aria-label={t("undo")}
      >
        <Undo className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!canRedo}
        aria-label={t("redo")}
      >
        <Redo className="h-4 w-4" />
      </Button>
      
      <div className="h-6 w-px bg-gray-200 mx-1" />
      
      <Button
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label={t("bold")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label={t("italic")}
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        aria-label={t("underline")}
      >
        <Underline className="h-4 w-4" />
      </Button>
      
      <div className="h-6 w-px bg-gray-200 mx-1" />
      
      <Button
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label={t("bulletList")}
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label={t("numberedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <div className="h-6 w-px bg-gray-200 mx-1" />
      
      <Button
        variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label={t("quote")}
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label={t("codeBlock")}
      >
        <Code className="h-4 w-4" />
      </Button>
      
      <Button
        variant={editor.isActive('link') ? 'secondary' : 'ghost'}
        size="sm"
        aria-label={t("insertLink")}
        onClick={() => {
          const previousUrl = editor.getAttributes('link').href;
          const url = window.prompt(t("urlPrompt"), previousUrl);
          
          if (url === null) {
            return;
          }
          
          if (url === '') {
            editor.chain().focus().unsetLink().run();
            return;
          }
          
          editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default memo(EditorToolbar);
