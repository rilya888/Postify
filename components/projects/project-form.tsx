"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PLATFORMS } from "@/lib/constants/platforms";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project";
import { Loader2, Plus, Save, Download } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAutoSaveDraft } from "@/lib/hooks/useAutoSaveDraft";
import { NotificationService } from "@/lib/services/notifications";

type ProjectFormProps = {
  initialData?: {
    title: string;
    sourceContent: string;
    platforms: ("linkedin" | "twitter" | "email")[];
  };
  projectId?: string;
  onSubmitSuccess?: () => void;
};

type ProjectFormData = z.infer<typeof createProjectSchema>;

/**
 * Project form component for creating and editing projects
 */
export function ProjectForm({ 
  initialData, 
  projectId, 
  onSubmitSuccess 
}: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  const isEditing = !!projectId;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(isEditing ? updateProjectSchema : createProjectSchema),
    defaultValues: {
      title: initialData?.title || "",
      sourceContent: initialData?.sourceContent || "",
      platforms: (initialData?.platforms as ("linkedin" | "twitter" | "email")[]) || [],
    },
  });

  // Auto-save draft functionality
  const [formData, setFormData] = useState(form.getValues());
  const [savedDraft, isSavingDraft] = useAutoSaveDraft(
    `project-draft-${projectId || 'new'}`, 
    formData
  );

  // Update formData when form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData(value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(data: ProjectFormData) {
    setIsSubmitting(true);
    setSaveProgress(10); // Start progress

    try {
      setSaveProgress(40); // Preparing request
      const url = isEditing 
        ? `/api/projects/${projectId}`
        : "/api/projects";
      
      const method = isEditing ? "PATCH" : "POST";
      
      setSaveProgress(60); // Sending request
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      setSaveProgress(80); // Processing response
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save project");
      }

      setSaveProgress(100); // Completed
      setTimeout(() => setSaveProgress(0), 500); // Reset progress

      // Clear draft after successful save
      localStorage.removeItem(`project-draft-${projectId || 'new'}`);

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
      setSaveProgress(0); // Error - reset progress
      NotificationService.error(
        "Error",
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          render={() => (
            <FormItem>
              <FormLabel>Select Platforms *</FormLabel>
              <div className="space-y-2">
                {Object.entries(PLATFORMS).map(([key, platform]) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name="platforms"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={key}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(key as string)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, key])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== key
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2">
                            <span>{platform.icon}</span>
                            <span>{platform.name}</span>
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
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
    </Form>
  );
}