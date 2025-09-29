/**
 * Copy text to clipboard - simple and reliable approach
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern approach - try clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (clipboardError) {
        console.log('Clipboard API failed, trying fallback:', clipboardError);
        // Continue to fallback
      }
    }
    
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Enhanced copy function that tries multiple methods
 */
export async function copyToClipboardEnhanced(text: string): Promise<boolean> {
  // Try the standard approach first
  const standardResult = await copyToClipboard(text);
  if (standardResult) return true;
  
  // If standard approach fails, try with a temporary visible element
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.style.zIndex = '-1';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Enhanced copy failed:', error);
    return false;
  }
}

/**
 * Show share dialog with native sharing if available (mobile)
 */
export async function shareContent(title: string, text: string, url?: string): Promise<boolean> {
  try {
    // Check if native sharing is available (mobile browsers)
    if (navigator.share) {
      const shareData: any = {
        title,
        text,
      };
      
      if (url) {
        shareData.url = url;
      }
      
      await navigator.share(shareData);
      return true;
    }
    
    // Fallback to clipboard
    const fullText = url ? `${text}\n\n${url}` : text;
    return await copyToClipboard(fullText);
  } catch (error) {
    console.error('Failed to share content:', error);
    return false;
  }
}
