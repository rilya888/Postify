/**
 * Preview panel component
 */

"use client";

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useTranslations } from 'next-intl';
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

function PreviewPanel({ 
  content, 
  platform, 
  onCopy 
}: PreviewPanelProps) {
  const t = useTranslations("previewPanel");
  const tPlatforms = useTranslations("platforms");
  const platformConfig = getPlatform(platform);
  const charCountInfo = getCharacterCountInfo(content, platform);
  const [copied, setCopied] = useState(false);
  const platformName = tPlatforms(`${platform}.name`);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopied(true);
      toast.success(t("copySuccess", { platform: platformName }));
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t("copyFailed", { platform: platformName }));
    }
  }, [content, onCopy, platformName, t]);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        if (previewRef.current?.contains(document.activeElement as Node)) {
          e.preventDefault();
          handleCopy();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleCopy]);

  return (
    <div ref={previewRef} tabIndex={0} className="h-full outline-none" role="region" aria-label={t("previewAriaLabel", { platform: platformName })}>
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>{platformConfig.icon}</span>
            <span>{platformName}</span>
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
          aria-label={copied ? t("copiedAriaLabel") : t("copyAriaLabel")}
        >
          {copied ? t("copiedButton") : t("copyButton")}
        </Button>
      </CardFooter>
    </Card>
    </div>
  );
}

export default memo(PreviewPanel);
