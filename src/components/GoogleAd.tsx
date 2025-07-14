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

  useEffect(() => {
    // Prevent duplicate loading for the same slot
    if (loadedRef.current || window.loadedAdSlots?.has(slot)) {
      console.log('Ad already loaded for slot:', slot);
      return;
    }

    const timer = setTimeout(() => {
      try {
        console.log('Attempting to load AdSense ad for slot:', slot);
        console.log('Container dimensions:', style);
        
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
        
        // Check if container has proper dimensions
        const rect = container.getBoundingClientRect();
        const parentRect = container.parentElement?.getBoundingClientRect();
        
        console.log(`Container ${slot} dimensions:`, {
          width: rect.width,
          height: rect.height,
          parentWidth: parentRect?.width,
          parentHeight: parentRect?.height
        });
        
        if (rect.width === 0 || rect.height === 0 || !parentRect || parentRect.width === 0) {
          console.warn('Ad container or parent has zero dimensions, skipping ad load for slot:', slot);
          return;
        }
        
        // Mark as loaded
        loadedRef.current = true;
        window.loadedAdSlots?.add(slot);
        
        // Push the ad to Google AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('AdSense ad pushed successfully');
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [slot, style]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadedRef.current) {
        window.loadedAdSlots?.delete(slot);
        loadedRef.current = false;
      }
    };
  }, [slot]);

  return (
    <div ref={adRef} className={className} style={{ minWidth: style?.width, minHeight: style?.height }}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style
        }}
        data-ad-client="ca-pub-7925818683352197"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      >
      </ins>
    </div>
  );
}