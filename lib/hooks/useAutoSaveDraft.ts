import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * Hook for auto-saving project drafts to localStorage
 * Prevents data loss when user accidentally closes tab or navigates away
 */
export function useAutoSaveDraft<T>(
  key: string, 
  data: T, 
  delay: number = 1000
): [T | null, boolean] {
  const debouncedData = useDebounce(data, delay);
  const [savedData, setSavedData] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (debouncedData) {
      setIsSaving(true);
      try {
        localStorage.setItem(key, JSON.stringify(debouncedData));
        setSavedData(debouncedData);
      } catch (error) {
        console.error("Failed to save draft:", error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [debouncedData, key]);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setSavedData(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }, [key]);

  return [savedData, isSaving];
}