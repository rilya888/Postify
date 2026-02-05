"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Mic, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { ProjectForm } from "@/components/projects/project-form";
import PlatformSelector from "@/components/ai/platform-selector";
import type { Platform } from "@/lib/constants/platforms";

const audioFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  platforms: z
    .array(z.enum(["linkedin", "twitter", "email", "instagram", "facebook", "tiktok", "youtube"]))
    .min(1, "Select at least one platform")
    .max(7, "Maximum 7 platforms allowed"),
});

type AudioFormData = z.infer<typeof audioFormSchema>;

type PlanFeatures = {
  canUseAudio: boolean;
  audioLimits?: { usedMinutes: number; limitMinutes: number } | null;
};

export function NewProjectFlow() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<"text" | "audio">("text");
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [audioStep, setAudioStep] = useState<"idle" | "creating" | "transcribing">("idle");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const audioForm = useForm<AudioFormData>({
    resolver: zodResolver(audioFormSchema),
    defaultValues: {
      title: "",
      platforms: ["linkedin"],
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscription/features");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setPlanFeatures({
          canUseAudio: data.canUseAudio === true,
          audioLimits: data.audioLimits ?? null,
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onAudioSubmit(data: AudioFormData) {
    const file = selectedFile ?? audioInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Select an audio file");
      return;
    }

    setAudioError(null);
    setAudioStep("creating");

    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          platforms: data.platforms,
          sourceContent: "",
        }),
      });

      const createBody = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        setAudioStep("idle");
        toast.error(createBody.error ?? createBody.details ?? "Failed to create project");
        return;
      }

      const projectId = createBody.project?.id;
      if (!projectId) {
        setAudioStep("idle");
        toast.error("Project created but ID missing");
        return;
      }

      setAudioStep("transcribing");

      const formData = new FormData();
      formData.set("file", file);

      const ingestRes = await fetch(`/api/projects/${projectId}/ingest-audio`, {
        method: "POST",
        body: formData,
      });

      const ingestBody = await ingestRes.json().catch(() => ({}));

      if (!ingestRes.ok) {
        setAudioStep("idle");
        setAudioError(ingestBody.details ?? ingestBody.error ?? "Transcription failed");
        toast.error(ingestBody.details ?? ingestBody.error ?? "Transcription failed");
        router.push(`/projects/${projectId}/generate`);
        router.refresh();
        return;
      }

      toast.success("Audio transcribed. Redirecting to generate.");
      router.push(`/projects/${projectId}/generate`);
      router.refresh();
    } catch (err) {
      setAudioStep("idle");
      const msg = err instanceof Error ? err.message : "An error occurred";
      setAudioError(msg);
      toast.error(msg);
    }
  }

  const canUseAudio = planFeatures?.canUseAudio ?? false;

  return (
    <div className="space-y-6">
      <Tabs
        value={sourceType}
        onValueChange={(v) => {
          setSourceType(v as "text" | "audio");
          setAudioError(null);
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Текст
          </TabsTrigger>
          <TabsTrigger
            value="audio"
            disabled={!canUseAudio}
            className="flex items-center gap-2"
            title={!canUseAudio ? "Доступно в плане Текст + Аудио" : undefined}
          >
            <Mic className="h-4 w-4" />
            Аудио
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-6">
          <ProjectForm />
        </TabsContent>

        <TabsContent value="audio" className="mt-6">
          {!canUseAudio ? (
            <p className="text-sm text-muted-foreground">
              Загрузка аудио доступна в плане «Текст + Аудио». Выберите «Текст» или обновите подписку.
            </p>
          ) : (
            <Form {...audioForm}>
              <form
                onSubmit={audioForm.handleSubmit(onAudioSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={audioForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter project title"
                          disabled={audioStep !== "idle"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={audioForm.control}
                  name="platforms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Platforms *</FormLabel>
                      <FormControl>
                        <PlatformSelector
                          selectedPlatforms={field.value ?? []}
                          onPlatformToggle={(platform) => {
                            const p = platform as Platform;
                            const current = field.value ?? [];
                            const next = current.includes(p)
                              ? current.filter((x) => x !== p)
                              : [...current, p];
                            field.onChange(next);
                          }}
                          disabled={audioStep !== "idle"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Audio file *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.flac"
                        className="hidden"
                        disabled={audioStep !== "idle"}
                        onChange={(e) => {
                          setAudioError(null);
                          setSelectedFile(e.target.files?.[0] ?? null);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => audioInputRef.current?.click()}
                        disabled={audioStep !== "idle"}
                      >
                        {audioStep === "creating" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Создание проекта…
                          </>
                        ) : audioStep === "transcribing" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Транскрипция аудио…
                          </>
                        ) : (
                          <>
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Выбрать файл
                          </>
                        )}
                      </Button>
                      {planFeatures?.audioLimits && (
                        <p className="text-xs text-muted-foreground">
                          Использовано: {planFeatures.audioLimits.usedMinutes} /{" "}
                          {planFeatures.audioLimits.limitMinutes} мин в периоде.
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        MP3, M4A, WAV, WebM, OGG или FLAC.
                      </p>
                    </div>
                  </FormControl>
                  {audioError && (
                    <p className="text-sm text-destructive">{audioError}</p>
                  )}
                </FormItem>

                <Button
                  type="submit"
                  disabled={audioStep !== "idle" || !selectedFile}
                >
                  {audioStep !== "idle" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Project
                </Button>
              </form>
            </Form>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
