/**
 * Page for editing an output
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { RotateCcw, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import ContentEditor from '@/components/editor/content-editor';
import PreviewPanel from '@/components/preview/preview-panel';
import { useAutoSave } from '@/hooks/use-auto-save';
import { Platform } from '@/lib/constants/platforms';
import { PLATFORM_CHARACTER_LIMITS } from '@/lib/constants/editor';

export default function EditOutputPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { id: projectId, outputId } = useParams<{ id: string; outputId: string }>();
  
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [platform, setPlatform] = useState<Platform>('linkedin'); // Default value
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [canRevert, setCanRevert] = useState(false);
  const [serverOriginalContent, setServerOriginalContent] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [outputsList, setOutputsList] = useState<{ id: string; platform: string }[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<string | null>(null);

  const getDraftKey = useCallback(
    () => (projectId && outputId ? `editor-draft-${projectId}-${outputId}` : null),
    [projectId, outputId]
  );
  const clearDraft = useCallback(() => {
    const key = getDraftKey();
    if (key) try { localStorage.removeItem(key); } catch { /* ignore */ }
  }, [getDraftKey]);

  // Load the output content when the component mounts (via API so it works in client)
  useEffect(() => {
    const loadOutput = async () => {
      if (!session?.user?.id) return;

      try {
        const [outputRes, projectRes] = await Promise.all([
          fetch(`/api/outputs/${outputId}`),
          projectId ? fetch(`/api/projects/${projectId}`) : null,
        ]);
        if (!outputRes.ok) {
          const data = await outputRes.json().catch(() => ({}));
          const message = data?.error ?? 'Output not found';
          if (outputRes.status === 404) {
            toast.error('Project or output no longer exists');
            router.push('/projects');
            return;
          }
          toast.error(data?.details ?? message);
          router.push(projectId ? `/projects/${projectId}` : '/projects');
          return;
        }
        const output = await outputRes.json();
        setContent(output.content);
        setOriginalContent(output.content);
        setPlatform(output.platform as Platform);
        setCanRevert(!!output.originalContent);
        setServerOriginalContent(output.originalContent ?? null);
        const draftKey = projectId && outputId ? `editor-draft-${projectId}-${outputId}` : null;
        if (draftKey) {
          try {
            const draft = localStorage.getItem(draftKey);
            if (draft && draft !== output.content) {
              setPendingDraft(draft);
              setShowRestoreDialog(true);
            }
          } catch { /* ignore */ }
        }
        if (projectRes?.ok) {
          const projectData = await projectRes.json();
          const list = projectData?.project?.outputs ?? projectData?.outputs ?? [];
          setOutputsList(list.map((o: { id: string; platform: string }) => ({ id: o.id, platform: o.platform })));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading output:', error);
        toast.error('Failed to load output content');
        router.push(projectId ? `/projects/${projectId}` : '/projects');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      loadOutput();
    }
  }, [session, projectId, outputId, router]);

  const limit = PLATFORM_CHARACTER_LIMITS[platform];
  const contentOverLimit = content.length > limit;

  // Handle auto-save
  useAutoSave(content, async (value) => {
    if (!session?.user?.id || value === originalContent) return;
    if (value.length > PLATFORM_CHARACTER_LIMITS[platform]) return; // Don't save when over limit
    setIsSaving(true);
    try {
      const response = await fetch(`/api/outputs/${outputId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: value }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.details ?? errorData?.error ?? 'Failed to save content';
        throw new Error(message);
      }

      const updatedOutput = await response.json();
      setOriginalContent(updatedOutput.content);
      setHasUnsavedChanges(false);
      clearDraft();
      toast.success('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      const message = error instanceof Error ? error.message : 'Failed to save content';
      toast.error(message);
      // Keep draft in localStorage and in form so user can retry
    } finally {
      setIsSaving(false);
    }
  }, 2000); // Save after 2 seconds of inactivity

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    if (contentOverLimit) {
      toast.error(`Content exceeds platform limit (max ${limit} characters)`);
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/outputs/${outputId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.details ?? errorData?.error ?? 'Failed to save content';
        throw new Error(message);
      }

      const updatedOutput = await response.json();
      setOriginalContent(updatedOutput.content);
      setHasUnsavedChanges(false);
      clearDraft();
      toast.success('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      const message = error instanceof Error ? error.message : 'Failed to save content';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = async () => {
    if (!session?.user?.id || !canRevert) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/outputs/${outputId}/revert`, { method: 'POST' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.details ?? data?.error ?? 'Failed to revert');
        return;
      }
      const reverted = await response.json();
      setContent(reverted.content);
      setOriginalContent(reverted.content);
      setHasUnsavedChanges(false);
      setCanRevert(false);
      clearDraft();
      toast.success('Reverted to original content');
    } catch (error) {
      console.error('Error reverting:', error);
      toast.error('Failed to revert');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (newContent !== originalContent) {
      setHasUnsavedChanges(true);
    }
  };

  // Debounced save to localStorage so we can restore after accidental close
  useEffect(() => {
    const key = getDraftKey();
    if (!key || !content) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, content);
      } catch { /* ignore */ }
    }, 2000);
    return () => clearTimeout(t);
  }, [content, getDraftKey]);

  // Handle navigation away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const currentIndex = outputsList.findIndex((o) => o.id === outputId);
  const prevOutput = currentIndex > 0 ? outputsList[currentIndex - 1] : null;
  const nextOutput = currentIndex >= 0 && currentIndex < outputsList.length - 1 ? outputsList[currentIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[500px] w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore unsaved draft?</AlertDialogTitle>
            <AlertDialogDescription>
              An unsaved draft was found. Do you want to restore it or continue with the saved content?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                clearDraft();
                setPendingDraft(null);
              }}
            >
              Dismiss
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDraft != null) {
                  setContent(pendingDraft);
                  setHasUnsavedChanges(true);
                }
                clearDraft();
                setPendingDraft(null);
                setShowRestoreDialog(false);
              }}
            >
              Restore draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back to Project
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Edit Content</h1>
            <p className="text-muted-foreground">
              Edit the generated content for {platform}
            </p>
          </div>
          {outputsList.length > 1 && (
            <div className="flex items-center gap-2">
              {prevOutput ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${projectId}/outputs/${prevOutput.id}/edit`}>
                    <ChevronLeft className="h-4 w-4" />
                    {prevOutput.platform}
                  </Link>
                </Button>
              ) : null}
              <span className="text-sm text-muted-foreground px-2">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${outputsList.length}` : ''}
              </span>
              {nextOutput ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${projectId}/outputs/${nextOutput.id}/edit`}>
                    {nextOutput.platform}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Editor Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <ContentEditor
                content={content}
                onChange={handleContentChange}
                platform={platform}
              />
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <PreviewPanel 
                content={content} 
                platform={platform} 
              />
            </CardContent>
          </Card>
        </div>

        {serverOriginalContent != null && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                <FileText className="h-4 w-4" />
                {showOriginal ? 'Hide original' : 'Show original content'}
              </Button>
            </CardHeader>
            {showOriginal && (
              <CardContent>
                <div
                  className="preview-content prose max-w-none whitespace-pre-wrap rounded border bg-muted/50 p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: serverOriginalContent }}
                />
              </CardContent>
            )}
          </Card>
        )}

        <div className="flex justify-between items-center">
          <div>
            {contentOverLimit && (
              <p className="text-red-600">Content exceeds platform limit ({content.length}/{limit}). Save is disabled.</p>
            )}
            {hasUnsavedChanges && !contentOverLimit && (
              <p className="text-yellow-600">You have unsaved changes</p>
            )}
            {isSaving && (
              <p className="text-blue-600">Saving...</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {canRevert && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRevert}
                disabled={isSaving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Revert to original
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || !hasUnsavedChanges || contentOverLimit}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}