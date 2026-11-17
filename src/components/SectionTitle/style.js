import { StyleSheet } from 'react-native';
export const createStyles = (COLORS) => StyleSheet.create({
  row: { marginTop: 6, marginBottom: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: COLORS.ink, fontSize: 17, fontWeight: '800' },
  action: { color: COLORS.purple, fontSize: 12, fontWeight: '700' },
});
