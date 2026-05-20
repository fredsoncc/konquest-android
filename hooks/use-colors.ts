import { Colors, type ThemeColorPalette } from "@/constants/theme";

// Retorna sempre o tema escuro — sem Context, sem hooks de sistema
export function useColors(): ThemeColorPalette {
  return Colors.dark;
}
