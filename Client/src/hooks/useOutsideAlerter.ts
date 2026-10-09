import React from 'react';
import { useEffect } from 'react';

function useOutsideAlerter(callback: any) {
  const ref = React.useRef<HTMLDivElement>(null);
  // Callers pass a fresh inline callback every render - keep the latest one
  // in a ref so the listener never calls a stale closure, without
  // re-binding the document listener on every render.
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    const handleClick = (event: any) => {
      callbackRef.current(event);
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClick);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return ref;
}

export { useOutsideAlerter };
