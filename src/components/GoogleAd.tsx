import { useEffect } from 'react';

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
  }
}

export function GoogleAd({ 
  slot, 
  format = "auto", 
  responsive = true, 
  style,
  className = ""
}: GoogleAdProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        console.log('Attempting to load AdSense ad for slot:', slot);
        console.log('Container dimensions:', style);
        
        // Check if AdSense script is loaded
        if (typeof window.adsbygoogle === 'undefined') {
          console.error('AdSense script not loaded yet');
          return;
        }
        
        // Get the actual container element to check its dimensions
        const container = document.querySelector(`ins[data-ad-slot="${slot}"]`);
        if (!container) {
          console.error('Ad container not found for slot:', slot);
          return;
        }
        
        // Check if container has proper dimensions
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.warn('Ad container has zero dimensions, skipping ad load for slot:', slot);
          return;
        }
        
        // Push the ad to Google AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('AdSense ad pushed successfully');
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }, 200); // Increased delay to allow layout to settle

    return () => clearTimeout(timer);
  }, [slot, style]);

  return (
    <div className={className}>
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