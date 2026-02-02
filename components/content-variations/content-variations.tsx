import { useState } from 'react';
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
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [copiedVariation, setCopiedVariation] = useState<string | null>(null);

  const handleCopy = async (content: string, index: number) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedVariation(String(index));
      toast.success(`Variation ${index + 1} copied to clipboard!`);
      setTimeout(() => setCopiedVariation(null), 2000);
    } else {
      toast.error(`Failed to copy variation ${index + 1}`);
    }
  };

  const handleSelect = (variation: ContentVariation) => {
    setSelectedVariation(variation.id);
    if (onVariationSelect) {
      onVariationSelect(variation);
    }
  };

  const handleThumbsUp = (index: number) => {
    toast.success(`Liked variation ${index + 1}!`);
    // In a real implementation, you would track user feedback
  };

  const handleThumbsDown = (index: number) => {
    toast.info(`Disliked variation ${index + 1}. Generating new one...`);
    // In a real implementation, you would regenerate this specific variation
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Content Variations</h2>
        <div className="flex gap-2">
          {onRegenerate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onRegenerate(3)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Regenerate All
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Variations</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
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
                      Variation {index + 1}
                    </CardTitle>
                    <Badge variant="outline">{variation.style}</Badge>
                  </div>
                  <CardDescription>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
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
                    {copiedVariation === String(index) ? '✓ Copied!' : 'Copy'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="favorites" className="space-y-4">
          <p className="text-center text-muted-foreground py-8">
            No favorites yet. Click the thumbs up icon on variations you like.
          </p>
        </TabsContent>
      </Tabs>
      
      {variations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Selected Variation</h3>
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>
                  {variations.find(v => v.id === selectedVariation)?.style || 'Select a variation'}
                </span>
                {selectedVariation && (
                  <Badge>
                    Variation {variations.findIndex(v => v.id === selectedVariation) + 1}
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
                  Select a variation to see the full content
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
                    Copy Selected
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      // In a real implementation, this would save the selected variation as the main output
                      toast.success('Variation saved as main content!');
                    }}
                  >
                    Use This One
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