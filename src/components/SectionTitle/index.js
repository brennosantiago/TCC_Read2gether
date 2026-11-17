import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useAppTheme';
import { createStyles } from './style';

export default function SectionTitle({ title, action, onAction }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Pressable onPress={onAction} hitSlop={8}><Text style={styles.action}>{action}</Text></Pressable> : null}
    </View>
  );
}
