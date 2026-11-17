import { ScrollView } from 'react-native';
import GoalsScreen from '../../screens/GoalsScreen';
import { useReadingTracker } from '../../hooks/useReadingTracker';
import { styles } from '../../styles/app';

export default function GoalsRoute() {
  const tracker = useReadingTracker();
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><GoalsScreen {...tracker} /></ScrollView>;
}
