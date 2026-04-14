import { useEffect, CSSProperties } from 'react';

interface GoogleAdProps {
  adSlot: string;
  className?: string;
  style?: CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function GoogleAd({ adSlot, className = '', style = { display: 'block' }, format = 'auto', responsive = 'true' }: GoogleAdProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [adSlot]);

  return (
    <div className={`ad-container no-print ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-9098579198537351"
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
