import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { DEFAULT_WEEKLY_GOAL, DEFAULT_YEARLY_GOAL } from '../constants/books';
import { loadTrackerData, saveTrackerData } from '../services/database';
import { useAuth } from './useAuth';

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateReadingStreak(sessions, now = new Date()) {
  const readingDays = new Set(sessions.map((session) => session.date));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let missedDays = 0;

  // A missed day is tolerated; the streak resets on the third consecutive missed day.
  while (missedDays < 3 && !readingDays.has(toDateKey(cursor))) {
    missedDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  if (missedDays === 3) return 0;

  let streak = 0;
  while (readingDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getWeekStart(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function countPagesThisWeek(sessions) {
  const weekStart = getWeekStart();
  return sessions.reduce((total, session) => {
    const [year, month, day] = session.date.split('-').map(Number);
    const sessionDate = new Date(year, month - 1, day);
    return sessionDate >= weekStart ? total + session.pages : total;
  }, 0);
}

const ReadingTrackerContext = createContext(null);

function useReadingTrackerState() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_WEEKLY_GOAL);
  const [yearlyGoal, setYearlyGoal] = useState(DEFAULT_YEARLY_GOAL);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [hydratedUserId, setHydratedUserId] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const timerId = setInterval(() => setTimerSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(timerId);
  }, [timerRunning]);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) return () => { isMounted = false; };
    loadTrackerData(user.id).then((data) => {
      if (!isMounted) return;
      setBooks(data.books);
      setSessions(data.sessions);
      setWeeklyGoal(data.weeklyGoal);
      setYearlyGoal(data.yearlyGoal);
      setSelectedBookId(data.books[0]?.id || null);
      setHydratedUserId(user.id);
    }).catch((error) => {
      console.error('Não foi possível carregar os dados locais:', error);
      Alert.alert('Falha ao abrir seus dados', 'Feche e abra o aplicativo novamente.');
    });
    return () => { isMounted = false; };
  }, [user?.id]);

  const selectedBook = books.find((book) => book.id === selectedBookId) || books[0] || null;
  const pagesThisWeek = useMemo(() => countPagesThisWeek(sessions), [sessions]);
  const streak = useMemo(() => calculateReadingStreak(sessions), [sessions]);
  const streakPaused = useMemo(() => (
    streak > 0 && !sessions.some((session) => session.date === toDateKey())
  ), [sessions, streak]);
  const weeklyProgress = Math.min(100, (pagesThisWeek / weeklyGoal) * 100);
  const completedBooks = books.filter((book) => book.status === 'Concluído').length;
  const booksAddedByUser = books.filter((book) => book.addedByUser).length;

  async function persistSnapshot(nextBooks, nextSessions, nextWeeklyGoal = weeklyGoal, nextYearlyGoal = yearlyGoal) {
    if (!user?.id) return false;
    try {
      await saveTrackerData(user.id, {
        books: nextBooks,
        sessions: nextSessions,
        weeklyGoal: nextWeeklyGoal,
        yearlyGoal: nextYearlyGoal,
      });
      return true;
    } catch (error) {
      console.error('Não foi possível salvar no SQLite:', error);
      Alert.alert('Não foi possível salvar', 'A alteração não foi gravada no aparelho. Tente novamente.');
      return false;
    }
  }

  async function registerReading(amount, comment = '') {
    const pages = Number(amount);
    if (!selectedBook) {
      Alert.alert('Adicione um livro', 'Cadastre um livro para registrar sua leitura.');
      return false;
    }
    if (!Number.isInteger(pages) || pages < 1) {
      Alert.alert('Confira as páginas', 'Digite um número inteiro maior que zero.');
      return false;
    }
    if (comment.length > 500) {
      Alert.alert('Comentário muito longo', 'O comentário pode ter no máximo 500 caracteres.');
      return false;
    }

    const nextPage = Math.min(selectedBook.total, selectedBook.current + pages);
    const pagesActuallyRead = nextPage - selectedBook.current;
    const isComplete = nextPage >= selectedBook.total;
    const nextBooks = books.map((book) => (
      book.id === selectedBook.id
        ? { ...book, current: nextPage, status: isComplete ? 'Concluído' : 'Lendo' }
        : book
    ));
    const nextSessions = [...sessions, {
      id: `${Date.now()}`,
      date: toDateKey(),
      pages: pagesActuallyRead,
      bookId: selectedBook.id,
      durationSeconds: timerSeconds,
      comment: comment.trim(),
    }];
    if (!await persistSnapshot(nextBooks, nextSessions)) return false;
    setBooks(nextBooks);
    setSessions(nextSessions);
    setTimerRunning(false);
    setTimerSeconds(0);
    Alert.alert(isComplete ? 'Livro concluído! 🎉' : 'Leitura registrada 📖', isComplete
      ? `${selectedBook.title} foi marcado como concluído.`
      : `${pagesActuallyRead} páginas adicionadas à sua estante.`);
    return true;
  }

  async function addBook({ title, author, total, googleVolumeId, thumbnail, description }) {
    const cleanTitle = title?.trim();
    const pageCount = Number(total);
    if (!cleanTitle) {
      Alert.alert('Falta o título', 'Digite o título do livro para continuar.');
      return false;
    }
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      Alert.alert('Confira o total de páginas', 'Digite um número inteiro maior que zero.');
      return false;
    }
    if (googleVolumeId && books.some((book) => book.googleVolumeId === googleVolumeId)) {
      Alert.alert('Livro já adicionado', 'Esse título já está na sua estante.');
      return false;
    }

    const newBook = {
      id: googleVolumeId || `${Date.now()}`,
      googleVolumeId,
      title: cleanTitle,
      author: author?.trim() || 'Autor não informado',
      total: pageCount,
      current: 0,
      status: 'Quero ler',
      addedByUser: true,
      thumbnail,
      description,
    };
    const nextBooks = [...books, newBook];
    if (!await persistSnapshot(nextBooks, sessions)) return false;
    setBooks(nextBooks);
    setSelectedBookId(newBook.id);
    return true;
  }

  async function updateGoal(type, difference) {
    const nextWeeklyGoal = type === 'week'
      ? Math.max(10, Math.min(300, weeklyGoal + difference))
      : weeklyGoal;
    const nextYearlyGoal = type === 'week'
      ? yearlyGoal
      : Math.max(1, Math.min(100, yearlyGoal + difference));
    if (!await persistSnapshot(books, sessions, nextWeeklyGoal, nextYearlyGoal)) return false;
    setWeeklyGoal(nextWeeklyGoal);
    setYearlyGoal(nextYearlyGoal);
    return true;
  }

  function startTimer() {
    if (!selectedBook) {
      Alert.alert('Adicione um livro', 'Cadastre um livro para iniciar uma sessão.');
      return;
    }
    setTimerRunning(true);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
  }

  return {
    books,
    sessions,
    isDataLoading: Boolean(user?.id && hydratedUserId !== user.id),
    weeklyGoal,
    yearlyGoal,
    selectedBook,
    selectedBookId,
    setSelectedBookId,
    timerSeconds,
    timerRunning,
    setTimerRunning,
    pagesThisWeek,
    streak,
    streakPaused,
    weeklyProgress,
    completedBooks,
    booksAddedByUser,
    registerReading,
    addBook,
    updateGoal,
    startTimer,
    resetTimer,
  };
}

export function ReadingTrackerProvider({ children }) {
  const tracker = useReadingTrackerState();
  return <ReadingTrackerContext.Provider value={tracker}>{children}</ReadingTrackerContext.Provider>;
}

export function useReadingTracker() {
  const tracker = useContext(ReadingTrackerContext);
  if (!tracker) throw new Error('useReadingTracker deve ser usado dentro de ReadingTrackerProvider.');
  return tracker;
}
