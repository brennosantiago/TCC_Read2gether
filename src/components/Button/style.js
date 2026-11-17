import { StyleSheet } from 'react-native';
export const createStyles = (COLORS) => StyleSheet.create({
  primaryButton: { minHeight: 50, marginTop: 5, marginBottom: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: COLORS.purple },
  primaryLabel: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  outlineButton: { minHeight: 46, marginTop: 5, marginBottom: 7, borderRadius: 14, borderWidth: 1, borderColor: COLORS.lilac2, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  outlineLabel: { color: COLORS.purple, fontSize: 13, fontWeight: '700' },
  softButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.lilac, alignItems: 'center', justifyContent: 'center' },
  softLabel: { color: COLORS.purple, fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.55 },
});
