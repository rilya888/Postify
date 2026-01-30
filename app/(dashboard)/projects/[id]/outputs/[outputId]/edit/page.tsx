/**
 * Page for editing an output
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ContentEditor from '@/components/editor/content-editor';
import PreviewPanel from '@/components/preview/preview-panel';
import { useAutoSave } from '@/hooks/use-auto-save';
import { getOutputById } from '@/lib/services/editor';
import { Platform } from '@/lib/constants/platforms';

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

  // Load the output content when the component mounts
  useEffect(() => {
    const loadOutput = async () => {
      if (!session?.user?.id) return;

      try {
        const output = await getOutputById(outputId, session.user.id);
        setContent(output.content);
        setOriginalContent(output.content);
        setPlatform(output.platform as Platform);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading output:', error);
        toast.error('Failed to load output content');
        router.push(`/projects/${projectId}`);
      }
    };

    if (session?.user?.id) {
      loadOutput();
    }
  }, [session, projectId, outputId, router]);

  // Handle auto-save
  useAutoSave(content, async (value) => {
    if (!session?.user?.id || value === originalContent) return;
    
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save content');
      }

      const updatedOutput = await response.json();
      setOriginalContent(updatedOutput.content);
      setHasUnsavedChanges(false);
      toast.success('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  }, 2000); // Save after 2 seconds of inactivity

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) return;
    
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save content');
      }

      const updatedOutput = await response.json();
      setOriginalContent(updatedOutput.content);
      setHasUnsavedChanges(false);
      toast.success('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
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
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back to Project
        </Button>
        <h1 className="text-3xl font-bold">Edit Content</h1>
        <p className="text-muted-foreground">
          Edit the generated content for {platform}
        </p>
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

        <div className="flex justify-between items-center">
          <div>
            {hasUnsavedChanges && (
              <p className="text-yellow-600">You have unsaved changes</p>
            )}
            {isSaving && (
              <p className="text-blue-600">Saving...</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}