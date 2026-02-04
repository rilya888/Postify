/**
 * Simple test page for the editor functionality
 */

'use client';

import { useState } from 'react';
import ContentEditor from '@/components/editor/content-editor';
import PreviewPanel from '@/components/preview/preview-panel';
import { Button } from '@/components/ui/button';
import { PLATFORMS } from '@/lib/constants/platforms';

export default function EditorTestPage() {
  const [content, setContent] = useState('<p>This is a <strong>test</strong> of the editor functionality.</p>');
  const [platform, setPlatform] = useState<'linkedin' | 'twitter' | 'email'>('linkedin');

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Editor Test Page</h1>
      
      <div className="mb-6">
        <label className="block mb-2">Select Platform:</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as 'linkedin' | 'twitter' | 'email')}
          className="border rounded p-2 mr-4"
        >
          {Object.entries(PLATFORMS).map(([key, config]) => (
            <option key={key} value={key}>{config.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          <ContentEditor 
            content={content} 
            onChange={setContent} 
            platform={platform}
          />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <PreviewPanel 
            content={content} 
            platform={platform} 
          />
        </div>
      </div>
      
      <div className="mt-6">
        <Button onClick={() => console.log('Current content:', content)}>
          Log Content to Console
        </Button>
      </div>
    </div>
  );
}