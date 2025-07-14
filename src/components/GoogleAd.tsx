import { useEffect, useRef } from 'react';

interface GoogleAdProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
    loadedAdSlots?: Set<string>;
    adLoadingSlots?: Set<string>;
  }
}

// Global tracking with more aggressive prevention
if (typeof window !== 'undefined') {
  if (!window.loadedAdSlots) {
    window.loadedAdSlots = new Set();
  }
  if (!window.adLoadingSlots) {
    window.adLoadingSlots = new Set();
  }
}

export function GoogleAd({ 
  slot, 
  format = "auto", 
  responsive = true, 
  style,
  className = ""
}: GoogleAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Triple check - prevent any loading if slot is already loaded or loading
    if (loadedRef.current || 
        window.loadedAdSlots?.has(slot) || 
        window.adLoadingSlots?.has(slot)) {
      return;
    }

    // Mark as loading immediately to prevent races
    window.adLoadingSlots?.add(slot);

    const timer = setTimeout(() => {
      try {
        // Check if AdSense script is loaded
        if (typeof window.adsbygoogle === 'undefined') {
          console.error('AdSense script not loaded yet');
          return;
        }
        
        // Get the actual container element
        const container = adRef.current?.querySelector('ins');
        if (!container) {
          console.error('Ad container not found for slot:', slot);
          return;
        }
        
        // Check if the ad container is visible and has dimensions
        const rect = container.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(container);
        const parentRect = container.parentElement?.getBoundingClientRect();
        
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
          console.warn('Ad container is hidden, skipping ad load for slot:', slot);
          return;
        }
        
        if (rect.width === 0 || rect.height === 0 || !parentRect || parentRect.width === 0) {
          console.warn('Ad container has zero dimensions, skipping ad load for slot:', slot);
          return;
        }
        
        // Mark as loaded globally and remove from loading
        loadedRef.current = true;
        window.loadedAdSlots?.add(slot);
        window.adLoadingSlots?.delete(slot);
        
        // Push the ad to Google AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('AdSense ad loaded successfully for slot:', slot);
      } catch (error) {
        console.error('AdSense error for slot', slot, ':', error);
        // Remove from loading set if error occurs
        window.adLoadingSlots?.delete(slot);
      }
    }, 500); // Longer delay for layout stability

    return () => {
      clearTimeout(timer);
      // Clean up loading state if component unmounts before loading
      if (!loadedRef.current) {
        window.adLoadingSlots?.delete(slot);
      }
    };
    }, [slot]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadedRef.current) {
        // Don't remove from global tracking to prevent reloading
        loadedRef.current = false;
      }
    };
  }, []);

  return (
    <div ref={adRef} className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          ...style
        }}
        data-ad-client="ca-pub-7925818683352197"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}