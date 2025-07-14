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
    // Prevent any duplicate loading
    if (loadedRef.current || 
        window.loadedAdSlots?.has(slot) || 
        window.adLoadingSlots?.has(slot)) {
      return;
    }

    // Mark as loading immediately
    window.adLoadingSlots?.add(slot);

    // Multiple attempts with increasing delays to handle layout timing
    const attemptLoad = (attempt = 1, maxAttempts = 5) => {
      const delay = attempt * 200; // 200ms, 400ms, 600ms, 800ms, 1000ms
      
      setTimeout(() => {
        try {
          // Check if already loaded
          if (loadedRef.current || window.loadedAdSlots?.has(slot)) {
            window.adLoadingSlots?.delete(slot);
            return;
          }

          // Check if AdSense script is loaded
          if (typeof window.adsbygoogle === 'undefined') {
            if (attempt < maxAttempts) {
              attemptLoad(attempt + 1, maxAttempts);
              return;
            }
            console.error('AdSense script not loaded after', maxAttempts, 'attempts');
            window.adLoadingSlots?.delete(slot);
            return;
          }
          
          // Get the container element
          const container = adRef.current?.querySelector('ins');
          if (!container) {
            if (attempt < maxAttempts) {
              attemptLoad(attempt + 1, maxAttempts);
              return;
            }
            console.error('Ad container not found for slot:', slot, 'after', maxAttempts, 'attempts');
            window.adLoadingSlots?.delete(slot);
            return;
          }
          
          // Check dimensions
          const rect = container.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(container);
          const parentRect = container.parentElement?.getBoundingClientRect();
          
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            if (attempt < maxAttempts) {
              attemptLoad(attempt + 1, maxAttempts);
              return;
            }
            console.warn('Ad container still hidden after', maxAttempts, 'attempts for slot:', slot);
            window.adLoadingSlots?.delete(slot);
            return;
          }
          
          if (rect.width === 0 || rect.height === 0 || !parentRect || parentRect.width === 0) {
            if (attempt < maxAttempts) {
              console.log(`Attempt ${attempt}: Container dimensions not ready for slot ${slot}, retrying...`);
              attemptLoad(attempt + 1, maxAttempts);
              return;
            }
            console.warn('Ad container has zero dimensions after', maxAttempts, 'attempts for slot:', slot);
            window.adLoadingSlots?.delete(slot);
            return;
          }
          
          // Success! Load the ad
          loadedRef.current = true;
          window.loadedAdSlots?.add(slot);
          window.adLoadingSlots?.delete(slot);
          
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          console.log('AdSense ad loaded successfully for slot:', slot, 'on attempt', attempt);
          
        } catch (error) {
          console.error('AdSense error for slot', slot, 'on attempt', attempt, ':', error);
          if (attempt < maxAttempts) {
            attemptLoad(attempt + 1, maxAttempts);
          } else {
            window.adLoadingSlots?.delete(slot);
          }
        }
      }, delay);
    };

    // Start loading attempts
    attemptLoad();

    return () => {
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