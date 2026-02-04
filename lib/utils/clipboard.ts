/**
 * Clipboard utilities for the content repurposing tool
 */

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern clipboard API
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (fallbackError) {
      console.error('Failed to copy text to clipboard:', fallbackError);
      return false;
    }
  }
}

/**
 * Read text from clipboard with fallback for older browsers
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    // Modern clipboard API
    const text = await navigator.clipboard.readText();
    return text;
  } catch {
    // Cannot reliably read from clipboard in older browsers due to security restrictions
    console.warn('Reading from clipboard not supported in this browser');
    return null;
  }
}