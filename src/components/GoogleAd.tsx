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

// Global tracking of loaded ad slots per page
if (typeof window !== 'undefined') {
  if (!window.loadedAdSlots) {
    window.loadedAdSlots = new Set();
  }
  // Clear slots when page changes
  let currentPath = window.location.pathname;
  const checkPath = () => {
    if (window.location.pathname !== currentPath) {
      window.loadedAdSlots = new Set();
      currentPath = window.location.pathname;
    }
  };
  setInterval(checkPath, 100);
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
  const uniqueSlotId = `${slot}-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    // Prevent any duplicate loading - check both local and global state
    if (loadedRef.current || window.loadedAdSlots?.has(slot)) {
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
        
        // Mark as loaded globally to prevent any other instances
        loadedRef.current = true;
        window.loadedAdSlots?.add(slot);
        
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