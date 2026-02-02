'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createBrandVoice, updateBrandVoice } from '@/lib/services/brand-voice';
import { BrandVoice } from '@prisma/client';

// Define the schema for brand voice form
const brandVoiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  tone: z.string().min(1, 'Tone is required'),
  style: z.string().min(1, 'Style is required'),
  vocabulary: z.string().transform(str => str.split(',').map(s => s.trim()).filter(s => s)),
  avoidVocabulary: z.string().transform(str => str.split(',').map(s => s.trim()).filter(s => s)),
  sentenceStructure: z.string().min(1, 'Sentence structure is required'),
  personality: z.string().min(1, 'Personality is required'),
  examples: z.string().transform(str => str.split('\n').map(s => s.trim()).filter(s => s)),
  isActive: z.boolean().optional(),
});

type BrandVoiceFormValues = z.infer<typeof brandVoiceSchema>;

interface BrandVoiceFormProps {
  userId: string;
  initialData?: BrandVoice;
  onSuccess?: () => void;
}

export function BrandVoiceForm({ userId, initialData, onSuccess }: BrandVoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BrandVoiceFormValues>({
    resolver: zodResolver(brandVoiceSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      tone: initialData?.tone || '',
      style: initialData?.style || '',
      // @ts-expect-error - Type conversion for form initialization
      vocabulary: initialData?.vocabulary ? initialData.vocabulary.join(', ') : '',
      // @ts-expect-error - Type conversion for form initialization
      avoidVocabulary: initialData?.avoidVocabulary ? initialData.avoidVocabulary.join(', ') : '',
      sentenceStructure: initialData?.sentenceStructure || '',
      personality: initialData?.personality || '',
      // @ts-expect-error - Type conversion for form initialization
      examples: initialData?.examples ? initialData.examples.join('\n') : '',
      isActive: initialData?.isActive || false,
    },
  });

  async function onSubmit(values: BrandVoiceFormValues) {
    setIsSubmitting(true);
    try {
      if (initialData) {
        // Update existing brand voice
        await updateBrandVoice(initialData.id, userId, values);
        toast.success('Brand voice updated successfully');
      } else {
        // Create new brand voice
        await createBrandVoice(userId, values);
        toast.success('Brand voice created successfully');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving brand voice:', error);
      toast.error('Failed to save brand voice');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Professional, Casual, Corporate" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe this brand voice profile..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tone *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., professional, casual, friendly, authoritative" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Style *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., formal, conversational, storytelling" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="vocabulary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Vocabulary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter preferred words/phrases, separated by commas"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avoidVocabulary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vocabulary to Avoid</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter words/phrases to avoid, separated by commas"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="sentenceStructure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sentence Structure *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., short, medium, complex, varied" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personality *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., confident, humble, humorous, serious" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="examples"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Example Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter example content that represents this brand voice, one per line"
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Set as Active Brand Voice</FormLabel>
                </div>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving...' : initialData ? 'Update Profile' : 'Create Profile'}
        </Button>
      </form>
    </Form>
  );
}