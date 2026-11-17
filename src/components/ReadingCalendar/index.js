import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useAppTheme';
import { createStyles } from './style';

const WEEK_DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPausedDayKeys(sessions, todayKey) {
  const readingDays = [...new Set(sessions.map((session) => session.date))]
    .filter((date) => date <= todayKey)
    .sort();
  const pausedDays = new Set();

  readingDays.forEach((readingDay, index) => {
    const [year, month, day] = readingDay.split('-').map(Number);
    const nextReadingDay = readingDays[index + 1];

    for (let missedDays = 1; missedDays <= 2; missedDays += 1) {
      const candidate = new Date(year, month - 1, day + missedDays);
      const candidateKey = toDateKey(candidate);
      if (candidateKey > todayKey || (nextReadingDay && candidateKey >= nextReadingDay)) break;
      pausedDays.add(candidateKey);
    }
  });

  return pausedDays;
}

function LegendItem({ colorStyle, label, styles }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, colorStyle]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

export default function ReadingCalendar({ sessions }) {
  const styles = useThemedStyles(createStyles);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const today = new Date();
  const todayKey = toDateKey(today);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoForward = visibleMonth < currentMonth;

  const readingDays = useMemo(
    () => new Set(sessions.map((session) => session.date)),
    [sessions],
  );
  const pausedDays = useMemo(
    () => getPausedDayKeys(sessions, todayKey),
    [sessions, todayKey],
  );

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekdayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: firstWeekdayOffset }, (_, index) => ({ key: `empty-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, key: `day-${index + 1}` })),
  ];
  const monthLabel = visibleMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  function changeMonth(offset) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Seu calendário de leitura</Text>
        <Text style={styles.subtitle}>Veja os dias em que leu e quando sua sequência ficou pausada.</Text>
      </View>

      <View style={styles.monthNavigation}>
        <Pressable
          onPress={() => changeMonth(-1)}
          style={styles.monthButton}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
        >
          <Text style={styles.monthButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <Pressable
          onPress={() => changeMonth(1)}
          disabled={!canGoForward}
          style={[styles.monthButton, !canGoForward && styles.monthButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
        >
          <Text style={styles.monthButtonText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekDays}>
        {WEEK_DAYS.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}
      </View>

      <View style={styles.grid}>
        {calendarCells.map((cell) => {
          if (!cell.day) return <View key={cell.key} style={styles.dayCell} />;

          const dateKey = toDateKey(new Date(year, month, cell.day));
          const wasRead = readingDays.has(dateKey);
          const isPaused = !wasRead && pausedDays.has(dateKey);
          const isToday = dateKey === todayKey;

          return (
            <View key={cell.key} style={styles.dayCell}>
              <View style={[
                styles.dayBubble,
                wasRead && styles.dayRead,
                isPaused && styles.dayPaused,
                isToday && styles.dayToday,
              ]}>
                <Text style={[styles.dayNumber, (wasRead || isPaused) && styles.dayNumberMarked]}>
                  {cell.day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendItem styles={styles} colorStyle={styles.legendRead} label="Leu" />
        <LegendItem styles={styles} colorStyle={styles.legendPaused} label="Pausa da streak" />
        <LegendItem styles={styles} colorStyle={styles.legendInactive} label="Sem streak" />
      </View>
    </View>
  );
}
