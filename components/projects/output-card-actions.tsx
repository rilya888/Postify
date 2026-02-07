'use client';

import { Copy, Eye } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { toast } from 'sonner';
import { getPlatform } from '@/lib/constants/platforms';
import type { Platform } from '@/lib/constants/platforms';

interface OutputCardActionsProps {
  projectId: string;
  outputId: string;
  content: string;
  platform: Platform;
}

export function OutputCardActions({
  projectId,
  outputId,
  content,
  platform,
}: OutputCardActionsProps) {
  const t = useTranslations('outputActions');

  const handleCopy = async () => {
    const success = await copyToClipboard(content);
    const name = getPlatform(platform).name;
    if (success) {
      toast.success(t('copied', { platform: name }));
    } else {
      toast.error(t('copyFailed', { platform: name }));
    }
  };

  return (
    <div className="mt-2 flex gap-2">
      <Button variant="outline" size="sm" className="flex-1" asChild>
        <Link href={`/projects/${projectId}/outputs/${outputId}/edit`}>
          <Eye className="mr-2 h-4 w-4" />
          {t('viewEdit')}
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        title={t('copyToClipboard')}
        aria-label={t('copyToClipboard')}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
