"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  SquareIcon,
  UploadIcon,
  MicIcon,
} from "lucide-react";
import { toast } from "sonner";
import PlatformSelector from "@/components/ai/platform-selector";
import { GeneratedContentPreview } from "@/components/ai/generated-content-preview";
import type { BulkGenerationResult } from "@/types/ai";
import { PLATFORMS, type Platform } from "@/lib/constants/platforms";
import {
  DOCUMENT_INPUT_ACCEPT,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  SOURCE_CONTENT_MAX_LENGTH,
} from "@/lib/constants/documents";
import { truncateAtWordBoundary } from "@/lib/utils/truncate-text";
import type { ParseDocumentResponse } from "@/types/documents";
import { SeriesPostsView } from "@/components/series/series-posts-view";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POST_TONE_OPTIONS,
  getToneById,
  type PostToneId,
} from "@/lib/constants/post-tones";

interface Output {
  id: string;
  platform: string;
  content: string;
  isEdited: boolean;
  seriesIndex?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  userId: string;
  title: string;
  sourceContent: string;
  platforms: string[];
  postTone?: string | null;
  postsPerPlatform?: number | null;
  postsPerPlatformByPlatform?: Record<string, number> | null;
  createdAt: Date;
  updatedAt: Date;
  outputs: Output[];
}

function getPostCountForPlatform(project: Project, platform: string): number {
  const byPlatform = project.postsPerPlatformByPlatform;
  if (byPlatform && typeof byPlatform === "object" && platform in byPlatform) {
    const n = byPlatform[platform];
    return n >= 1 && n <= 3 ? n : 1;
  }
  return project.postsPerPlatform ?? 1;
}

function hasSeriesPerPlatform(project: Project): boolean {
  const byPlatform = project.postsPerPlatformByPlatform;
  if (byPlatform && typeof byPlatform === "object" && Object.keys(byPlatform).length > 0) {
    return Object.values(byPlatform).some((n) => n > 1);
  }
  return (project.postsPerPlatform ?? 1) > 1;
}

