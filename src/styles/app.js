import { StyleSheet } from 'react-native';
export const createThemeStyles = (COLORS) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.paper },
  appFrame: { flex: 1, backgroundColor: COLORS.paper },
  topBar: { minHeight: 70, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  brand: { color: COLORS.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.7 },
  brandAccent: { color: COLORS.purple },
  brandCaption: { marginTop: 1, color: COLORS.muted, fontSize: 11, letterSpacing: 0.2 },
  avatar: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lilac },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: COLORS.purpleDark, fontSize: 16, fontWeight: '800' },
});

export const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 21, paddingTop: 24, paddingBottom: 28 },
});
