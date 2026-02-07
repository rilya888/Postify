'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserBrandVoices, getActiveBrandVoice, setActiveBrandVoice } from '@/lib/services/brand-voice';
import { BrandVoice } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BrandVoiceForm } from './brand-voice-form';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface BrandVoiceSelectorProps {
  onBrandVoiceSelect: (brandVoice: BrandVoice | null) => void;
  _projectId?: string;
}

export function BrandVoiceSelector({ onBrandVoiceSelect, _projectId }: BrandVoiceSelectorProps) {
  const t = useTranslations("brandVoiceSelector");
  const { data: session } = useSession();
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [activeBrandVoice, setActiveBrandVoiceState] = useState<BrandVoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadBrandVoices = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const voices = await getUserBrandVoices(session.user.id);
      setBrandVoices(voices);

      const activeVoice = await getActiveBrandVoice(session.user.id);
      setActiveBrandVoiceState(activeVoice);
      onBrandVoiceSelect(activeVoice); // Notify parent of selection
    } catch (error) {
      console.error('Error loading brand voices:', error);
      toast.error(t('loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [onBrandVoiceSelect, session?.user?.id, t]);

  useEffect(() => {
    if (session?.user?.id) {
      loadBrandVoices();
    }
  }, [session, showCreateDialog, loadBrandVoices]); // Reload when dialog closes

  async function handleSelect(brandVoiceId: string) {
    if (!session?.user?.id) return;

    try {
      if (brandVoiceId === 'none') {
        setActiveBrandVoiceState(null);
        onBrandVoiceSelect(null);
        return;
      }

      const success = await setActiveBrandVoice(brandVoiceId, session.user.id);
      if (success) {
        const selectedVoice = brandVoices.find(v => v.id === brandVoiceId) || null;
        setActiveBrandVoiceState(selectedVoice);
        onBrandVoiceSelect(selectedVoice);
        toast.success(t('activated'));
      }
    } catch (error) {
      console.error('Error setting active brand voice:', error);
      toast.error(t('setFailed'));
    }
  }

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{t('label')}</Label>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">{t('createNewProfile')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('createDialogTitle')}</DialogTitle>
            </DialogHeader>
            <BrandVoiceForm 
              userId={session?.user?.id || ''} 
              onSuccess={() => setShowCreateDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Select 
        value={activeBrandVoice?.id || 'none'} 
        onValueChange={handleSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('selectProfilePlaceholder')}>
            {activeBrandVoice ? activeBrandVoice.name : t('noneSelected')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('none')}</SelectItem>
          {brandVoices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex items-center justify-between">
                <span>{voice.name}</span>
                {voice.isActive && <Badge variant="secondary">{t('active')}</Badge>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeBrandVoice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('activeBrandVoiceTitle', { name: activeBrandVoice.name })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">{t('tone')}</p>
                <p>{activeBrandVoice.tone}</p>
              </div>
              <div>
                <p className="font-medium">{t('style')}</p>
                <p>{activeBrandVoice.style}</p>
              </div>
              <div>
                <p className="font-medium">{t('personality')}</p>
                <p>{activeBrandVoice.personality}</p>
              </div>
              <div>
                <p className="font-medium">{t('sentenceStructure')}</p>
                <p>{activeBrandVoice.sentenceStructure}</p>
              </div>
            </div>
            
            {activeBrandVoice.description && (
              <div className="mt-4">
                <p className="font-medium">{t('description')}</p>
                <p>{activeBrandVoice.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
