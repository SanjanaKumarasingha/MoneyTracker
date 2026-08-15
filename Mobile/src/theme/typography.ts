import { TextStyle } from 'react-native';

// Named text styles pulled from the sizes already in use across the app
// (fontSize was drifting across 12+ ad hoc values) — no custom font, still
// the system font (SF/Roboto), just a consistent scale on top of it.
export const typography: Record<string, TextStyle> = {
  display: { fontSize: 34, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '500' },
  caption: { fontSize: 13, fontWeight: '500' },
  micro: { fontSize: 11, fontWeight: '600' },
};
