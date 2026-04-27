# Feature: Integração com impressoras do sistema (via Electron)

> Status: `implemented` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Permitir que o sistema desktop Electron se comunique com as impressoras locais do Windows para listar equipamentos disponíveis, obter seus status e enviar trabalhos de impressão (arquivos PDF) com parâmetros configurados, facilitando o controle e a automação das impressões na gráfica.

## Requisitos Funcionais

- [x] RF1 — O sistema deve obter e listar as impressoras instaladas no OS, recuperando também o status detalhado de cada impressora (ex: online, offline, erro, sem papel, nível de tinta, se disponível pelo OS).
- [x] RF2 — O sistema deve permitir o envio silencioso de um arquivo PDF local para impressão em uma impressora selecionada.
- [x] RF3 — O sistema deve permitir configurar parâmetros básicos de impressão como quantidade de cópias, coloração e orientação antes do envio.
- [x] RF4 — Na tela de uso/seleção de impressora, o sistema deve apresentar ícones de alerta para estados relevantes da impressora selecionada (ex: offline, atolamento de papel), instruindo o usuário a verificar a interface detalhada caso haja problemas.
- [x] RF5 — O sistema deve fornecer uma "Interface da Impressora" avançada, onde os dados detalhados reportados pelo spooler/Windows possam ser visualizados para suporte ou análise.

## Requisitos Não-Funcionais

- [x] RNF1 — A comunicação com o spooler e as impressoras deve ser assíncrona, sem bloquear a thread principal da UI.
- [x] RNF2 — O mapeamento dos códigos de status de impressora do Windows deve ser human-readable e tratado de forma resiliente caso o driver da impressora retorne status genéricos.
- [x] RNF3 — A interface de dados avançados e os alertas de seleção devem usar o design system existente (UI base), mantendo a otimização de performance (alvo 4GB RAM).

## Critérios de Aceite

### Cenário 1: Selecionar Impressora com Erro
- **Given** que o usuário está na tela de seleção de impressora antes de enviar o trabalho
- **And** a impressora "Epson L3150" está com o status "Sem Papel"
- **When** a impressora é exibida na lista de seleção
- **Then** deve ser exibido um ícone de alerta vermelho ou laranja próximo ao nome da impressora
- **And** deve sugerir a ida à aba/tela de detalhes avançados da impressora.

### Cenário 2: Visualização de Dados Avançados
- **Given** que o usuário abre a interface avançada de uma impressora específica
- **When** o sistema recupera as informações
- **Then** todos os dados técnicos reportados pelo SO e drivers (status da fila, porta, etc) devem estar visíveis de forma organizada.
- **And** a ação de imprimir não deve ocorrer nesta tela, mas as opções de resolução de problema ou verificação de spool devem estar claras.

## API Contract

N/A (A comunicação é local via IPC entre o Renderer e o Main Process do Electron)

## Dependências

- Specs relacionadas: <links para outras specs se houver, ex: spec de PDF preview>
- Pacotes/serviços externos: Sugere-se o uso de bibliotecas como `pdf-to-printer` (para impressão silenciosa de PDFs no Windows) ou uso direto das APIs nativas do Electron (`webContents.getPrintersAsync()`, `webContents.print()`).
- ADRs relevantes: <listar>

## Notas de Implementação

- Camadas afetadas: `frontend/electron/main.ts` (Main Process), `frontend/electron/ipc/` (Handlers), `frontend/src/` (Renderer chamando APIs via bridge).
- Testes esperados: Testes de unidade e integração (mockando os pacotes de impressão ou o Electron) e testes E2E básicos.
- Riscos: Limitações do Spooler de impressão do Windows em reportar com precisão o sucesso/falha exato de uma impressão física. Instabilidade em drivers de impressoras específicas.
