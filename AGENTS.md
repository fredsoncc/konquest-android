# AGENTS.md — Coordenação de Agentes de IA

Este arquivo é o ponto de referência para agentes de IA trabalhando em paralelo neste repositório. Leia este documento antes de alterar qualquer arquivo do projeto e atualize-o sempre que concluir uma tarefa relevante, iniciar uma área de trabalho com risco de conflito ou descobrir um bloqueio técnico.

> **Regra principal:** antes de modificar código, execute `git fetch origin && git status --short --branch` e verifique se há mudanças remotas. Trabalhe em arquivos pequenos e bem delimitados, faça commits atômicos e registre abaixo o que foi feito.

## Estado do checkpoint

| Campo | Valor |
|---|---|
| Data do último checkpoint | 2026-05-20, horário do usuário GMT-3 |
| Branch base | `main` |
| Commit mais recente | `4d316b8` — `fix: ThemeContext singleton global + botao multiplayer visivel + useFonts no InnerLayout` |
| Responsável por este checkpoint | Manus |
| Escopo do último commit | Correção definitiva de crash no Android + botão multiplayer visível na tela inicial |

## Resumo do projeto

O projeto é um porte do clássico **Konquest** para Android usando **React Native**, **Expo SDK 54**, **TypeScript**, **Expo Router** e **NativeWind**. A lógica principal do jogo está em `lib/game-engine.ts`; o estado React fica em `lib/game-context.tsx`; as telas ficam em `app/`; componentes visuais ficam em `components/`; o servidor WebSocket multiplayer fica em `server/multiplayer.ts`.

## Estado técnico verificado no commit `4d316b8`

| Verificação | Resultado | Observação |
|---|---|---|
| `pnpm install --frozen-lockfile` | ✅ Passa | Dependências instaladas e lockfile atualizado. |
| `pnpm test` | ✅ Passa | 17 testes passam; `tests/auth.logout.test.ts` marcado como skipped (esperado). |
| `pnpm check` (TypeScript) | ✅ Passa | `@types/ws` instalado como devDependency — erro TS7016 resolvido. |
| App no simulador web | ✅ Funciona | Tela inicial, novo jogo, mapa galáctico, combate, multiplayer lobby — todos operacionais. |
| App em dispositivo Android real | ⚠️ Pendente validação | Crash `useThemeContext must be used within ThemeProvider` foi corrigido via singleton `globalThis`. Novo APK ainda não testado em hardware real após este fix. |

## Arquitetura de providers (crítico — não alterar sem ler)

O crash histórico no Android era causado por duplicação de módulo no Metro bundler. A solução implementada é:

```
GlobalErrorBoundary          ← captura qualquer erro JS
  └── AppThemeProvider       ← lib/theme-provider.tsx (usa globalThis singleton)
        └── InnerLayout      ← ÚNICO lugar que chama useColorScheme/useFonts
              └── NavThemeProvider
                    └── GameProvider
                          └── Stack (Expo Router)
```

**Regra:** `useColorScheme()`, `useThemeContext()` e `useFonts()` só podem ser chamados **dentro** do `InnerLayout` ou em componentes filhos dele — nunca no `RootLayout` diretamente.

O `ThemeContext` usa `globalThis.__KONQUEST_THEME_CTX__` como singleton para garantir que mesmo com duplicação de módulo no bundle Android, o contexto seja sempre o mesmo objeto.

## Tarefas já concluídas

| Tarefa | Commit/versão |
|---|---|
| Motor de jogo completo (planetas, frotas, combate, IA) | `efcdb08` |
| Telas principais (Home, NewGame, Game, Help) | `efcdb08` |
| Multiplayer via WebSockets (lobby, sala, chat, jogo online) | `dda066d` |
| Planetas maiores + painel de status de tropas | `39f46f7` |
| Correção `newArchEnabled`, ErrorBoundary, fontes resilientes | `b02d29f` |
| Correção import `ws` (CommonJS/esbuild) com `createRequire` | `28f83e7` |
| Correção crash `useThemeContext` via singleton `globalThis` | `4d316b8` |
| `useFonts` movido para `InnerLayout` (após ThemeProvider) | `4d316b8` |
| Botão Multiplayer visível na tela inicial | `4d316b8` |
| `@types/ws` instalado como devDependency | `4d316b8` |
| GitHub Actions para build automático de APK via EAS | `376ce70` |

## Pendências conhecidas

| Prioridade | Tarefa | Arquivos prováveis | Critério de conclusão |
|---|---|---|---|
| **Alta** | Validar APK em dispositivo Android real após fix do singleton | — | App abre sem crash no Motorola G73 e Poco X6 Pro |
| **Alta** | Implementar tela de placar final (indicada em `todo.md`) | `app/score.tsx` (novo), `lib/game-context.tsx`, `lib/game-engine.ts` | Ao terminar o jogo, usuário vê placar com vencedor e estatísticas |
| Média | Validar fluxo multiplayer em dispositivo real | `app/multiplayer-*`, `server/multiplayer.ts`, `lib/multiplayer-client.ts` | Criar sala, entrar, marcar pronto, enviar ordens e finalizar turnos sem crash |
| Média | Seleção rápida de naves (25%/50%/75%/100%) ao enviar frota | `components/FleetOrderPanel.tsx` | Botões de atalho funcionando ao selecionar planeta de origem |
| Baixa | Atualizar README para refletir estado atual (multiplayer, correções) | `README.md` | README descreve estado real, scripts e limitações conhecidas |
| Baixa | Suporte a orientação paisagem na tela do jogo | `app/game.tsx`, `app.config.ts` | Mapa galáctico rotaciona e se adapta em modo horizontal |

