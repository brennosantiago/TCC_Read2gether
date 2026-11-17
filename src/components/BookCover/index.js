import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useAppTheme';
import { createStyles } from './style';

export default function BookCover({ title, uri, size = 'library' }) {
  const styles = useThemedStyles(createStyles);
  const [failedUri, setFailedUri] = useState(null);
  const isSearchSize = size === 'search';

  return (
    <View style={[styles.cover, isSearchSize && styles.searchCover]}>
      {uri && failedUri !== uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailedUri(uri)}
          accessibilityLabel={`Capa de ${title}`}
        />
      ) : (
        <Text
          style={[styles.fallback, isSearchSize && styles.searchFallback]}
          accessibilityLabel="Capa indisponível"
        >
          {title?.trim()?.charAt(0)?.toLocaleUpperCase() || 'L'}
        </Text>
      )}
    </View>
  );
}
