import { View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { styles } from './style';

export default function ProgressBar({ value, color }) {
  const { colors } = useAppTheme();
  const width = `${Math.max(0, Math.min(value, 100))}%`;
  return <View style={[styles.track, { backgroundColor: colors.border }]}><View style={[styles.fill, { width, backgroundColor: color || colors.purple }]} /></View>;
}
