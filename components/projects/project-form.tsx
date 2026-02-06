"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { createProjectSchemaForTextForm, updateProjectSchema } from "@/lib/validations/project";
import PlatformSelector from "@/components/ai/platform-selector";
import PlatformSelectorWithPostCount from "@/components/ai/platform-selector-with-post-count";
import type { Platform } from "@/lib/constants/platforms";
import {
  DOCUMENT_INPUT_ACCEPT,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  SOURCE_CONTENT_MAX_LENGTH,
} from "@/lib/constants/documents";
import { truncateAtWordBoundary } from "@/lib/utils/truncate-text";
import { Loader2, Plus, Save, Download, Upload } from "lucide-react";
import type { ParseDocumentResponse } from "@/types/documents";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAutoSaveDraft } from "@/lib/hooks/useAutoSaveDraft";
import { NotificationService } from "@/lib/services/notifications";

type ProjectFormProps = {
  initialData?: {
    title: string;
    sourceContent: string;
    platforms: ("linkedin" | "twitter" | "email" | "instagram" | "facebook" | "tiktok" | "youtube")[];
    postsPerPlatform?: 1 | 2 | 3;
    postsPerPlatformByPlatform?: Partial<Record<Platform, 1 | 2 | 3>>;
  };
  projectId?: string;
  onSubmitSuccess?: () => void;
};

type ProjectFormData = z.infer<typeof createProjectSchemaForTextForm>;

/**
 * Project form component for creating and editing projects
 */
