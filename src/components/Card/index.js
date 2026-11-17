import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useAppTheme';
import { createStyles } from './style';

export default function Card({ children, style }) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}
