"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  PlayIcon,
  RotateCcwIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon
} from "lucide-react";
import { toast } from "sonner";
import PlatformSelector from "@/components/ai/platform-selector";
import PlatformBadge from "@/components/ai/platform-badge";
import { getProjectWithOutputs } from "@/lib/services/projects";
import { generateForPlatforms } from "@/lib/services/ai";
import { BulkGenerationResult } from "@/types/ai";
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
  const projectId = params.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<BulkGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const data = await getProjectWithOutputs(projectId, "");
        
        if (data) {
          setProject(data as unknown as Project);
          // Initialize selected platforms with project's platforms or default
          setSelectedPlatforms(data.platforms.length > 0 ? data.platforms as Platform[] : ["linkedin"] as Platform[]);
        } else {
          setError("Project not found");
        }
      } catch (err) {
        console.error("Error loading project:", err);
        setError("Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (projectId) {
      loadProject();
    }
  }, [projectId]);
  
  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };
  
  const handleGenerate = async () => {
    if (!project) return;
    
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    
    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      setGenerationResults(null);
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      // Call the generation API
      const results = await generateForPlatforms(
        project.id,
        "", // userId would come from session context
        project.sourceContent,
        selectedPlatforms as Platform[]
      );
      
      clearInterval(interval);
      setProgress(100);
      
      setGenerationResults(results);
      toast.success("Content generation completed!");
      
      // Refresh project data to show new outputs
      const updatedProject = await getProjectWithOutputs(projectId, "");
      if (updatedProject) {
        setProject(updatedProject as unknown as Project);
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during generation");
      toast.error("Generation failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsGenerating(false);
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
            Selected: {selectedPlatforms.length} of {Object.keys(PLATFORMS).length} platforms
          </p>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || selectedPlatforms.length === 0}
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
                  <TabsList className="grid w-full grid-cols-2">
                    {generationResults.successful.map((result) => (
                      <TabsTrigger key={result.platform} value={result.platform}>
                        {PLATFORMS[result.platform as keyof typeof PLATFORMS]?.name || result.platform}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {generationResults.successful.map((result) => (
                    <TabsContent key={result.platform} value={result.platform} className="mt-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <PlatformBadge platform={result.platform} variant="success" />
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Would implement regeneration here
                                toast.info(`Regenerating ${result.platform} content...`);
                              }}
                            >
                              <RotateCcwIcon className="h-4 w-4 mr-2" />
                              Regenerate
                            </Button>
                          </div>
                          <div className="bg-muted rounded-lg p-4 whitespace-pre-line">
                            {result.content}
                          </div>
                        </CardContent>
                      </Card>
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
              {project.outputs.map(output => (
                <Card key={output.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start mb-2">
                      <PlatformBadge platform={output.platform} />
                      {output.isEdited && (
                        <Badge variant="secondary" className="ml-2">Edited</Badge>
                      )}
                    </div>
                    <div className="bg-muted rounded-lg p-4 whitespace-pre-line max-h-40 overflow-y-auto">
                      {output.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}