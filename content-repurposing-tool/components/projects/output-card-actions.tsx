'use client';

import { Copy, Eye } from 'lucide-react';
import Link from 'next/link';
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
  const handleCopy = async () => {
    const success = await copyToClipboard(content);
    const name = getPlatform(platform).name;
    if (success) {
      toast.success(`${name} content copied to clipboard!`);
    } else {
      toast.error(`Failed to copy ${name} content`);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <Button variant="outline" size="sm" className="flex-1" asChild>
        <Link href={`/projects/${projectId}/outputs/${outputId}/edit`}>
          <Eye className="mr-2 h-4 w-4" />
          View/Edit
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopy} title="Copy to clipboard" aria-label="Copy to clipboard">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
