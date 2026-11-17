import { StyleSheet } from 'react-native';
export const createStyles = (COLORS) => StyleSheet.create({
  cover: {
    width: 47,
    height: 61,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.lilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCover: { width: 58, height: 78, borderRadius: 9 },
  image: { width: '100%', height: '100%', backgroundColor: COLORS.lilac },
  fallback: { color: COLORS.purple, fontSize: 22, fontWeight: '800' },
  searchFallback: { fontSize: 27 },
});
