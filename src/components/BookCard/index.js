import { Pressable, Text, View } from 'react-native';
import BookCover from '../BookCover';
import ProgressBar from '../ProgressBar';
import { useThemedStyles } from '../../hooks/useAppTheme';
import { createStyles } from './style';

export default function BookCard({ book, onPress }) {
  const styles = useThemedStyles(createStyles);
  const percent = book.total > 0 ? Math.round((book.current / book.total) * 100) : 0;
  const statusStyle = book.status === 'Concluído' ? styles.statusDone : styles.status;
  return (
    <Pressable onPress={onPress} style={styles.bookCard}>
      <BookCover title={book.title} uri={book.thumbnail} />
      <View style={styles.info}>
        <View style={styles.titleLine}><Text style={styles.title} numberOfLines={1}>{book.title}</Text><Text style={statusStyle}>{book.status}</Text></View>
        <Text style={styles.author}>{book.author}</Text>
        <View style={styles.progressLine}><ProgressBar value={percent} /><Text style={styles.percent}>{percent}%</Text></View>
        <Text style={styles.pages}>{book.current} de {book.total} páginas</Text>
      </View>
    </Pressable>
  );
}
