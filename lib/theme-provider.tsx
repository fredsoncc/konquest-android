// theme-provider.tsx — NO-OP completo
// O sistema de tema customizado foi removido para eliminar crashes no Android.
// O app Konquest usa tema escuro fixo — sem Context, sem vars(), sem nativewind.

import React from "react";

// ThemeProvider agora é um wrapper transparente
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// useThemeContext retorna valores estáticos — nunca lança erro
export function useThemeContext() {
  return {
    colorScheme: "dark" as const,
    setColorScheme: (_scheme: "light" | "dark") => {},
  };
}