export function ProjectForm({ 
  initialData, 
  projectId, 
  onSubmitSuccess 
}: ProjectFormProps) {
  const router = useRouter();
  const t = useTranslations("documents");
  const tGen = useTranslations("generatePage");
  const tCommon = useTranslations("common");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<{
    canUseSeries: boolean;
    maxPostsPerPlatform: number;
  } | null>(null);
  const [extraPostsDialog, setExtraPostsDialog] = useState<{
    open: boolean;
    pendingData: ProjectFormData;
    newPostsPerPlatform?: number;
    extraPostsCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!projectId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscription/features");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setPlanFeatures({
          canUseSeries: data.canUseSeries === true,
          maxPostsPerPlatform: typeof data.maxPostsPerPlatform === "number" ? data.maxPostsPerPlatform : 1,
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initialPlatforms = (initialData?.platforms as Platform[]) || [];
  const initialByPlatform =
    initialData?.postsPerPlatformByPlatform &&
    typeof initialData.postsPerPlatformByPlatform === "object" &&
    Object.keys(initialData.postsPerPlatformByPlatform).length > 0
      ? initialData.postsPerPlatformByPlatform
      : initialPlatforms.length > 0
        ? Object.fromEntries(initialPlatforms.map((p) => [p, (initialData?.postsPerPlatform ?? 1) as 1 | 2 | 3]))
        : {};

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(isEditing ? updateProjectSchema : createProjectSchemaForTextForm),
    defaultValues: {
      title: initialData?.title || "",
      sourceContent: initialData?.sourceContent || "",
      platforms: initialPlatforms.length ? initialPlatforms : [],
      postsPerPlatform: initialData?.postsPerPlatform ?? 1,
      postsPerPlatformByPlatform: initialByPlatform,
    },
  });

  // Auto-save draft functionality
  const [formData, setFormData] = useState<ProjectFormData>(form.getValues());
  const [savedDraft, isSavingDraft] = useAutoSaveDraft(
    `project-draft-${projectId || 'new'}`,
    formData
  );

  // Update formData when form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData({
        title: value.title || "",
        sourceContent: value.sourceContent || "",
        platforms: (value.platforms || []).filter(Boolean) as Platform[],
        postsPerPlatform: value.postsPerPlatform ?? 1,
        postsPerPlatformByPlatform: value.postsPerPlatformByPlatform ?? {},
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function submitPayload(payload: ProjectFormData, confirmDeleteExtraPosts?: boolean) {
    const url = isEditing ? `/api/projects/${projectId}` : "/api/projects";
    const method = isEditing ? "PATCH" : "POST";
    const body = confirmDeleteExtraPosts
      ? { ...payload, confirmDeleteExtraPosts: true }
      : payload;
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return { ok: response.ok, result };
  }

  async function onSubmit(data: ProjectFormData, confirmDeleteExtraPosts?: boolean) {
    setIsSubmitting(true);
    setSaveProgress(10);

    try {
      setSaveProgress(40);
      setSaveProgress(60);
      const { ok, result } = await submitPayload(data, confirmDeleteExtraPosts);
      setSaveProgress(80);

      if (!ok) {
        if (
          isEditing &&
          result.code === "EXTRA_POSTS_EXIST" &&
          typeof result.extraPostsCount === "number"
        ) {
          setExtraPostsDialog({
            open: true,
            pendingData: data,
            newPostsPerPlatform: data.postsPerPlatformByPlatform ? undefined : (data.postsPerPlatform ?? 1),
            extraPostsCount: result.extraPostsCount,
          });
          setSaveProgress(0);
          setIsSubmitting(false);
          return;
        }
        throw new Error(result.message ?? result.error ?? "Failed to save project");
      }

      setSaveProgress(100);
      setTimeout(() => setSaveProgress(0), 500);
      localStorage.removeItem(`project-draft-${projectId || "new"}`);
      setExtraPostsDialog(null);

      NotificationService.success(
        isEditing ? "Project updated" : "Project created",
        isEditing
          ? "Your project has been updated successfully"
          : "Your project has been created successfully"
      );

      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        router.push("/projects");
        router.refresh();
      }
    } catch (error) {
      setSaveProgress(0);
      NotificationService.error(
        "Error",
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onConfirmDeleteExtraPosts() {
    if (!extraPostsDialog?.pendingData) return;
    setExtraPostsDialog((prev) => (prev ? { ...prev, open: false } : null));
    await onSubmit(extraPostsDialog.pendingData, true);
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      toast.error(t("fileTooLarge"));
      event.target.value = "";
      return;
    }
    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : "";
    const isTxt = ext === ".txt" || file.type === "text/plain";

    if (isTxt) {
      try {
        const text = await file.text();
        const { text: truncated, truncated: wasTruncated } = truncateAtWordBoundary(
          text,
          SOURCE_CONTENT_MAX_LENGTH
        );
        form.setValue("sourceContent", truncated);
        if (wasTruncated) {
          toast.warning("Текст обрезан до 10 000 символов");
        }
      } catch {
        toast.error("Не удалось загрузить файл");
      }
      event.target.value = "";
      return;
    }

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/documents/parse", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as ParseDocumentResponse & { error?: string; details?: string };
      if (!res.ok) {
        toast.error(data.details ?? data.error ?? t("loadFailed"));
        event.target.value = "";
        return;
      }
      form.setValue("sourceContent", data.text);
      if (data.truncated) {
        toast.warning(t("textTruncated"));
      }
    } catch {
      toast.error(t("loadFailed"));
    } finally {
      setIsUploadingFile(false);
      event.target.value = "";
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter project title"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sourceContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Content *</FormLabel>
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={DOCUMENT_INPUT_ACCEPT}
                  className="sr-only"
                  aria-label="Upload document file"
                  onChange={handleFileSelect}
                  disabled={isSubmitting || isUploadingFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isUploadingFile}
                  aria-label="Upload file (.txt, .pdf, .doc, .docx, .rtf)"
                >
                  {isUploadingFile ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {t("uploadFile")}
                </Button>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Paste your original content here..."
                  className="min-h-[200px]"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="platforms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Platforms *</FormLabel>
              <FormControl>
                {planFeatures?.canUseSeries ? (
                  <PlatformSelectorWithPostCount
                    selectedPlatforms={field.value ?? []}
                    postsPerPlatformByPlatform={form.watch("postsPerPlatformByPlatform") ?? {}}
                    onPlatformToggle={(platform) => {
                      const p = platform as Platform;
                      const current = field.value ?? [];
                      const next = current.includes(p)
                        ? current.filter((x) => x !== p)
                        : [...current, p];
                      field.onChange(next);
                      const byPlatform = form.getValues("postsPerPlatformByPlatform") ?? {};
                      if (next.includes(p) && !(p in byPlatform)) {
                        form.setValue("postsPerPlatformByPlatform", { ...byPlatform, [p]: 1 });
                      } else if (!next.includes(p)) {
                        const rest = Object.fromEntries(
                          Object.entries(byPlatform).filter(([k]) => k !== p)
                        );
                        form.setValue("postsPerPlatformByPlatform", rest);
                      }
                    }}
                    onPostsPerPlatformChange={(platform, count) => {
                      const byPlatform = form.getValues("postsPerPlatformByPlatform") ?? {};
                      form.setValue("postsPerPlatformByPlatform", { ...byPlatform, [platform]: count });
                    }}
                    canUseSeries={planFeatures?.canUseSeries}
                    maxPostsPerPlatform={planFeatures?.maxPostsPerPlatform ?? 1}
                    disabled={isSubmitting}
                    postsCountLabel={tGen("postsCountLabel")}
                  />
                ) : (
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
                    disabled={isSubmitting}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {saveProgress > 0 && (
          <ProgressBar 
            value={saveProgress} 
            label={isSubmitting ? "Saving project..." : "Processing..."} 
            description={saveProgress < 100 ? "Please wait" : "Complete!"} 
          />
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" /> Update Project
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </>
            )}
          </Button>
          
          {savedDraft && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                form.reset(savedDraft);
                toast.success("Your unsaved changes have been restored");
              }}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Restore Draft
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      <AlertDialog
        open={extraPostsDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setExtraPostsDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tGen("deleteExtraPostsTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {extraPostsDialog?.newPostsPerPlatform != null
                ? tGen("deleteExtraPostsDescription", {
                    n: extraPostsDialog.newPostsPerPlatform,
                    count: extraPostsDialog.extraPostsCount ?? 0,
                  })
                : tGen("deleteExtraPostsDescriptionPerPlatform", {
                    count: extraPostsDialog?.extraPostsCount ?? 0,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDeleteExtraPosts}>
              {tGen("deleteAndUpdate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}