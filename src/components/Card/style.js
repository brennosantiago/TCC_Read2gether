import { StyleSheet } from 'react-native';
export const createStyles = (COLORS) => StyleSheet.create({
  card: { marginBottom: 16, padding: 18, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
});
