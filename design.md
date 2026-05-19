# Konquest Android — Design Document

## Visão Geral
Porte fiel do jogo Konquest (KDE) para Android. Jogo de estratégia espacial por turnos onde jogadores conquistam planetas enviando frotas de naves.

## Screens

### 1. HomeScreen (Tela Inicial)
- Logo do jogo com título "Konquest"
- Botão "Novo Jogo"
- Botão "Como Jogar"
- Fundo: espaço sideral escuro com estrelas

### 2. NewGameScreen (Configuração de Jogo)
- Campo para número de planetas (5–20)
- Campo para número de turnos máximos
- Lista de jogadores (nome + cor)
- Botão "Adicionar Jogador" (até 4 jogadores)
- Botão "Iniciar Jogo"
- Botão "Novo Mapa" (gera mapa aleatório)

### 3. GameScreen (Tela Principal do Jogo)
- Mapa galáctico em grade (10×10) com planetas
- Cada planeta mostra: nome, dono (cor), naves
- Painel inferior: jogador atual, turno, ações
- Campo de entrada: "De → Para: N naves"
- Botão "Fim de Turno"
- Mini-log de eventos do turno

### 4. FleetOrderScreen (Ordens de Frota)
- Lista de ordens enviadas no turno atual
- Possibilidade de cancelar ordens

### 5. BattleReportScreen (Relatório de Batalha)
- Resultado de cada combate do turno
- Planetas conquistados/defendidos

### 6. ScoreScreen (Placar Final)
- Ranking dos jogadores
- Estatísticas: planetas, naves destruídas, frotas destruídas
- Botão "Jogar Novamente"

### 7. HelpScreen (Como Jogar)
- Regras do jogo
- Tutorial passo a passo

## Fluxo Principal
1. Home → Novo Jogo → Configuração → Jogo
2. Durante o jogo: selecionar planeta origem → planeta destino → enviar naves → Fim de Turno
3. Após fim de turno: Relatório de Batalha → próximo jogador
4. Condição de vitória: conquistar todos os planetas → Placar Final

## Paleta de Cores
- Background: #0a0a1a (espaço profundo)
- Surface: #0d1b2a (azul escuro)
- Primary: #4fc3f7 (azul ciano — UI principal)
- Accent: #ffd54f (amarelo dourado — destaques)
- Success: #66bb6a (verde — conquista)
- Error: #ef5350 (vermelho — derrota/ataque)
- Foreground: #e0e0e0 (texto claro)
- Muted: #78909c (texto secundário)

## Cores dos Jogadores
- Jogador 1: #ef5350 (vermelho)
- Jogador 2: #42a5f5 (azul)
- Jogador 3: #66bb6a (verde)
- Jogador 4: #ffa726 (laranja)
- Neutro: #78909c (cinza)
