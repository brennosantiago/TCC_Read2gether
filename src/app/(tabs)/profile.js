import { ScrollView } from 'react-native';
import ProfileScreen from '../../screens/ProfileScreen';
import { useReadingTracker } from '../../hooks/useReadingTracker';
import { styles } from '../../styles/app';

export default function ProfileRoute() {
  const { booksAddedByUser, sessions } = useReadingTracker();
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <ProfileScreen booksAddedByUser={booksAddedByUser} sessions={sessions} />
    </ScrollView>
  );
}
