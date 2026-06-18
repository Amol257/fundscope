'use client';

import { useEffect } from 'react';

export default function ErrorSuppressor() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Ignore ResizeObserver loop limit errors which are benign but caught aggressively by Next.js 15 dev overlay
      if (
        event.reason && 
        (event.reason.message?.includes('ResizeObserver') || String(event.reason).includes('ResizeObserver'))
      ) {
        event.preventDefault();
      }
    };
    
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('ResizeObserver')) {
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
