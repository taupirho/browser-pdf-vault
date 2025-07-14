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

    // Use intersection observer to ensure container is visible and sized
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target === adRef.current) {
          // Wait a bit more for layout to stabilize
          setTimeout(() => {
            try {
              // Check if AdSense script is loaded
              if (typeof window.adsbygoogle === 'undefined') {
                console.error('AdSense script not loaded yet');
                window.adLoadingSlots?.delete(slot);
                return;
              }
              
              // Get the actual container element
              const container = adRef.current?.querySelector('ins');
              if (!container) {
                console.error('Ad container not found for slot:', slot);
                window.adLoadingSlots?.delete(slot);
                return;
              }
              
              // Check if container has proper dimensions
              const rect = container.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(container);
              
              if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
                console.warn('Ad container is hidden, skipping ad load for slot:', slot);
                window.adLoadingSlots?.delete(slot);
                return;
              }
              
              if (rect.width === 0 || rect.height === 0) {
                console.warn('Ad container has zero dimensions, skipping ad load for slot:', slot);
                window.adLoadingSlots?.delete(slot);
                return;
              }
              
              // Final check - make sure we haven't already loaded this slot
              if (loadedRef.current || window.loadedAdSlots?.has(slot)) {
                window.adLoadingSlots?.delete(slot);
                return;
              }
              
              // Mark as loaded and push to AdSense
              loadedRef.current = true;
              window.loadedAdSlots?.add(slot);
              window.adLoadingSlots?.delete(slot);
              
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              console.log('AdSense ad loaded successfully for slot:', slot);
              
              // Disconnect observer after successful load
              observer.disconnect();
              
            } catch (error) {
              console.error('AdSense error for slot', slot, ':', error);
              window.adLoadingSlots?.delete(slot);
            }
          }, 800); // Wait for layout to fully settle
        }
      });
    }, {
      threshold: 0.1, // Load when 10% visible
      rootMargin: '50px' // Start loading 50px before coming into view
    });

    // Start observing when container is ready
    const checkContainer = () => {
      if (adRef.current) {
        observer.observe(adRef.current);
      } else {
        // Retry if container not ready
        setTimeout(checkContainer, 100);
      }
    };
    
    checkContainer();

    return () => {
      observer.disconnect();
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