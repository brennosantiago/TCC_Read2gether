import { useMemo } from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, Pressable, View, Text } from 'react-native';
import TabBar from '../../components/TabBar';
import { THEMES } from '../../constants/colors';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../hooks/useAuth';
import { createThemeStyles } from '../../styles/app';

export default function MainTabsLayout() {
  const { profilePhotoUri, profileName, user } = useAuth();
  const { mode, colors } = useAppTheme();
  const pathname = usePathname();
  const isReadingRoute = pathname === '/read';
  const activeMode = isReadingRoute ? 'dark' : mode;
  const activeColors = isReadingRoute ? THEMES.dark : colors;
  const styles = useMemo(() => createThemeStyles(activeColors), [activeColors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={activeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.appFrame}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>read<Text style={styles.brandAccent}>2</Text>gether</Text>
            <Text style={styles.brandCaption}>um capítulo de cada vez</Text>
          </View>
          <Pressable
            onPress={() => router.navigate('/profile')}
            style={styles.avatar}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
          >
            {profilePhotoUri
              ? <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
              : <Text style={styles.avatarText}>{profileName.trim().charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'L'}</Text>}
          </Pressable>
        </View>
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' }, sceneStyle: { backgroundColor: colors.paper } }} tabBar={(props) => <TabBar {...props} />}>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="goals" />
          <Tabs.Screen name="books" />
          <Tabs.Screen name="read" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
