/**
 * Auto-save hook for the content repurposing tool
 */

import { useEffect, useRef } from 'react';

/**
 * Custom hook for debounced auto-saving
 */
export function useAutoSave(
  value: string,
  onSave: (value: string) => void,
  delay: number = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to trigger save after delay
    timeoutRef.current = setTimeout(() => {
      onSave(value);
    }, delay);

    // Cleanup function to clear timeout when component unmounts or deps change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, onSave, delay]);
}