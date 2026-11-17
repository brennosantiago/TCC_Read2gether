import { StyleSheet } from 'react-native';
export const createStyles = (COLORS) => StyleSheet.create({
  bar: { minHeight: 66, paddingHorizontal: 4, paddingTop: 8, paddingBottom: 5, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface, flexDirection: 'row', justifyContent: 'space-around' },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  icon: { color: '#A49BAD', fontSize: 21, lineHeight: 24 },
  iconSelected: { color: COLORS.purple },
  profileIcon: { width: 22, height: 24, alignItems: 'center', justifyContent: 'center' },
  profileHead: { width: 8, height: 8, marginBottom: 2, borderRadius: 4, backgroundColor: '#A49BAD' },
  profileBody: { width: 18, height: 10, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: '#A49BAD' },
  profileShapeSelected: { backgroundColor: COLORS.purple },
  label: { marginTop: 2, color: '#A49BAD', fontSize: 9, fontWeight: '600' },
  labelSelected: { color: COLORS.purple, fontWeight: '800' },
  indicator: { position: 'absolute', top: -8, width: 25, height: 2, borderRadius: 1, backgroundColor: COLORS.purple },
});
