import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoadingScreen from '../components/LoadingScreen';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ReadingTrackerProvider, useReadingTracker } from '../hooks/useReadingTracker';
import { AppThemeProvider, useAppTheme } from '../hooks/useAppTheme';

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDataLoading } = useReadingTracker();
  const { isThemeLoading } = useAppTheme();

  if (isThemeLoading || isLoading || (isAuthenticated && isDataLoading)) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated} redirectTo="/">
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated} redirectTo="/login">
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <ReadingTrackerProvider>
            <RootNavigator />
          </ReadingTrackerProvider>
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
