import { ScrollView } from 'react-native';
import BooksScreen from '../../screens/BooksScreen';
import { useReadingTracker } from '../../hooks/useReadingTracker';
import { styles } from '../../styles/app';

export default function BooksRoute() {
  const tracker = useReadingTracker();
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"><BooksScreen {...tracker} /></ScrollView>;
}
