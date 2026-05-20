import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

// Valor padrão seguro — usado quando o contexto não está disponível
// (ex: Expo Router Suspense boundary renderizando fora do ThemeProvider)
const DEFAULT_THEME: ThemeContextValue = {
  colorScheme: "dark",
  setColorScheme: () => {},
};

// Contexto com valor padrão — NUNCA retorna null, NUNCA lança erro
const ThemeContext = createContext<ThemeContextValue>(DEFAULT_THEME);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useSystemColorScheme() ?? "dark") as ColorScheme;
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);

  const applyScheme = useCallback((scheme: ColorScheme) => {
    try {
      nativewindColorScheme.set(scheme);
    } catch {}
    try {
      Appearance.setColorScheme?.(scheme);
    } catch {}
    if (typeof document !== "undefined") {
      try {
        const root = document.documentElement;
        root.dataset.theme = scheme;
        root.classList.toggle("dark", scheme === "dark");
        const palette = SchemeColors[scheme];
        Object.entries(palette).forEach(([token, value]) => {
          root.style.setProperty(`--color-${token}`, value);
        });
      } catch {}
    }
  }, []);

  const setColorScheme = useCallback(
    (scheme: ColorScheme) => {
      setColorSchemeState(scheme);
      applyScheme(scheme);
    },
    [applyScheme],
  );

  useEffect(() => {
    applyScheme(colorScheme);
  }, [applyScheme, colorScheme]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({ colorScheme, setColorScheme }),
    [colorScheme, setColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

// NUNCA lança erro — retorna valor padrão se fora do Provider
export function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext);
}
