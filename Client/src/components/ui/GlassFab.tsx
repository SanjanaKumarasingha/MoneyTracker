import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

export interface GlassFabProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  /** primary = the page's one obvious "add" action; neutral = a secondary
   *  action stacked alongside it (e.g. Transfer next to Add on Records). */
  variant?: 'primary' | 'neutral';
  /** Diameter in px. Default 56 matches the size this was designed at;
   *  the highlight streak scales with it so smaller instances don't get a
   *  disproportionately large white patch (a real bug hit on Mobile's
   *  equivalent component before the highlight was made to scale). */
  size?: number;
}

// Web port of Mobile's GlassFab (Mobile/src/components/GlassFab.tsx) — same
// material and same design rationale (Fitts's Law, von Restorff / isolation
// effect, glass-only surfaces losing tactile affordance unless paired with a
// hard border + cast shadow + real press feedback), translated to CSS:
// backdrop-blur stands in for BlurView, active:scale-90 stands in for the
// spring squeeze (no haptics on web, so the visible "give" carries the
// whole tactile cue here).
//
// Tint is theme-aware for the same reason as Mobile: a tint tuned for one
// appearance reads wrong in the other. Light mode uses a darker/more
// saturated fill (primary-700) since a lighter one washes out against
// light content behind the blur; dark mode uses a lighter fill (blue-400)
// at lower opacity since the same dark tint reads as a near-black hole
// against dark content.
const GlassFab = ({ icon, variant = 'primary', size = 56, className, ...rest }: GlassFabProps) => {
  const highlightWidth = size * 0.34;
  const highlightHeight = size * 0.22;

  return (
    <button
      type="button"
      style={{ width: size, height: size }}
      className={clsx(
        'relative overflow-hidden rounded-full border border-white/40',
        'backdrop-blur-md flex items-center justify-center text-white shrink-0',
        'shadow-[0_8px_16px_-2px_rgba(29,78,216,0.18)]',
        'transition-transform duration-150 active:scale-90 hover:scale-105 cursor-pointer',
        variant === 'primary'
          ? 'bg-primary-700/55 dark:bg-blue-400/30'
          : 'bg-zinc-700/50 dark:bg-zinc-400/25',
        className,
      )}
      {...rest}
    >
      {/* Glossy top-left highlight — sells "sphere" rather than "tinted
          disc"; a real glass ball catches light unevenly, not uniformly. */}
      <span
        aria-hidden
        className="absolute rounded-full bg-white/50 pointer-events-none -rotate-[20deg]"
        style={{
          width: highlightWidth,
          height: highlightHeight,
          top: size * 0.09,
          left: size * 0.156,
        }}
      />
      <span style={{ fontSize: size * 0.42, lineHeight: 1 }} className="relative flex">
        {icon}
      </span>
    </button>
  );
};

export default GlassFab;
