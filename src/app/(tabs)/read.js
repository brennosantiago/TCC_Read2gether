import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemeScope, useAppTheme } from '../../hooks/useAppTheme';
import ReadScreen from '../../screens/ReadScreen';
import { useReadingTracker } from '../../hooks/useReadingTracker';
import { styles } from '../../styles/app';

function ReadContent() {
  const tracker = useReadingTracker();
  const router = useRouter();
  const { colors } = useAppTheme();
  return <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"><ReadScreen {...tracker} onNavigate={(tab) => router.navigate(tab === 'home' ? '/' : `/${tab}`)} /></ScrollView>;
}

export default function ReadRoute() {
  return <ThemeScope mode="dark"><ReadContent /></ThemeScope>;
}