export default function GeneratePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id;
  const t = useTranslations("projects");
  const tDocs = useTranslations("documents");
  const tSub = useTranslations("subscription");
  const tGen = useTranslations("generatePage");
  const tPostTone = useTranslations("postTone");
  const tErr = useTranslations("errors");
  
  const [project, setProject] = useState<Project | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null);
  const [regeneratingOutputId, setRegeneratingOutputId] = useState<string | null>(null);
  const [regeneratingSeriesPlatform, setRegeneratingSeriesPlatform] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<BulkGenerationResult | null>(null);
  const [piiWarnings, setPiiWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [planFeatures, setPlanFeatures] = useState<{
    planType: string;
    canUseAudio: boolean;
    canUsePostTone: boolean;
    audioLimits: { usedMinutes: number; limitMinutes: number } | null;
  } | null>(null);
  const [regenerateToneOverride, setRegenerateToneOverride] = useState<PostToneId | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingTxt, setIsUploadingTxt] = useState(false);
  const txtInputRef = useRef<HTMLInputElement | null>(null);
  const createStatus = searchParams.get("status");
  const createSuccessful = Number(searchParams.get("successful") ?? "0");
  const createFailed = Number(searchParams.get("failed") ?? "0");

  const loadProject = useCallback(async () => {
    if (!projectId) return null;
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return null;
      }
      if (res.status === 404) {
        setError(tErr("projectNotFound"));
        return null;
      }
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? tErr("failedToLoadProject"));
      return null;
    }
    const data = await res.json();
    return data.project as Project | null;
  }, [projectId, router, tErr]);

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
          setError(tErr("failedToLoadProject"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadProject, tErr]);

  // Load plan features (text vs text_audio)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscription/features");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setPlanFeatures({
          planType: data.planType ?? "text",
          canUseAudio: data.canUseAudio === true,
          canUsePostTone: data.canUsePostTone === true,
          audioLimits: data.audioLimits ?? null,
        });
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);
  
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
      toast.error(t("toasts.selectPlatform"));
      return;
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      setGenerationResults(null);
      setPiiWarnings([]);
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? prev : prev + 10));
      }, 500);
      const body: Record<string, unknown> = {
        projectId: project.id,
        platforms: selectedPlatforms,
        sourceContent: project.sourceContent,
      };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      clearInterval(interval);
      setProgress(100);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.details ?? body?.error ?? t("toasts.generationFailed");
        setError(message);
        toast.error(message);
        return;
      }
      const data = (await res.json()) as BulkGenerationResult & { piiWarnings?: string[] };
      setGenerationResults(data);
      setPiiWarnings(data.piiWarnings ?? []);
      if ((data.piiWarnings?.length ?? 0) > 0) {
        toast.warning(t("toasts.piiNotice"));
      }
      toast.success(t("toasts.generationCompleted"));
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

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setAudioUploadError(null);
    setIsUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch(`/api/projects/${projectId}/ingest-audio`, {
        method: "POST",
        body: formData,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAudioUploadError(body.details ?? body.error ?? tDocs("uploadFailed"));
        toast.error(body.details ?? body.error ?? tDocs("uploadFailed"));
        return;
      }
      toast.success(t("toasts.sourceUpdated"));
      const updated = await loadProject();
      if (updated) setProject(updated);
      if (audioInputRef.current) audioInputRef.current.value = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setAudioUploadError(msg);
      toast.error(msg);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      toast.error(tDocs("fileTooLarge"));
      e.target.value = "";
      return;
    }
    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : "";
    const isTxt = ext === ".txt" || file.type === "text/plain";

    let text: string;
    if (isTxt) {
      try {
        const raw = await file.text();
        const { text: truncated, truncated: wasTruncated } = truncateAtWordBoundary(
          raw,
          SOURCE_CONTENT_MAX_LENGTH
        );
        text = truncated;
        if (wasTruncated) toast.warning(tDocs("textTruncated"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
        e.target.value = "";
        return;
      }
    } else {
      setIsUploadingTxt(true);
      try {
        const formData = new FormData();
        formData.set("file", file);
        const res = await fetch("/api/documents/parse", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as ParseDocumentResponse & { error?: string; details?: string };
        if (!res.ok) {
          toast.error(data.details ?? data.error ?? t("toasts.updateFailed"));
          e.target.value = "";
          return;
        }
        text = data.text;
        if (data.truncated) toast.warning(tDocs("textTruncated"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : tDocs("uploadFailed"));
        e.target.value = "";
        return;
      } finally {
        setIsUploadingTxt(false);
      }
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceContent: text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.details ?? body.error ?? "Update failed");
        return;
      }
      toast.success("Source content updated from file.");
      const updated = await loadProject();
      if (updated) setProject(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.updateFailed"));
    } finally {
      e.target.value = "";
      if (txtInputRef.current) txtInputRef.current.value = "";
    }
  };

  const buildRegenerateBody = (base: Record<string, unknown>) => {
    const body = { ...base };
    if (planFeatures?.canUsePostTone && regenerateToneOverride) {
      (body as Record<string, unknown>).postToneOverride = regenerateToneOverride;
    }
    return body;
  };

  const handleRegenerate = async (platform: string) => {
    if (!project?.sourceContent?.trim()) {
      toast.error(t("toasts.noSourceContent"));
      return;
    }
    try {
      setRegeneratingPlatform(platform);
      setError(null);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegenerateBody({
          projectId: project.id,
          platforms: [platform],
          sourceContent: project.sourceContent,
        })),
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
      toast.error(err instanceof Error ? err.message : t("toasts.regenerationFailed"));
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  const handleRegenerateByOutputId = async (outputId: string) => {
    if (!project?.sourceContent?.trim()) {
      toast.error(t("toasts.noSourceContent"));
      return;
    }
    try {
      setRegeneratingOutputId(outputId);
      setError(null);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegenerateBody({
          projectId: project.id,
          outputId,
          sourceContent: project.sourceContent,
        })),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.details ?? body?.error ?? t("toasts.regenerationFailed"));
        return;
      }
      const results = (await res.json()) as BulkGenerationResult;
      if (results.successful.length > 0) {
        const r = results.successful[0];
        setGenerationResults(prev => ({
          ...(prev ?? { successful: [], failed: [], totalRequested: 0 }),
          successful: [
            ...(prev?.successful.filter(s => !(s.platform === r.platform && (s as { seriesIndex?: number }).seriesIndex === r.seriesIndex)) ?? []),
            r,
          ],
          failed: prev?.failed ?? [],
          totalRequested: (prev?.totalRequested ?? 0) + 1,
        }));
        toast.success(t("toasts.generationCompleted"));
      }
      const updated = await loadProject();
      if (updated) setProject(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.regenerationFailed"));
    } finally {
      setRegeneratingOutputId(null);
    }
  };

  const handleRegenerateSeries = async (platform: string) => {
    if (!project?.sourceContent?.trim()) {
      toast.error(t("toasts.noSourceContent"));
      return;
    }
    try {
      setRegeneratingSeriesPlatform(platform);
      setError(null);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegenerateBody({
          projectId: project.id,
          platforms: [platform],
          sourceContent: project.sourceContent,
          regenerateSeriesForPlatform: platform,
        })),
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        toast.error(resBody?.details ?? resBody?.error ?? t("toasts.regenerationFailed"));
        return;
      }
      const results = (await res.json()) as BulkGenerationResult;
      setGenerationResults(results);
      toast.success(t("toasts.generationCompleted"));
      const updated = await loadProject();
      if (updated) setProject(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.regenerationFailed"));
    } finally {
      setRegeneratingSeriesPlatform(null);
    }
  };

  const handleRegenerateFrom = async (platform: string, seriesIndex: number) => {
    if (!project?.sourceContent?.trim()) {
      toast.error(t("toasts.noSourceContent"));
      return;
    }
    try {
      setRegeneratingSeriesPlatform(platform);
      setError(null);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegenerateBody({
          projectId: project.id,
          platforms: [platform],
          sourceContent: project.sourceContent,
          regenerateFromIndex: { platform, seriesIndex },
        })),
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        toast.error(resBody?.details ?? resBody?.error ?? t("toasts.regenerationFailed"));
        return;
      }
      const results = (await res.json()) as BulkGenerationResult;
      setGenerationResults(results);
      toast.success(t("toasts.generationCompleted"));
      const updated = await loadProject();
      if (updated) setProject(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.regenerationFailed"));
    } finally {
      setRegeneratingSeriesPlatform(null);
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
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("generate.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("generate.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {planFeatures && (
            <span className="rounded-full border px-3 py-1 text-sm font-medium bg-muted">
              {planFeatures.planType === "text_audio" ? (
                <>
                  <MicIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                  {tSub("planTypeTextAudio")}
                </>
              ) : (
                tSub("planTypeText")
              )}
            </span>
          )}
          {project?.postTone && (() => {
            const tone = getToneById(project.postTone);
            return tone ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <span>{tone.icon}</span>
                <span>Tone: {tPostTone(tone.labelKey)}</span>
              </Badge>
            ) : null;
          })()}
          {planFeatures?.canUsePostTone && project?.outputs && project.outputs.length > 0 && (
            <Select
              value={regenerateToneOverride ?? "project"}
              onValueChange={(v) => setRegenerateToneOverride(v === "project" ? null : (v as PostToneId))}
            >
              <SelectTrigger className="w-[200px] h-9" aria-label={tGen("regenerateWithToneLabel")}>
                <SelectValue>
                  {regenerateToneOverride ? (
                    <span className="flex items-center gap-1.5">
                      <span>{getToneById(regenerateToneOverride)?.icon}</span>
                      <span>{tPostTone(getToneById(regenerateToneOverride)!.labelKey)}</span>
                    </span>
                  ) : (
                    tGen("regenerateWithProjectTone")
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">{tGen("regenerateWithProjectTone")}</SelectItem>
                {POST_TONE_OPTIONS.map((tone) => (
                  <SelectItem key={tone.id} value={tone.id}>
                    <span className="flex items-center gap-1.5">
                      <span>{tone.icon}</span>
                      <span>{tPostTone(tone.labelKey)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {(createStatus === "partial" || createStatus === "failed") && (
        <Alert className="mb-6">
          <AlertDescription>
            {createStatus === "partial"
              ? `Initial generation completed partially: ${createSuccessful} successful, ${createFailed} failed. You can retry failed items below.`
              : "Initial generation failed. You can retry generation below."}
          </AlertDescription>
        </Alert>
      )}

      {piiWarnings.length > 0 && (
        <Alert variant="default" className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertDescription>
            {tGen("privacyNotice")} {piiWarnings.join(" ")}
          </AlertDescription>
        </Alert>
      )}

      {planFeatures?.canUseAudio && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              {tDocs("uploadAudio")}
            </CardTitle>
            <CardDescription>
              {tDocs("uploadAudioDescription")}
              {planFeatures.audioLimits && (
                <span className="block mt-1">
                  {tSub("audioUsedShort", {
                    used: planFeatures.audioLimits.usedMinutes,
                    limit: planFeatures.audioLimits.limitMinutes,
                  })}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.flac"
              className="hidden"
              onChange={handleUploadAudio}
              disabled={isUploadingAudio}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => audioInputRef.current?.click()}
              disabled={isUploadingAudio}
            >
              {isUploadingAudio ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {tDocs("transcribing")}
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  {tDocs("selectFile")}
                </>
              )}
            </Button>
            {audioUploadError && (
              <p className="mt-2 text-sm text-destructive">{audioUploadError}</p>
            )}
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("generate.sourceContent")}</CardTitle>
          <CardDescription>
            {t("generate.sourceContentDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <input
              ref={txtInputRef}
              type="file"
              accept={DOCUMENT_INPUT_ACCEPT}
              className="hidden"
              aria-label={t("generate.uploadDocumentAria")}
              onChange={handleUploadDocument}
              disabled={isUploadingTxt}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => txtInputRef.current?.click()}
              disabled={isUploadingTxt}
              aria-label={t("generate.uploadFileAria")}
            >
              {isUploadingTxt ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadIcon className="mr-2 h-4 w-4" />
              )}
              {tDocs("uploadFile")}
            </Button>
          </div>
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
        <CardContent className="space-y-3">
          {hasSeriesPerPlatform(project) && (
            <p className="text-sm text-muted-foreground">
              {project.postsPerPlatformByPlatform && typeof project.postsPerPlatformByPlatform === "object" && Object.keys(project.postsPerPlatformByPlatform).length > 0
                ? tGen("seriesPerPlatformSummary")
                : tGen("willGenerateSeries", { n: project.postsPerPlatform ?? 1 })}
            </p>
          )}
          <PlatformSelector 
            selectedPlatforms={selectedPlatforms} 
            onPlatformToggle={handlePlatformToggle} 
            disabled={isGenerating}
          />
        </CardContent>
        <CardFooter className="justify-between">
          <p className="text-sm text-muted-foreground">
            {!project?.sourceContent?.trim()
              ? t("generate.addSourceHint")
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
                {t("generate.generateButton")}
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
            
            {generationResults.successful.length > 0 && (() => {
              const withSeries = generationResults.successful.some(
                (r) => (r as { seriesIndex?: number }).seriesIndex != null
              );
              if (withSeries) {
                const byPlatform = new Map<string, typeof generationResults.successful>();
                for (const r of generationResults.successful) {
                  const list = byPlatform.get(r.platform) ?? [];
                  list.push(r);
                  byPlatform.set(r.platform, list);
                }
                return (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Generated Content</h3>
                    <div className="space-y-6">
                      {Array.from(byPlatform.entries()).map(([platform, results]) => {
                        const sorted = [...results].sort(
                          (a, b) => ((a as { seriesIndex?: number }).seriesIndex ?? 1) - ((b as { seriesIndex?: number }).seriesIndex ?? 1)
                        );
                        return (
                          <Card key={platform}>
                            <CardContent className="pt-6 space-y-4">
                              {sorted.map((result) => (
                                <GeneratedContentPreview
                                  key={(result as { outputId?: string }).outputId ?? result.platform + ((result as { seriesIndex?: number }).seriesIndex ?? 1)}
                                  content={result.content}
                                  platform={result.platform}
                                  variant="success"
                                  editHref={(result as { outputId?: string }).outputId
                                    ? `/projects/${projectId}/outputs/${(result as { outputId: string }).outputId}/edit`
                                    : undefined}
                                  actions={
                                    (result as { outputId?: string }).outputId ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={regeneratingOutputId === (result as { outputId: string }).outputId}
                                        onClick={() => handleRegenerateByOutputId((result as { outputId: string }).outputId)}
                                      >
                                        {regeneratingOutputId === (result as { outputId: string }).outputId ? (
                                          <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <RotateCcwIcon className="h-4 w-4 mr-2" />
                                        )}
                                        Regenerate
                                      </Button>
                                    ) : (
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
                                    )
                                  }
                                />
                              ))}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Generated Content</h3>
                  <Tabs defaultValue={generationResults.successful[0]?.platform} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-sm:grid-cols-1">
                      {generationResults.successful.map((result, i) => (
                        <TabsTrigger key={`${result.platform}-${i}`} value={`${result.platform}-${i}`}>
                          {PLATFORMS[result.platform as keyof typeof PLATFORMS]?.name || result.platform}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {generationResults.successful.map((result, i) => (
                      <TabsContent key={`${result.platform}-${i}`} value={`${result.platform}-${i}`} className="mt-4">
                        <GeneratedContentPreview
                          content={result.content}
                          platform={result.platform}
                          variant="success"
                          editHref={(result as { outputId?: string }).outputId
                            ? `/projects/${projectId}/outputs/${(result as { outputId: string }).outputId}/edit`
                            : `/projects/${projectId}/edit?platform=${result.platform}`}
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
              );
            })()}
          </CardContent>
        </Card>
      )}
      
      {project.outputs && project.outputs.length > 0 && (() => {
        const byPlatformMap = new Map<string, Output[]>();
        for (const o of project.outputs) {
          const list = byPlatformMap.get(o.platform) ?? [];
          list.push(o);
          byPlatformMap.set(o.platform, list);
        }
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Previously Generated Content</h2>
            <p className="text-sm text-muted-foreground">
              Content that was previously generated for this project
            </p>
            {Array.from(byPlatformMap.entries()).map(([platform, posts]) => {
              const seriesTotal = getPostCountForPlatform(project, platform);
              const sortedPosts = [...posts].sort((a, b) => (a.seriesIndex ?? 1) - (b.seriesIndex ?? 1));
              if (seriesTotal > 1) {
                return (
                  <SeriesPostsView
                    key={platform}
                    platform={platform}
                    posts={sortedPosts}
                    seriesTotal={seriesTotal}
                    projectId={projectId}
                    regeneratingOutputId={regeneratingOutputId}
                    regeneratingSeries={regeneratingSeriesPlatform === platform}
                    onRegeneratePost={handleRegenerateByOutputId}
                    onRegenerateSeries={handleRegenerateSeries}
                    onRegenerateFrom={handleRegenerateFrom}
                  />
                );
              }
              return (
                <Card key={platform}>
                  <CardContent className="pt-6">
                    {sortedPosts.map((output) => (
                      <GeneratedContentPreview
                        key={output.id}
                        content={output.content}
                        platform={output.platform}
                        isEdited={output.isEdited}
                        maxHeight="10rem"
                        editHref={`/projects/${projectId}/outputs/${output.id}/edit`}
                        actions={
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={regeneratingOutputId === output.id}
                            onClick={() => handleRegenerateByOutputId(output.id)}
                          >
                            {regeneratingOutputId === output.id ? (
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RotateCcwIcon className="h-4 w-4 mr-2" />
                            )}
                            Regenerate
                          </Button>
                        }
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
