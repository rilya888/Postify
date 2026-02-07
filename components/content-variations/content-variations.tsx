import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { toast } from 'sonner';
import { Platform } from '@/lib/constants/platforms';

interface ContentVariation {
  id: string;
  content: string;
  style: string;
  index: number;
  metadata: Record<string, unknown>;
}

interface ContentVariationsProps {
  _projectId: string;
  platform: Platform;
  variations: ContentVariation[];
  onVariationSelect?: (variation: ContentVariation) => void;
  onRegenerate?: (count: number) => void;
}

export function ContentVariations({
  _projectId,
  platform,
  variations,
  onVariationSelect,
  onRegenerate
}: ContentVariationsProps) {
  const t = useTranslations("contentVariations");
  const tPlatforms = useTranslations("platforms");
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [copiedVariation, setCopiedVariation] = useState<string | null>(null);

  const handleCopy = async (content: string, index: number) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedVariation(String(index));
      toast.success(t("variationCopied", { index: index + 1 }));
      setTimeout(() => setCopiedVariation(null), 2000);
    } else {
      toast.error(t("variationCopyFailed", { index: index + 1 }));
    }
  };

  const handleSelect = (variation: ContentVariation) => {
    setSelectedVariation(variation.id);
    if (onVariationSelect) {
      onVariationSelect(variation);
    }
  };

  const handleThumbsUp = (index: number) => {
    toast.success(t("variationLiked", { index: index + 1 }));
    // In a real implementation, you would track user feedback
  };

  const handleThumbsDown = (index: number) => {
    toast.info(t("variationDisliked", { index: index + 1 }));
    // In a real implementation, you would regenerate this specific variation
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <div className="flex gap-2">
          {onRegenerate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onRegenerate(3)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("regenerateAll")}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">{t("allVariations")}</TabsTrigger>
          <TabsTrigger value="favorites">{t("favorites")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variations.map((variation, index) => (
              <Card 
                key={variation.id} 
                className={`cursor-pointer transition-all ${
                  selectedVariation === variation.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleSelect(variation)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                      {t("variationN", { index: index + 1 })}
                    </CardTitle>
                    <Badge variant="outline">{variation.style}</Badge>
                  </div>
                  <CardDescription>
                    {tPlatforms(`${platform}.name`)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm line-clamp-5">
                    {variation.content.substring(0, 150)}...
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleThumbsUp(index);
                      }}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleThumbsDown(index);
                      }}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(variation.content, index);
                    }}
                  >
                    {copiedVariation === String(index) ? t("copied") : t("copy")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="favorites" className="space-y-4">
          <p className="text-center text-muted-foreground py-8">
            {t("noFavorites")}
          </p>
        </TabsContent>
      </Tabs>
      
      {variations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">{t("selectedVariationTitle")}</h3>
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>
                  {variations.find(v => v.id === selectedVariation)?.style || t("selectVariation")}
                </span>
                {selectedVariation && (
                  <Badge>
                    {t("variationN", { index: variations.findIndex(v => v.id === selectedVariation) + 1 })}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVariation ? (
                <div className="whitespace-pre-line">
                  {variations.find(v => v.id === selectedVariation)?.content}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  {t("selectVariationToPreview")}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              {selectedVariation && (
                <>
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      const selectedVar = variations.find(v => v.id === selectedVariation);
                      if (selectedVar) {
                        handleCopy(selectedVar.content, variations.findIndex(v => v.id === selectedVariation));
                      }
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {t("copySelected")}
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      // In a real implementation, this would save the selected variation as the main output
                      toast.success(t("savedAsMain"));
                    }}
                  >
                    {t("useThisOne")}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
