import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadThemeMode, saveThemeMode } from '../services/database';
import { THEMES } from '../constants/colors';

const ThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [mode, setModeState] = useState('light');
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    loadThemeMode()
      .then((savedMode) => { if (isMounted) setModeState(savedMode); })
      .catch((error) => console.error('Não foi possível carregar a preferência de tema:', error))
      .finally(() => { if (isMounted) setIsThemeLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const setMode = useCallback(async (nextMode) => {
    const validMode = nextMode === 'dark' ? 'dark' : 'light';
    await saveThemeMode(validMode);
    setModeState(validMode);
  }, []);

  const value = useMemo(() => ({
    mode,
    colors: THEMES[mode],
    setMode,
    isThemeLoading,
  }), [mode, setMode, isThemeLoading]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeScope({ mode, children }) {
  const parent = useAppTheme();
  const value = useMemo(() => ({ ...parent, mode, colors: THEMES[mode] }), [parent, mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme precisa ser usado dentro de AppThemeProvider.');
  return context;
}

export function useThemedStyles(createStyles) {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [createStyles, colors]);
}
