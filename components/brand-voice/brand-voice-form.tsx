'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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

type BrandVoiceFormValues = {
  name: string;
  description?: string;
  tone: string;
  style: string;
  vocabulary: string;
  avoidVocabulary: string;
  sentenceStructure: string;
  personality: string;
  examples: string;
  isActive?: boolean;
};

interface BrandVoiceFormProps {
  userId: string;
  initialData?: BrandVoice;
  onSuccess?: () => void;
  /** When true, submit via fetch to /api/brand-voices (for use in client-only contexts) */
  submitViaApi?: boolean;
}

export function BrandVoiceForm({ userId, initialData, onSuccess, submitViaApi }: BrandVoiceFormProps) {
  const t = useTranslations('brandVoiceForm');
  const tValidation = useTranslations('validation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandVoiceSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, tValidation('nameRequired')).max(100, tValidation('nameMaxLength')),
        description: z.string().optional(),
        tone: z.string().min(1, t('toneRequired')),
        style: z.string().min(1, t('styleRequired')),
        vocabulary: z.string(),
        avoidVocabulary: z.string(),
        sentenceStructure: z.string().min(1, t('sentenceStructureRequired')),
        personality: z.string().min(1, t('personalityRequired')),
        examples: z.string(),
        isActive: z.boolean().optional(),
      }),
    [t, tValidation]
  );

  const form = useForm<BrandVoiceFormValues>({
    resolver: zodResolver(brandVoiceSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      tone: initialData?.tone || '',
      style: initialData?.style || '',
      vocabulary: initialData?.vocabulary ? initialData.vocabulary.join(', ') : '',
      avoidVocabulary: initialData?.avoidVocabulary ? initialData.avoidVocabulary.join(', ') : '',
      sentenceStructure: initialData?.sentenceStructure || '',
      personality: initialData?.personality || '',
      examples: initialData?.examples ? initialData.examples.join('\n') : '',
      isActive: initialData?.isActive || false,
    },
  });

  const toStrArray = (v: string | undefined, sep: ',' | '\n' = ','): string[] => {
    if (typeof v !== 'string') return [];
    return sep === ','
      ? v.split(',').map((s) => s.trim()).filter(Boolean)
      : v.split('\n').map((s) => s.trim()).filter(Boolean);
  };

  const buildBody = (values: BrandVoiceFormValues) => ({
    name: values.name,
    description: values.description || undefined,
    tone: values.tone,
    style: values.style,
    vocabulary: toStrArray(values.vocabulary, ','),
    avoidVocabulary: toStrArray(values.avoidVocabulary, ','),
    sentenceStructure: values.sentenceStructure,
    personality: values.personality,
    examples: toStrArray(values.examples, '\n'),
  });

  const onSubmit = async (values: BrandVoiceFormValues) => {
    setIsSubmitting(true);
    try {
      if (submitViaApi) {
        const body = buildBody(values);
        if (initialData) {
          const res = await fetch(`/api/brand-voices?id=${encodeURIComponent(initialData.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, isActive: values.isActive ?? initialData.isActive }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error ?? t('updateFailed'));
          }
          toast.success(t('updated'));
        } else {
          const res = await fetch('/api/brand-voices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error ?? t('createFailed'));
          }
          toast.success(t('created'));
        }
      } else {
        if (initialData) {
          await updateBrandVoice(initialData.id, userId, values);
          toast.success(t('updated'));
        } else {
          await createBrandVoice(userId, values);
          toast.success(t('created'));
        }
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving brand voice:', error);
      toast.error(error instanceof Error ? error.message : t('saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('namePlaceholder')} {...field} />
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
              <FormLabel>{t('descriptionLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('descriptionPlaceholder')}
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('toneLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('tonePlaceholder')} {...field} />
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
                <FormLabel>{t('styleLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('stylePlaceholder')} {...field} />
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
              <FormLabel>{t('vocabularyLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('vocabularyPlaceholder')}
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
              <FormLabel>{t('avoidVocabularyLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('avoidVocabularyPlaceholder')}
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="sentenceStructure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('sentenceStructureLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('sentenceStructurePlaceholder')} {...field} />
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
                <FormLabel>{t('personalityLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('personalityPlaceholder')} {...field} />
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
              <FormLabel>{t('examplesLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('examplesPlaceholder')}
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
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t('setActiveLabel')}</FormLabel>
                </div>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t('saving') : initialData ? t('updateButton') : t('createButton')}
        </Button>
      </form>
    </Form>
  );
}
