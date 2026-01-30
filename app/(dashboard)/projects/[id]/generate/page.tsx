"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayIcon,
  RotateCcwIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
  SquareIcon
} from "lucide-react";
import { toast } from "sonner";
import PlatformSelector from "@/components/ai/platform-selector";
import { GeneratedContentPreview } from "@/components/ai/generated-content-preview";
import type { BulkGenerationResult } from "@/types/ai";
import { PLATFORMS, type Platform } from "@/lib/constants/platforms";

interface Output {
  id: string;
  platform: string;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  userId: string;
  title: string;
  sourceContent: string;
  platforms: string[];
  createdAt: Date;
  updatedAt: Date;
  outputs: Output[];
}

export default function GeneratePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<BulkGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return null;
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return null;
      }
      if (res.status === 404) {
        setError("Project not found");
        return null;
      }
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? "Failed to load project");
      return null;
    }
    const data = await res.json();
    return data.project as Project | null;
  }, [projectId, router]);

  // Load project data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const projectData = await loadProject();
        if (cancelled) return;
        if (projectData) {
          setProject(projectData);
          setSelectedPlatforms(
            projectData.platforms?.length > 0
              ? (projectData.platforms as Platform[])
              : (["linkedin"] as Platform[])
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading project:", err);
          setError("Failed to load project");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadProject]);
  
  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform as Platform)
        ? prev.filter(p => p !== platform) as Platform[]
        : [...prev, platform as Platform]
    );
  };
  
  const handleGenerate = async () => {
    if (!project) return;
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      setGenerationResults(null);
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? prev : prev + 10));
      }, 500);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          platforms: selectedPlatforms,
          sourceContent: project.sourceContent,
        }),
        signal,
      });
      clearInterval(interval);
      setProgress(100);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.details ?? body?.error ?? "Generation failed";
        setError(message);
        toast.error(message);
        return;
      }
      const results = (await res.json()) as BulkGenerationResult;
      setGenerationResults(results);
      toast.success("Content generation completed!");
      const updated = await loadProject();
      if (updated) setProject(updated);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.info("Generation cancelled");
        setError(null);
        return;
      }
      console.error("Generation error:", err);
      const message = err instanceof Error ? err.message : "An error occurred during generation";
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGenerate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = async (platform: string) => {
    if (!project?.sourceContent?.trim()) {
      toast.error("No source content to regenerate from");
      return;
    }
    try {
      setRegeneratingPlatform(platform);
      setError(null);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          platforms: [platform],
          sourceContent: project.sourceContent,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.details ?? body?.error ?? "Regeneration failed";
        toast.error(message);
        return;
      }
      const results = (await res.json()) as BulkGenerationResult;
      if (results.successful.length > 0) {
        setGenerationResults(prev => ({
          ...(prev ?? { successful: [], failed: [], totalRequested: 0 }),
          successful: [
            ...(prev?.successful.filter(s => s.platform !== platform) ?? []),
            ...results.successful,
          ],
          failed: prev?.failed ?? [],
          totalRequested: (prev?.totalRequested ?? 0) + 1,
        }));
        toast.success(`${platform} content regenerated`);
      }
      const updated = await loadProject();
      if (updated) setProject(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegeneratingPlatform(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-8 w-1/4 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <XCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertDescription>Project not found</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Generate Content</h1>
        <p className="text-muted-foreground mt-2">
          Transform your source content into platform-specific formats
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Source Content</CardTitle>
          <CardDescription>
            This content will be repurposed for the selected platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="whitespace-pre-line">{project.sourceContent}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Platforms</CardTitle>
          <CardDescription>
            Choose the platforms you want to generate content for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformSelector 
            selectedPlatforms={selectedPlatforms} 
            onPlatformToggle={handlePlatformToggle} 
            disabled={isGenerating}
          />
        </CardContent>
        <CardFooter className="justify-between">
          <p className="text-sm text-muted-foreground">
            {!project?.sourceContent?.trim()
              ? "Add source content in the project to generate."
              : `Selected: ${selectedPlatforms.length} of ${Object.keys(PLATFORMS).length} platforms`}
          </p>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || selectedPlatforms.length === 0 || !project?.sourceContent?.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {isGenerating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Generating content for {selectedPlatforms.join(", ")}...
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelGenerate}
                className="mt-2"
              >
                <SquareIcon className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {generationResults && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generation Results</CardTitle>
            <CardDescription>
              Content has been generated for the selected platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center">
                  <CheckCircleIcon className="mr-2 h-4 w-4" />
                  Successful
                </h4>
                <p className="text-2xl font-bold mt-2">{generationResults.successful.length}</p>
              </div>
              
              <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center">
                  <XCircleIcon className="mr-2 h-4 w-4" />
                  Failed
                </h4>
                <p className="text-2xl font-bold mt-2">{generationResults.failed.length}</p>
              </div>
              
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                  Total
                </h4>
                <p className="text-2xl font-bold mt-2">{generationResults.totalRequested}</p>
              </div>
            </div>
            
            {generationResults.successful.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Generated Content</h3>
                
                <Tabs defaultValue={generationResults.successful[0]?.platform} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 max-sm:grid-cols-1">
                    {generationResults.successful.map((result) => (
                      <TabsTrigger key={result.platform} value={result.platform}>
                        {PLATFORMS[result.platform as keyof typeof PLATFORMS]?.name || result.platform}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {generationResults.successful.map((result) => (
                    <TabsContent key={result.platform} value={result.platform} className="mt-4">
                      <GeneratedContentPreview
                        content={result.content}
                        platform={result.platform}
                        variant="success"
                        editHref={`/projects/${projectId}/edit?platform=${result.platform}`}
                        actions={
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={regeneratingPlatform === result.platform}
                            onClick={() => handleRegenerate(result.platform)}
                          >
                            {regeneratingPlatform === result.platform ? (
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RotateCcwIcon className="h-4 w-4 mr-2" />
                            )}
                            Regenerate
                          </Button>
                        }
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {project.outputs && project.outputs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previously Generated Content</CardTitle>
            <CardDescription>
              Content that was previously generated for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.outputs.map((output) => (
                <GeneratedContentPreview
                  key={output.id}
                  content={output.content}
                  platform={output.platform}
                  isEdited={output.isEdited}
                  maxHeight="10rem"
                  editHref={`/projects/${projectId}/edit?outputId=${output.id}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}