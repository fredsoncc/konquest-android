import { useColorScheme as useRNColorScheme } from "react-native";
import { useThemeContext } from "@/lib/theme-provider";

// Retorna o colorScheme do ThemeContext se disponível,
// caso contrário usa o hook nativo do React Native como fallback.
// Isso garante que nunca haverá crash por falta de Provider.
export function useColorScheme() {
  const ctx = useThemeContext();
  const rnScheme = useRNColorScheme();
  // ctx nunca é null agora (ThemeContext tem valor padrão),
  // mas usamos rnScheme como fallback extra de segurança
  return ctx?.colorScheme ?? rnScheme ?? "dark";
}
