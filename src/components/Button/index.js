import { Pressable, Text } from 'react-native';
import { useThemedStyles } from '../../hooks/useAppTheme';
import { createStyles } from './style';

export default function Button({ children, onPress, variant = 'primary', style, disabled = false }) {
  const styles = useThemedStyles(createStyles);
  const buttonStyle = variant === 'outline' ? styles.outlineButton : variant === 'soft' ? styles.softButton : styles.primaryButton;
  const labelStyle = variant === 'outline' ? styles.outlineLabel : variant === 'soft' ? styles.softLabel : styles.primaryLabel;
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[buttonStyle, disabled && styles.disabled, style]}>
      <Text style={labelStyle}>{children}</Text>
    </Pressable>
  );
}
