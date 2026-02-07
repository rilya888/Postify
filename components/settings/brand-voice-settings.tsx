"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BrandVoiceForm } from "@/components/brand-voice/brand-voice-form";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Check } from "lucide-react";

type BrandVoice = {
  id: string;
  name: string;
  description: string | null;
  tone: string;
  style: string;
  personality: string;
  sentenceStructure: string;
  vocabulary: string[];
  avoidVocabulary: string[];
  examples: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function BrandVoiceSettings() {
  const t = useTranslations("brandVoice");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadVoices = useCallback(async () => {
    try {
      const res = await fetch("/api/brand-voices");
      if (!res.ok) throw new Error("LOAD_FAILED");
      const data = await res.json();
      setVoices(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (session?.user?.id) loadVoices();
  }, [session?.user?.id, loadVoices]);

  async function setActive(id: string) {
    try {
      const res = await fetch(`/api/brand-voices?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error("SET_ACTIVE_FAILED");
      toast.success(t("activated"));
      loadVoices();
    } catch {
      toast.error(t("setActiveFailed"));
    }
  }

  async function deleteVoice(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      const res = await fetch(`/api/brand-voices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("DELETE_FAILED");
      toast.success(t("deleted"));
      setEditingId(null);
      loadVoices();
    } catch {
      toast.error(t("deleteFailed"));
    }
  }

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const activeVoice = voices.find((v) => v.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("manageDescription")}</p>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {t("create")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("createTitle")}</DialogTitle>
            </DialogHeader>
            <BrandVoiceForm
              userId={session?.user?.id ?? ""}
              submitViaApi
              onSuccess={() => {
                setShowCreate(false);
                loadVoices();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {voices.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {voices.map((voice) => (
            <li key={voice.id}>
              <Card>
                <CardHeader className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {voice.name}
                      {voice.isActive && <Badge variant="secondary">{t("active")}</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {!voice.isActive && (
                        <Button variant="ghost" size="sm" onClick={() => setActive(voice.id)}>
                          <Check className="mr-1 h-4 w-4" />
                          {t("setActive")}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(editingId === voice.id ? null : voice.id)}
                        aria-label={t("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVoice(voice.id)}
                        className="text-destructive hover:text-destructive"
                        aria-label={tCommon("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {editingId === voice.id && (
                  <CardContent className="pt-0">
                    <BrandVoiceForm
                      userId={session?.user?.id ?? ""}
                      initialData={voice as import("@prisma/client").BrandVoice}
                      submitViaApi
                      onSuccess={() => {
                        setEditingId(null);
                        loadVoices();
                      }}
                    />
                  </CardContent>
                )}
                {editingId !== voice.id && (
                  <CardContent className="py-3 pt-0 text-sm text-muted-foreground">
                    <span className="font-medium">{t("toneLabel")}</span> {voice.tone}{" "}
                    <span className="font-medium">{t("styleLabel")}</span> {voice.style}
                  </CardContent>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {activeVoice && (
        <p className="text-xs text-muted-foreground">
          {t("activeProfile", { name: activeVoice.name })}
        </p>
      )}
    </div>
  );
}
