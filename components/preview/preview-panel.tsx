/**
 * Preview panel component
 */

import { useState } from 'react';
import { Platform, getPlatform } from '@/lib/constants/platforms';
import { getCharacterCountInfo } from '@/lib/utils/editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { toast } from 'sonner';

interface PreviewPanelProps {
  content: string;
  platform: Platform;
  onCopy?: () => void;
}

export default function PreviewPanel({ 
  content, 
  platform, 
  onCopy 
}: PreviewPanelProps) {
  const platformConfig = getPlatform(platform);
  const charCountInfo = getCharacterCountInfo(content, platform);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(content);
    
    if (success) {
      setCopied(true);
      toast.success(`${platformConfig.name} content copied to clipboard!`);
      onCopy?.();
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(`Failed to copy ${platformConfig.name} content`);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>{platformConfig.icon}</span>
            <span>{platformConfig.name}</span>
          </div>
          <span className={`text-sm ${charCountInfo.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {charCountInfo.current}/{charCountInfo.max}
          </span>
        </CardTitle>
        {!charCountInfo.isValid && (
          <p className="text-sm text-red-500 mt-1">{charCountInfo.warning}</p>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-auto max-h-[300px]">
        <div 
          className="preview-content prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          onClick={handleCopy}
          className="w-full"
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </Button>
      </CardFooter>
    </Card>
  );
}