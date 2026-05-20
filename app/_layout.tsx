import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import "../global.css";
import { ThemeProvider as AppThemeProvider } from "@/lib/theme-provider";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GameProvider } from "@/lib/game-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

// ─── Error Boundary global ────────────────────────────────────────────────────
class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[Konquest] Erro:", error.message, info?.componentStack?.slice(0, 300));
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={errStyles.container}>
          <ScrollView contentContainerStyle={errStyles.content}>
            <Text style={errStyles.title}>⚠️ Erro inesperado</Text>
            <Text style={errStyles.message}>{this.state.error.message}</Text>
            {this.state.error.stack && (
              <Text style={errStyles.stack}>{this.state.error.stack.slice(0, 700)}</Text>
            )}
            <Pressable style={errStyles.btn} onPress={this.reset}>
              <Text style={errStyles.btnText}>Tentar Novamente</Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }
    return this.props.children as any;
  }
}

// ─── Inner layout — DEVE estar DENTRO do AppThemeProvider ────────────────────
function InnerLayout() {
  // useFonts aqui dentro garante que está APÓS o ThemeProvider na árvore
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // useColorScheme chama useThemeContext — só funciona dentro do ThemeProvider
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Esconde splash quando fontes carregam (ou falham) — nunca trava
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Aguarda fontes sem travar — se demorar, renderiza mesmo assim
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <NavThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <GameProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="new-game" options={{ headerShown: false }} />
          <Stack.Screen name="game" options={{ headerShown: false }} />
          <Stack.Screen name="help" options={{ headerShown: false }} />
          <Stack.Screen name="multiplayer-lobby" options={{ headerShown: false }} />
          <Stack.Screen name="multiplayer-game" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </GameProvider>
      <StatusBar style="light" backgroundColor="#0a0a1a" />
    </NavThemeProvider>
  );
}

// ─── Root layout — apenas providers que NÃO dependem de outros contextos ──────
export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <AppThemeProvider>
        <InnerLayout />
      </AppThemeProvider>
    </GlobalErrorBoundary>
  );
}

const errStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  content: { flexGrow: 1, padding: 24, paddingTop: 80 },
  title: { color: "#ef5350", fontSize: 22, fontWeight: "900", marginBottom: 16 },
  message: { color: "#e0f7fa", fontSize: 14, marginBottom: 16, fontFamily: "monospace" },
  stack: { color: "#90a4ae", fontSize: 11, marginBottom: 24, fontFamily: "monospace" },
  btn: { backgroundColor: "#0a7ea4", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
