// Single source of truth for the app's "glass" material — every glass
// surface (GlassFab, GlassButton, the wallet carousel's cards) pulls these
// same values instead of each hand-tuning its own blur/tint/highlight, so
// "consistent glass style" stays true by construction rather than by
// everyone remembering to copy the same numbers.
export const GLASS = {
  blurIntensity: 55,
  // The blur samples whatever's behind it, so one fixed tint can't work in
  // both appearances: over light-mode content it washes out toward white
  // (needs a darker/more saturated fill to stay legible as "blue glass"),
  // over dark-mode content the same fill reads as a near-black blob (needs
  // a lighter tint to still look like glass instead of a hole). Standard
  // glassmorphism range is roughly 20-40% fill opacity — light mode sits at
  // the darker/higher end of that, dark mode at the lighter/lower end.
  tintLight: 'rgba(29,78,216,0.55)', // primaryDark, more saturated
  tintDark: 'rgba(96,165,250,0.32)', // a lighter blue (blue-400), thinner fill
  borderColor: 'rgba(255,255,255,0.4)',
  highlightColor: 'rgba(255,255,255,0.5)',
};
