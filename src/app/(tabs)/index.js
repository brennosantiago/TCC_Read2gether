import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import HomeScreen from '../../screens/HomeScreen';
import { useReadingTracker } from '../../hooks/useReadingTracker';
import { useAuth } from '../../hooks/useAuth';
import { styles } from '../../styles/app';

export default function HomeRoute() {
  const tracker = useReadingTracker();
  const { profileName } = useAuth();
  const router = useRouter();
  const onNavigate = (tab) => router.navigate(tab === 'home' ? '/' : `/${tab}`);
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><HomeScreen {...tracker} profileName={profileName} onNavigate={onNavigate} /></ScrollView>;
}
