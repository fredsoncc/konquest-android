# Coordenação de Agentes — Konquest Android

Este arquivo é o ponto de referência para agentes de IA trabalhando em paralelo neste repositório. Leia este documento antes de alterar qualquer arquivo do projeto e atualize-o sempre que concluir uma tarefa relevante, iniciar uma área de trabalho com risco de conflito ou descobrir um bloqueio técnico.

> **Regra principal:** antes de modificar código, execute `git fetch origin && git status --short --branch` e verifique se há mudanças remotas. Trabalhe em arquivos pequenos e bem delimitados, faça commits atômicos e registre abaixo o que foi feito.

## Estado do checkpoint

| Campo | Valor |
|---|---|
| Data do checkpoint | 2026-05-19, horário do usuário GMT-3 |
| Branch base observada | `main` |
| Commit base observado | `28f83e7` — `fix: corrigir crash ThemeProvider e import ws no bundle esbuild` |
| Responsável por este checkpoint | Manus |
| Escopo deste commit | Apenas documentação de coordenação; nenhum código funcional alterado |

## Resumo do projeto

O projeto é um porte do clássico **Konquest** para Android usando **React Native**, **Expo SDK 54**, **TypeScript**, **Expo Router** e **NativeWind**. A lógica principal do jogo está em `lib/game-engine.ts`; o estado React fica em `lib/game-context.tsx`; as telas ficam em `app/`; componentes visuais ficam em `components/`; o servidor WebSocket multiplayer fica em `server/multiplayer.ts`.

## Estado técnico verificado neste checkpoint

| Verificação | Resultado | Observação |
|---|---:|---|
| `pnpm install --frozen-lockfile` | Passou | Dependências instaladas localmente no sandbox para validação. |
| `pnpm test` | Passou parcialmente | `tests/game-engine.test.ts` e `tests/multiplayer.test.ts` passaram; `tests/auth.logout.test.ts` está marcado como skipped. Total: 17 testes passaram e 1 skipped. |
| `pnpm check` | Falhou | Erro TypeScript por ausência de declaração de tipos do pacote `ws` em `server/multiplayer.ts:36`. |

O erro atual de tipagem é:

```text
server/multiplayer.ts:36:31 - error TS7016: Could not find a declaration file for module 'ws'.
Try `npm i --save-dev @types/ws` if it exists or add a new declaration (.d.ts) file containing `declare module 'ws';`
```

Esse problema não foi corrigido neste checkpoint para evitar interferência com outros agentes; fica listado como próxima tarefa recomendada.

## Tarefas já concluídas segundo `todo.md`

O arquivo `todo.md` indica que o motor de jogo, geração de mapa, combate, produção por turno, movimentação de frotas, detecção de vencedor, IA básica, telas principais, ajuda, tema visual, logo, configuração do app, checkpoint/APK, melhorias no tamanho dos planetas, painel de status, multiplayer e correções recentes de crash/import do `ws` já foram marcados como concluídos.

## Pendências conhecidas

| Prioridade | Tarefa | Arquivos prováveis | Critério de conclusão |
|---|---|---|---|
| Alta | Corrigir `pnpm check` adicionando tipagem para `ws` sem quebrar o bundle CommonJS usado em runtime. | `package.json`, `pnpm-lock.yaml`, possivelmente `server/multiplayer.ts` ou um `.d.ts` local | `pnpm check` passa e `pnpm test` continua passando. |
| Média | Implementar tela de placar final indicada como pendente em `todo.md`. | `app/`, `lib/game-context.tsx`, `lib/game-engine.ts`, componentes novos se necessário | Ao terminar o jogo, usuário vê placar final com vencedor e estatísticas básicas. |
| Média | Validar fluxo multiplayer em dispositivo real ou ambiente Expo. | `app/multiplayer-*`, `server/multiplayer.ts`, `lib/multiplayer-client.ts` | Criar sala, entrar, marcar pronto, enviar ordens e finalizar turnos sem crash. |
| Baixa | Atualizar README para refletir o multiplayer online/local e comandos atuais. | `README.md` | README descreve estado real, scripts e limitações conhecidas. |

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
| `server/multiplayer.ts` | Houve correções recentes relacionadas ao pacote `ws`; preserve o uso de `createRequire` salvo se testar runtime e build. |
| `lib/game-engine.ts` | Contém regras centrais e é coberto por testes; qualquer ajuste pode alterar comportamento do jogo. |
| `app/_layout.tsx` e `lib/theme-provider.tsx` | Houve correção recente de crash envolvendo `ThemeProvider`; alterações precisam validar inicialização do app. |
| `package.json` e `pnpm-lock.yaml` | Afetam CI, build EAS e ambiente dos demais agentes. |
| `.github/workflows/build-apk.yml` | Build automático de APK e release; alterações podem disparar ou quebrar pipeline. |

## Comandos úteis

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm dev
pnpm build
```

## Registro de trabalho dos agentes

| Data/hora | Agente | Status | Tarefa | Arquivos tocados | Resultado / próximo passo |
|---|---|---|---|---|---|
| 2026-05-19 GMT-3 | Manus | Concluído | Criar arquivo raiz de coordenação para agentes paralelos | `AGENTS.md` | Documentado estado do repositório, comandos verificados, pendências e protocolo de colaboração. Próximo agente deve corrigir o erro de tipagem do `ws` ou implementar a tela de placar final. |

## Notas para futuros agentes

Preserve a licença GPL-2.0+ mencionada no README. Não remova testes existentes para fazer validações passarem. Se o objetivo for gerar APK, confirme que o segredo `EXPO_TOKEN` está configurado no GitHub Actions e que o workflow `Build APK (Android)` continua apontando para a branch `main`.
