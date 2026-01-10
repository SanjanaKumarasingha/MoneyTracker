import React from 'react';
import { useEffect } from 'react';

function useOutsideAlerter(callback: any) {
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    const handleClick = (event: any) => {
      callback(event);
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClick);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClick);
    };
  }, [ref]);

  return ref;
}

export { useOutsideAlerter };
