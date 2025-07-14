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
  }
}

// Global tracking of loaded ad slots
if (typeof window !== 'undefined' && !window.loadedAdSlots) {
  window.loadedAdSlots = new Set();
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
  const slotKey = `${slot}-${window.location.pathname}`;

  useEffect(() => {
    // Prevent duplicate loading for the same slot on the same page
    if (loadedRef.current || window.loadedAdSlots?.has(slotKey)) {
      return;
    }

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
        
        // Mark as loaded
        loadedRef.current = true;
        window.loadedAdSlots?.add(slotKey);
        
        // Push the ad to Google AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('AdSense ad loaded successfully for slot:', slot);
      } catch (error) {
        console.error('AdSense error for slot', slot, ':', error);
      }
    }, 500); // Longer delay for layout stability

    return () => {
      clearTimeout(timer);
    };
  }, [slot, slotKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadedRef.current) {
        window.loadedAdSlots?.delete(slotKey);
        loadedRef.current = false;
      }
    };
  }, [slotKey]);

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