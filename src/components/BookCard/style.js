import { StyleSheet } from 'react-native';
export const createStyles = (COLORS) => StyleSheet.create({
  bookCard: { marginBottom: 11, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceRaised, flexDirection: 'row', gap: 12, alignItems: 'center' },
  info: { flex: 1 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  status: { overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, color: COLORS.purple, backgroundColor: COLORS.lilac, fontSize: 9, fontWeight: '700' },
  statusDone: { overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, color: COLORS.green, backgroundColor: COLORS.greenPale, fontSize: 9, fontWeight: '700' },
  author: { marginTop: 3, marginBottom: 10, color: COLORS.muted, fontSize: 11 },
  progressLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  percent: { width: 32, color: COLORS.ink, fontSize: 10, fontWeight: '700' },
  pages: { marginTop: 5, color: COLORS.muted, fontSize: 10 },
});
