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
    try {
      // Push the ad to Google AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{
          backgroundColor: '#f3f4f6',
          border: '2px dashed #d1d5db',
          minHeight: '90px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          ...style
        }}
        data-ad-client="ca-pub-7925818635321947"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      >
        <div style={{ textAlign: 'center' }}>
          <div>📢 Google AdSense</div>
          <div style={{ fontSize: '12px' }}>Slot: {slot}</div>
        </div>
      </ins>
    </div>
  );
}