## Protocolo recomendado para trabalho paralelo

| Situação | Procedimento recomendado |
|---|---|
| Antes de começar | Rode `git fetch origin`, `git status --short --branch` e leia este arquivo. |
| Ao escolher uma tarefa | Registre em **Registro de trabalho dos agentes** uma linha com seu identificador, horário, tarefa e arquivos que pretende tocar. |
| Durante alterações | Evite mexer em arquivos fora do escopo declarado. Se precisar mudar o escopo, atualize este arquivo no mesmo commit ou em commit separado. |
| Antes de commit | Rode pelo menos `pnpm test`; se alterar tipos, servidor ou dependências, rode também `pnpm check`. |
| Antes de push | Rode `git pull --rebase origin main` para reduzir conflito com outros agentes. |
| Após concluir | Atualize o registro com resultado, comandos executados e próximos passos. |

## Áreas sensíveis a conflito

| Área | Motivo de atenção |
|---|---|
| `lib/theme-provider.tsx` | Contém singleton `globalThis.__KONQUEST_THEME_CTX__` — crítico para evitar crash no Android. Não remover sem testar APK real. |
| `app/_layout.tsx` | Ordem dos providers é crítica (ver seção Arquitetura acima). Qualquer mudança pode reintroduzir o crash. |
| `server/multiplayer.ts` | Usa `createRequire` para importar `ws` — necessário para compatibilidade CommonJS no bundle esbuild. Não trocar por `import { WebSocketServer } from 'ws'`. |
| `lib/game-engine.ts` | Contém regras centrais cobertas por testes. Qualquer ajuste pode alterar comportamento do jogo. |
| `package.json` e `pnpm-lock.yaml` | Afetam CI, build EAS e ambiente dos demais agentes. |
| `.github/workflows/build-apk.yml` | Build automático de APK — requer secret `EXPO_TOKEN` configurado no GitHub. |

## Comandos úteis

```bash
# Instalar dependências
pnpm install --frozen-lockfile

# Verificar tipos TypeScript
pnpm check

# Executar testes
pnpm test

# Iniciar servidor de desenvolvimento (Metro + API server)
pnpm dev

# Build de produção do servidor
pnpm build

# Gerar QR code para testar no Expo Go
pnpm qr
```

## Registro de trabalho dos agentes

| Data/hora | Agente | Status | Tarefa | Arquivos tocados | Resultado / próximo passo |
|---|---|---|---|---|---|
| 2026-05-19 GMT-3 | Manus | ✅ Concluído | Criar arquivo raiz de coordenação para agentes paralelos | `AGENTS.md` | Documentado estado do repositório, comandos verificados, pendências e protocolo de colaboração. |
| 2026-05-20 ~01:00 GMT-3 | Manus | ✅ Concluído | Corrigir crash `useThemeContext must be used within ThemeProvider` em APKs Android | `lib/theme-provider.tsx`, `app/_layout.tsx`, `app/(tabs)/index.tsx`, `package.json` | ThemeContext agora usa singleton `globalThis`. `useFonts` movido para `InnerLayout`. Botão Multiplayer adicionado à tela inicial. `@types/ws` instalado. `pnpm check` e `pnpm test` passam. |
| 2026-05-20 ~02:00 GMT-3 | Manus | ✅ Concluído | Corrigir crash do APK (Node.js import no config) e alinhar bundleId/scheme | `app.config.ts`, `constants/oauth.ts` | Removido import de `load-env.js` (Node.js modules) do config, corrigido bundleId/scheme no `oauth.ts` para evitar falhas de inicialização do Linking. versionCode incrementado para 4. |
| 2026-05-20 GMT-3 | Manus | Em andamento | Atualizar Java para JDK 21 e gerar APK do Konquest Revolution | `app.json`, `package.json`, `AGENTS.md` | Java atualizado. Renomeado para Konquest Revolution. Iniciando build EAS. |

## Notas para futuros agentes

- Preserve a licença **GPL-2.0+** mencionada no README.
- Não remova testes existentes para fazer validações passarem — corrija o código, não os testes.
- Se o objetivo for gerar APK, confirme que o secret `EXPO_TOKEN` está configurado em **Settings → Secrets → Actions** no GitHub e que o workflow `Build APK (Android)` aponta para a branch `main`.
- O app é um **Expo managed workflow** — não adicione código nativo (Java/Kotlin/Swift) sem migrar para bare workflow.
- O servidor Express + WebSocket roda na porta 3000 (API) e usa upgrade HTTP para WebSocket no mesmo servidor. Não crie um servidor separado.
