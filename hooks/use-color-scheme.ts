// Sem ThemeContext — retorna 'dark' hardcoded
// Elimina completamente a dependência do ThemeProvider customizado
export function useColorScheme(): "light" | "dark" {
  return "dark";
}
