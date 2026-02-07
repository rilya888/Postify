/**
 * Simple test page for the editor functionality
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ContentEditor from '@/components/editor/content-editor';
import PreviewPanel from '@/components/preview/preview-panel';
import { Button } from '@/components/ui/button';
import { PLATFORMS } from '@/lib/constants/platforms';

export default function EditorTestPage() {
  const t = useTranslations("editorTest");
  const tPlatforms = useTranslations("platforms");
  const [content, setContent] = useState(t("initialContentHtml"));
  const [platform, setPlatform] = useState<'linkedin' | 'twitter' | 'email'>('linkedin');

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
      
      <div className="mb-6">
        <label className="block mb-2">{t("selectPlatform")}</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as 'linkedin' | 'twitter' | 'email')}
          className="border rounded p-2 mr-4"
        >
          {Object.entries(PLATFORMS).map(([key]) => (
            <option key={key} value={key}>{tPlatforms(`${key}.name`)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("editor")}</h2>
          <ContentEditor 
            content={content} 
            onChange={setContent} 
            platform={platform}
          />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("preview")}</h2>
          <PreviewPanel 
            content={content} 
            platform={platform} 
          />
        </div>
      </div>
      
      <div className="mt-6">
        <Button onClick={() => console.log('Current content:', content)}>
          {t("logContent")}
        </Button>
      </div>
    </div>
  );
}
