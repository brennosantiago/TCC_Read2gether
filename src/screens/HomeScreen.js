import { Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useAppTheme';
import Button from '../components/Button';
import BookCard from '../components/BookCard';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import ReadingCalendar from '../components/ReadingCalendar';
import SectionTitle from '../components/SectionTitle';
import { createStyles } from '../styles/screens';

export default function HomeScreen({ books, sessions, onNavigate, pagesThisWeek, weeklyGoal, weeklyProgress, streak, streakPaused, setSelectedBookId, profileName }) {
  const styles = useThemedStyles(createStyles);
  const currentBook = books.find((book) => book.status === 'Lendo');
  return (
    <>
      <Text style={styles.eyebrow}>SEU ESPAÇO DE LEITURA</Text>
      <Text style={styles.pageTitle}>Olá, {profileName?.trim() || 'leitor(a)'} 👋</Text>
      <Text style={styles.pageSubtitle}>Um pouquinho de leitura já conta.</Text>
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>{streakPaused ? 'SEQUÊNCIA PAUSADA' : 'SUA SEQUÊNCIA'}</Text>
            <Text style={[styles.heroNumber, streakPaused && styles.streakPausedHero]}>{streakPaused ? 'Ⅱ' : '🔥'} {streak} {streak === 1 ? 'dia' : 'dias'}</Text>
          </View>
          <Text style={styles.heroIcon}>📖</Text>
        </View>
        <Text style={styles.heroHint}>{streakPaused ? 'Leia hoje para reativar sua sequência. Ela zera depois de 3 dias seguidos sem ler.' : 'A streak só zera depois de 3 dias seguidos sem ler.'}</Text>
      </Card>
      <SectionTitle title="Sua semana" action="Ver metas →" onAction={() => onNavigate('goals')} />
      <Card>
        <View style={styles.weekHeader}><Text style={styles.cardHeading}>Páginas lidas</Text><Text style={styles.weekCount}>{pagesThisWeek}<Text style={styles.weekTotal}> / {weeklyGoal}</Text></Text></View>
        <ProgressBar value={weeklyProgress} />
        <Text style={styles.helperText}>{weeklyProgress >= 100 ? 'Meta semanal alcançada. Que conquista! ✨' : `Faltam ${Math.max(0, weeklyGoal - pagesThisWeek)} páginas para sua meta.`}</Text>
      </Card>
      <Card>
        <ReadingCalendar sessions={sessions} />
      </Card>
      <SectionTitle title="Continue de onde parou" action="Minha estante →" onAction={() => onNavigate('books')} />
      {currentBook ? <BookCard book={currentBook} onPress={() => { setSelectedBookId(currentBook.id); onNavigate('read'); }} /> : (
        <Card><Text style={styles.cardHeading}>Escolha sua próxima leitura</Text><Text style={styles.helperText}>Adicione um livro à estante e comece no seu ritmo.</Text></Card>
      )}
      <Button onPress={() => onNavigate('read')}>Começar uma leitura  →</Button>
    </>
  );
}
