'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLATFORMS } from '@/lib/constants/platforms';
import { OutputCardActions } from '@/components/projects/output-card-actions';
import type { Platform } from '@/lib/constants/platforms';

export interface OutputForCard {
  id: string;
  platform: string;
  content: string;
  isEdited?: boolean;
}

interface EditableContentCardProps {
  projectId: string;
  output: OutputForCard;
}

/**
 * Card for displaying a single output with View/Edit and Copy actions.
 * Used on the project detail page for each generated output.
 */
export function EditableContentCard({ projectId, output }: EditableContentCardProps) {
  const platformKey = output.platform as keyof typeof PLATFORMS;
  const platformConfig = PLATFORMS[platformKey];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">{platformConfig?.icon}</span>
          {output.platform}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-line text-sm mb-2 line-clamp-5">
          {output.content}
        </div>
        {output.isEdited && (
          <Badge variant="outline" className="text-xs">
            Edited
          </Badge>
        )}
        <OutputCardActions
          projectId={projectId}
          outputId={output.id}
          content={output.content}
          platform={output.platform as Platform}
        />
      </CardContent>
    </Card>
  );
}
