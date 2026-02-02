'use client';

import { useState, useEffect } from 'react';
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
  projectId?: string;
}

export function BrandVoiceSelector({ onBrandVoiceSelect, projectId }: BrandVoiceSelectorProps) {
  const { data: session } = useSession();
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [activeBrandVoice, setActiveBrandVoiceState] = useState<BrandVoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadBrandVoices();
    }
  }, [session, showCreateDialog]); // Reload when dialog closes

  async function loadBrandVoices() {
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
      toast.error('Failed to load brand voices');
    } finally {
      setIsLoading(false);
    }
  }

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
        toast.success('Brand voice activated');
      }
    } catch (error) {
      console.error('Error setting active brand voice:', error);
      toast.error('Failed to set brand voice');
    }
  }

  if (isLoading) {
    return <div>Loading brand voices...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Brand Voice</Label>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Create New Profile</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Brand Voice Profile</DialogTitle>
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
          <SelectValue placeholder="Select a brand voice profile">
            {activeBrandVoice ? activeBrandVoice.name : 'No brand voice selected'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {brandVoices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex items-center justify-between">
                <span>{voice.name}</span>
                {voice.isActive && <Badge variant="secondary">Active</Badge>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeBrandVoice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Brand Voice: {activeBrandVoice.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Tone:</p>
                <p>{activeBrandVoice.tone}</p>
              </div>
              <div>
                <p className="font-medium">Style:</p>
                <p>{activeBrandVoice.style}</p>
              </div>
              <div>
                <p className="font-medium">Personality:</p>
                <p>{activeBrandVoice.personality}</p>
              </div>
              <div>
                <p className="font-medium">Sentence Structure:</p>
                <p>{activeBrandVoice.sentenceStructure}</p>
              </div>
            </div>
            
            {activeBrandVoice.description && (
              <div className="mt-4">
                <p className="font-medium">Description:</p>
                <p>{activeBrandVoice.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}