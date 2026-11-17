import { ActivityIndicator, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export default function LoadingScreen() {
  const { colors, mode } = useAppTheme();
  const dark = mode === 'dark';
  const glow = dark ? '#33284A' : '#EEE5FF';
  const ring = dark ? '#44385A' : '#E2D6FA';
  const bookPaper = dark ? '#F7F1FF' : '#FFFFFF';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.paper }}>
      <View style={{ position: 'absolute', width: 460, height: 460, borderRadius: 230, backgroundColor: glow, opacity: 0.68 }} />
      <View style={{ position: 'absolute', width: 350, height: 350, borderRadius: 175, borderWidth: 1, borderColor: ring }} />
      <View style={{ position: 'absolute', width: 290, height: 290, borderRadius: 145, borderWidth: 1, borderColor: ring, opacity: 0.75 }} />

      <View style={{ width: 116, height: 116, marginBottom: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 36, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowColor: colors.purpleDark, shadowOpacity: dark ? 0.2 : 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
        <View style={{ width: 72, height: 54, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
          <View style={{ width: 34, height: 42, borderTopLeftRadius: 8, borderBottomLeftRadius: 5, backgroundColor: bookPaper, borderColor: colors.purple, borderWidth: 3, borderRightWidth: 1, transform: [{ skewY: '-8deg' }], paddingTop: 12, paddingHorizontal: 5 }}>
            <View style={{ height: 3, marginBottom: 5, borderRadius: 2, backgroundColor: colors.lilac2 }} />
            <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.lilac2 }} />
          </View>
          <View style={{ width: 34, height: 42, borderTopRightRadius: 8, borderBottomRightRadius: 5, backgroundColor: bookPaper, borderColor: colors.purple, borderWidth: 3, borderLeftWidth: 1, transform: [{ skewY: '8deg' }], paddingTop: 12, paddingHorizontal: 5 }}>
            <View style={{ height: 3, marginBottom: 5, borderRadius: 2, backgroundColor: colors.lilac2 }} />
            <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.lilac2 }} />
          </View>
        </View>
        <View style={{ position: 'absolute', top: 26, width: 3, height: 44, borderRadius: 2, backgroundColor: colors.purple }} />
        <View style={{ position: 'absolute', top: 18, right: 20, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gold }} />
      </View>

      <Text style={{ color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1.2 }}>
        read<Text style={{ color: colors.purple }}>2</Text>gether
      </Text>
      <Text style={{ marginTop: 8, color: colors.muted, fontSize: 13, letterSpacing: 0.2 }}>Sua próxima leitura começa aqui</Text>

      <View style={{ marginTop: 35, alignItems: 'center', gap: 11 }}>
        <ActivityIndicator color={colors.purple} size="small" />
        <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 1.2 }}>PREPARANDO SUA ESTANTE</Text>
      </View>
    </View>
  );
}
