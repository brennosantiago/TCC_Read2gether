import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { TABS } from '../../constants/tabs';
import { THEMES } from '../../constants/colors';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './style';

export default function TabBar({ state }) {
  const theme = useAppTheme();
  const selectedRoute = state.routes[state.index]?.name;
  const colors = selectedRoute === 'read' ? THEMES.dark : theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((item) => item.name === route.name);
        if (!tab) return null;
        const selected = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              if (selected) return;
              router.navigate(route.name === 'index' ? '/' : `/${route.name}`);
            }}
            accessibilityRole="button"
            accessibilityState={selected ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            style={styles.item}
          >
            {tab.iconType === 'person' ? (
              <View style={styles.profileIcon}>
                <View style={[styles.profileHead, selected && styles.profileShapeSelected]} />
                <View style={[styles.profileBody, selected && styles.profileShapeSelected]} />
              </View>
            ) : (
              <Text style={[styles.icon, selected && styles.iconSelected]}>{tab.icon}</Text>
            )}
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
            {selected && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}
