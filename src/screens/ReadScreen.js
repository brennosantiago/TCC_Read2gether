import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useThemedStyles } from '../hooks/useAppTheme';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import { createStyles } from '../styles/screens';
import { useState } from 'react';

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ReadScreen({ books, selectedBookId, setSelectedBookId, timerSeconds, timerRunning, setTimerRunning, startTimer, resetTimer, registerReading, streak, streakPaused, pagesThisWeek, weeklyGoal, sessions, onNavigate }) {
  const styles = useThemedStyles(createStyles);
  const [pagesInput, setPagesInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const readableBooks = books.filter((book) => book.status !== 'Concluído');

  async function saveReading() {
    if (await registerReading(pagesInput, commentInput)) {
      setPagesInput('');
      setCommentInput('');
    }
  }

  return (
    <>
      <Text style={styles.eyebrow}>MOMENTO DE LEITURA</Text>
      <Text style={styles.pageTitle}>Hora de ler</Text>
      <Text style={styles.pageSubtitle}>O cronômetro é opcional. Você escolhe.</Text>
      {readableBooks.length > 0 ? (
        <>
          <Text style={styles.inputLabel}>LIVRO DA SESSÃO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bookChoices}>
            {readableBooks.map((book) => {
              const selected = selectedBookId === book.id;
              return (
                <Pressable key={book.id} onPress={() => setSelectedBookId(book.id)} style={[styles.bookChoice, selected && styles.bookChoiceSelected]}>
                  <Text style={[styles.bookChoiceTitle, selected && styles.bookChoiceTitleSelected]} numberOfLines={1}>{book.title}</Text>
                  <Text style={[styles.bookChoiceMeta, selected && styles.bookChoiceMetaSelected]}>{book.current} / {book.total} páginas</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Card style={styles.timerCard}>
            <Text style={styles.timerLabel}>TEMPO DE LEITURA</Text>
            <Text style={styles.timerDigits}>{formatTime(timerSeconds)}</Text>
            <View style={styles.timerActions}>
              <Button variant="soft" onPress={timerRunning ? () => setTimerRunning(false) : startTimer}>{timerRunning ? 'Ⅱ  Pausar' : timerSeconds > 0 ? '▶  Continuar' : '▶  Iniciar'}</Button>
              {timerSeconds > 0 && <Pressable onPress={resetTimer}><Text style={styles.resetText}>Zerar</Text></Pressable>}
            </View>
            <Text style={styles.timerHint}>{timerRunning ? 'Seu tempo está sendo contado.' : 'Você também pode registrar páginas sem cronometrar.'}</Text>
          </Card>
          <Text style={styles.inputLabel}>QUANTAS PÁGINAS VOCÊ LEU?</Text>
          <View style={styles.pagesInputRow}><TextInput value={pagesInput} onChangeText={setPagesInput} keyboardType="number-pad" placeholder="Ex.: 12" placeholderTextColor="#AAA2B5" style={styles.pagesInput} returnKeyType="done" /><Text style={styles.pagesSuffix}>páginas</Text></View>
          <Text style={styles.inputLabel}>COMENTÁRIO SOBRE A LEITURA (OPCIONAL)</Text>
          <TextInput
            value={commentInput}
            onChangeText={setCommentInput}
            placeholder="O que achou deste trecho?"
            placeholderTextColor="#AAA2B5"
            style={styles.readingCommentInput}
            maxLength={500}
            multiline
            accessibilityLabel="Comentário sobre esta leitura, opcional"
          />
          <Text style={styles.commentCounter}>{commentInput.length}/500</Text>
          <Button onPress={saveReading}>Salvar leitura  ✓</Button>
          <View style={styles.readStats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, streakPaused && styles.streakPaused]}>{streakPaused ? 'Ⅱ' : '🔥'} {streak}</Text>
              <Text style={styles.statLabel}>{streakPaused ? 'streak pausada' : 'dias de streak'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statValue}>{pagesThisWeek}</Text><Text style={styles.statLabel}>págs. nesta semana</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statValue}>{Math.max(0, weeklyGoal - pagesThisWeek)}</Text><Text style={styles.statLabel}>para a meta</Text></View>
          </View>
        </>
      ) : (
        <Card>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.cardHeading}>Sua estante está esperando</Text>
          <Text style={styles.helperText}>Adicione um livro para começar a registrar suas leituras.</Text>
          <Button onPress={() => onNavigate('books')}>Ir para meus livros</Button>
        </Card>
      )}
      {sessions.length > 0 && (
        <>
          <SectionTitle title="Leituras recentes" />
          {sessions.slice(-3).reverse().map((session) => {
            const book = books.find((item) => item.id === session.bookId);
            return (
              <View key={session.id} style={styles.sessionRow}>
                <Text style={styles.sessionIcon}>📖</Text>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionTitle}>{book?.title || 'Livro removido'}</Text>
                  <Text style={styles.sessionDate}>{session.date} · {session.pages} páginas lidas</Text>
                  {session.comment ? <Text style={styles.sessionComment}>{session.comment}</Text> : null}
                </View>
              </View>
            );
          })}
        </>
      )}
    </>
  );
}
