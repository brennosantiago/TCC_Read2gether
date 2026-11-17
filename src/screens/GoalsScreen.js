import { Pressable, Text, View } from 'react-native';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import ReadingCalendar from '../components/ReadingCalendar';
import { useAppTheme, useThemedStyles } from '../hooks/useAppTheme';
import { createStyles } from '../styles/screens';

function Stepper({ caption, value, unit, step, onDecrease, onIncrease }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.goalControls}>
      <Text style={styles.controlCaption}>{caption}</Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepButton} onPress={onDecrease}><Text style={styles.stepText}>−</Text></Pressable>
        <Text style={styles.stepValue}>{value} {unit}</Text>
        <Pressable style={styles.stepButton} onPress={onIncrease}><Text style={styles.stepText}>+</Text></Pressable>
      </View>
    </View>
  );
}

export default function GoalsScreen({ pagesThisWeek, weeklyGoal, weeklyProgress, completedBooks, yearlyGoal, updateGoal, sessions }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <>
      <Text style={styles.eyebrow}>PROGRESSO</Text>
      <Text style={styles.pageTitle}>Metas de leitura</Text>
      <Text style={styles.pageSubtitle}>Contruindo constância em pequenos passos.</Text>
      <Card>
        <View style={styles.goalIcon}><Text>🌿</Text></View>
        <Text style={styles.goalLabel}>META DA SEMANA</Text>
        <Text style={styles.goalBig}>{pagesThisWeek}<Text style={styles.goalDenom}> / {weeklyGoal} páginas</Text></Text>
        <ProgressBar value={weeklyProgress} />
        <Text style={styles.helperText}>{weeklyProgress >= 100 ? 'Você chegou à sua meta semanal!' : `Mais ${Math.max(0, weeklyGoal - pagesThisWeek)} páginas até sua meta.`}</Text>
        <Stepper caption="Ajustar meta semanal" value={weeklyGoal} unit="pág." onDecrease={() => updateGoal('week', -10)} onIncrease={() => updateGoal('week', 10)} />
      </Card>
      <Card>
        <ReadingCalendar sessions={sessions} />
      </Card>
      <Card>
        <Text style={styles.cardHeading}>Desafio do ano</Text>
        <Text style={styles.helperText}>Livros concluídos em {new Date().getFullYear()}</Text>
        <View style={styles.yearRow}><Text style={styles.yearNumber}>{completedBooks}</Text><Text style={styles.yearSlash}>/ {yearlyGoal} livros</Text><Text style={styles.yearEmoji}>📚</Text></View>
        <ProgressBar value={(completedBooks / yearlyGoal) * 100} color={colors.green} />
        <Stepper caption="Ajustar desafio anual" value={yearlyGoal} unit="livros" onDecrease={() => updateGoal('year', -1)} onIncrease={() => updateGoal('year', 1)} />
      </Card>
    </>
  );
}
