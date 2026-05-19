# Konquest Android

Porte do clássico jogo de estratégia espacial **Konquest** (KDE Games) para Android, desenvolvido em **React Native + Expo**.

![Konquest](assets/images/icon.png)

## Sobre o jogo

Konquest é um jogo de estratégia por turnos baseado no Gnu-Lactic Konquest. O objetivo é expandir seu império interestelar conquistando planetas ao enviar frotas de naves. O último jogador com planetas vence.

O jogo original é escrito em C++/Qt para o ambiente KDE Linux. Este repositório contém um porte fiel da mecânica de jogo para Android, reescrito em TypeScript com React Native.

- Repositório original: [KDE/konquest](https://github.com/KDE/konquest)
- Licença original: GPL-2.0+

## Funcionalidades

| Recurso | Descrição |
|---|---|
| Mapa galáctico | Grade 10×10 com planetas interativos |
| Combate | Resolução com *kill percentage* fiel ao original |
| Produção | Planetas geram naves automaticamente por turno |
| Frotas | Envio com chegada proporcional à distância |
| IA | Jogador computador com estratégia de ataque |
| Multijogador local | Até 4 jogadores no mesmo dispositivo |
| Relatório de batalha | Resumo de combates e conquistas por turno |
| Tema espacial | Interface dark com estética galáctica |

## Tecnologias

- [Expo SDK 54](https://expo.dev)
- [React Native 0.81](https://reactnative.dev)
- [TypeScript 5.9](https://www.typescriptlang.org)
- [NativeWind 4](https://www.nativewind.dev) (Tailwind CSS)
- [Expo Router 6](https://expo.github.io/router)

## Como executar

```bash
# Instalar dependências
pnpm install

# Iniciar o servidor de desenvolvimento
pnpm dev

# Escanear o QR Code com o app Expo Go no Android
```

## Como gerar o APK

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login no Expo
eas login

# Build para Android
eas build --platform android --profile preview
```

## Estrutura do projeto

```
lib/
  game-engine.ts      ← Motor de jogo completo (lógica pura, sem UI)
  game-context.tsx    ← Contexto React + reducer para estado global
app/
  (tabs)/index.tsx    ← Tela inicial
  new-game.tsx        ← Configuração de novo jogo
  game.tsx            ← Tela principal com mapa galáctico
  help.tsx            ← Regras e tutorial
components/
  GalaxyMap.tsx       ← Mapa galáctico 10×10
  PlanetCell.tsx      ← Célula interativa de planeta
  FleetOrderPanel.tsx ← Painel de ordens de frota
  BattleReportModal.tsx ← Modal de relatório de batalha
tests/
  game-engine.test.ts ← 9 testes unitários do motor de jogo
```

## Licença

Este projeto é um porte derivado do Konquest (KDE), licenciado sob **GPL-2.0+**.
