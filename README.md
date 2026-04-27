# 🖨️ Gráfica Manager

Sistema desktop completo para gerenciamento de gráficas, controle de impressões, integração com e-commerces e automação de fluxos de produção.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Estrutura do Monorepo](#-estrutura-do-monorepo)
- [Funcionalidades](#-funcionalidades)
- [Metodologia de Desenvolvimento](#-metodologia-de-desenvolvimento)
- [Requisitos do Sistema](#-requisitos-do-sistema)
- [Setup do Ambiente](#-setup-do-ambiente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Roadmap](#-roadmap)

---

## 🎯 Visão Geral

O **Gráfica Manager** é uma aplicação desktop construída com Electron que serve como hub central para operações de uma gráfica. O sistema permite:

- **Gerenciar impressoras** e contabilizar cada página impressa com metadados detalhados
- **Assistir na impressão** com preview, configuração de materiais e envio direto para impressoras
- **Receber pedidos** automaticamente via webhooks de e-commerces (Shopee, Mercado Livre) ou manualmente
- **Configurar materiais de impressão** como perfis de cor (CMYK), tipo de papel, qualidade e demais parâmetros
- **Rastrear pedidos** vinculando impressões a clientes, pedidos e lojas/fontes

---

## 🛠️ Stack Tecnológica

| Camada       | Tecnologia                              |
| ------------ | --------------------------------------- |
| **Frontend** | React + Electron (desktop)              |
| **Backend**  | Node.js + TypeScript + Express          |
| **Banco**    | MySQL + Prisma ORM                      |
| **Monorepo** | pnpm workspaces                         |
| **Testes**   | Vitest (unit/integration) + Playwright (e2e) |
| **Lint**     | ESLint + Prettier                       |

### Decisões Técnicas

- **React sem bibliotecas pesadas**: componentes customizados, Context API para estado global, CSS Modules para estilização. Sem bibliotecas de UI de terceiros.
- **Electron otimizado**: renderização leve, lazy loading agressivo, sem animações desnecessárias — alvo: PCs com 4GB RAM e dual-core.
- **Prisma como ORM**: type-safety completa, migrations versionadas, excelente DX com TypeScript.
- **pnpm workspaces**: gerenciamento eficiente de dependências com hoisting inteligente e disco compartilhado.

---

## 🏗️ Arquitetura

### Visão Macro

```
┌─────────────────────────────────────────────────────┐
│                    Electron Shell                    │
│  ┌───────────────────────────────────────────────┐  │
│  │              React Frontend (Renderer)        │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │  Pages  │ │  Hooks   │ │  Components   │  │  │
│  │  └────┬────┘ └────┬─────┘ └───────┬───────┘  │  │
│  │       └───────────┼───────────────┘           │  │
│  │              ┌────▼─────┐                     │  │
│  │              │ Services │ (API Client Layer)  │  │
│  │              └────┬─────┘                     │  │
│  └───────────────────┼───────────────────────────┘  │
│                      │ HTTP (localhost)               │
│  ┌───────────────────▼───────────────────────────┐  │
│  │           Electron Main Process               │  │
│  │  ┌─────────────┐  ┌────────────────────────┐  │  │
│  │  │ IPC Bridge  │  │ Native Printer Access  │  │  │
│  │  └─────────────┘  └────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ IPC / HTTP
┌──────────────────────▼──────────────────────────────┐
│                Express API (Backend)                 │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │                 Interface Layer                  │ │
│  │  Controllers ─── Routes ─── Middlewares         │ │
│  └────────────────────┬────────────────────────────┘ │
│  ┌────────────────────▼────────────────────────────┐ │
│  │              Application Layer                  │ │
│  │  Use Cases ─── DTOs ─── Validators              │ │
│  └────────────────────┬────────────────────────────┘ │
│  ┌────────────────────▼────────────────────────────┐ │
│  │                Domain Layer                     │ │
│  │  Entities ─── Value Objects ─── Domain Events   │ │
│  │  Repository Interfaces ─── Domain Services      │ │
│  └────────────────────┬────────────────────────────┘ │
│  ┌────────────────────▼────────────────────────────┐ │
│  │             Infrastructure Layer                │ │
│  │  Prisma Repos ─── Webhook Adapters ─── Printer  │ │
│  │  E-commerce Adapters ─── File Storage           │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │
              ┌────────▼────────┐
              │     MySQL       │
              └─────────────────┘
```

### Padrão Arquitetural: Clean Architecture + DDD

O backend segue **Clean Architecture** com influências de **Domain-Driven Design**, garantindo:

- **Independência de frameworks**: o domínio não conhece Express, Prisma ou qualquer lib externa
- **Testabilidade**: cada camada é testável isoladamente via injeção de dependência
- **Flexibilidade**: trocar banco, framework HTTP ou adaptador de e-commerce sem impactar regras de negócio

### Design Patterns Utilizados

| Pattern              | Onde                        | Por quê                                                       |
| -------------------- | --------------------------- | ------------------------------------------------------------- |
| **Repository**       | Acesso a dados              | Abstrai o Prisma, permite mocks em testes                     |
| **Use Case**         | Lógica de aplicação         | Um caso de uso por operação, SRP aplicado                     |
| **Strategy**         | Integrações e-commerce      | Shopee, ML, etc. como estratégias intercambiáveis             |
| **Adapter**          | Impressoras / Webhooks      | Isola implementações externas atrás de interfaces             |
| **Factory**          | Criação de PrintJobs        | Centraliza a lógica complexa de criação de jobs de impressão  |
| **Observer/Event**   | Eventos de domínio          | Desacopla side-effects (log, notificação, contabilização)     |
| **Middleware Chain** | HTTP pipeline               | Auth, validação, error handling compostos                     |

### Frontend — Arquitetura Leve

```
src/
├── pages/          # Telas da aplicação (lazy loaded)
├── components/     # Componentes reutilizáveis (customizados, sem lib UI)
│   ├── ui/         # Primitivos: Button, Input, Modal, Table, Select...
│   └── domain/     # Componentes de domínio: PrintPreview, OrderCard...
├── hooks/          # Custom hooks para lógica reutilizável
├── contexts/       # Context API para estado global
├── services/       # Camada de comunicação com API (fetch wrapper)
├── types/          # Tipos TypeScript compartilhados
└── utils/          # Funções utilitárias puras
```

**Princípios do frontend:**
- Zero bibliotecas de componentes — todos os componentes UI são construídos internamente
- Context API ao invés de Redux/Zustand — menos overhead para a máquina alvo
- CSS Modules — sem runtime CSS-in-JS
- Lazy loading em todas as páginas — carrega apenas o necessário
- Virtualização de listas longas (implementação própria)

---

## 📁 Estrutura do Monorepo

```
grafica-manager/
├── packages/
│   ├── backend/                    # API Express + TypeScript
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Schema do banco
│   │   │   └── migrations/         # Migrations versionadas
│   │   ├── src/
│   │   │   ├── domain/             # Entidades, Value Objects, interfaces
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   ├── events/
│   │   │   │   ├── repositories/   # Interfaces dos repositories
│   │   │   │   └── services/       # Domain services
│   │   │   ├── application/        # Use Cases, DTOs, Validators
│   │   │   │   ├── use-cases/
│   │   │   │   ├── dtos/
│   │   │   │   └── validators/
│   │   │   ├── infrastructure/     # Implementações concretas
│   │   │   │   ├── database/       # Prisma repositories
│   │   │   │   ├── http/           # Express routes, controllers, middlewares
│   │   │   │   ├── adapters/       # E-commerce, Printer adapters
│   │   │   │   └── config/         # Configuração da aplicação
│   │   │   └── shared/             # Utilitários, tipos compartilhados
│   │   └── tests/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── fixtures/
│   │
│   ├── frontend/                   # React + Electron
│   │   ├── electron/               # Main process do Electron
│   │   │   ├── main.ts
│   │   │   ├── preload.ts
│   │   │   └── ipc/                # Handlers IPC (impressora, sistema)
│   │   ├── src/                    # Renderer process (React)
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── contexts/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── public/
│   │   └── tests/
│   │       ├── unit/
│   │       └── e2e/
│   │
│   └── shared/                     # Tipos e utilitários compartilhados
│       └── src/
│           ├── types/              # Interfaces de domínio compartilhadas
│           ├── constants/          # Enums, constantes de negócio
│           └── validators/         # Validações compartilhadas
│
├── sdd-docs/                       # Spec Driven Development docs
│   ├── specs/                      # Especificações de features
│   ├── api/                        # OpenAPI / Swagger specs
│   └── decisions/                  # ADRs (Architecture Decision Records)
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json              # Config TS base do monorepo
├── .gitignore
├── .env.example
└── README.md
```

---

## ✨ Funcionalidades

### 🖨️ Módulo de Impressão

- Visualização de documentos antes da impressão (PDF preview)
- Configuração de parâmetros de impressão:
  - Perfil de cor (CMYK / RGB)
  - Tipo e gramatura de papel
  - Qualidade (draft, normal, alta)
  - Escala, margens, orientação
  - Frente e verso
- Envio direto para impressoras instaladas no sistema
- Contabilização automática de cada página impressa

### 📊 Módulo de Contabilização

- Registro detalhado de cada impressão com metadados:
  - Impressora utilizada
  - Qualidade de impressão
  - Tipo de papel e gramatura
  - Perfil de cor
  - Quantidade de páginas (P&B / Coloridas)
  - Custo estimado por página
- Vinculação a pedido, cliente e loja/fonte
- Dashboard com métricas e relatórios

### 🛒 Módulo de Pedidos

- Recebimento automático via webhooks:
  - **Shopee** (implementação inicial)
  - **Mercado Livre** (futuro)
- Cadastro manual de pedidos
- Ciclo de vida do pedido: `recebido → em produção → impresso → enviado`
- Vinculação de arquivos do cliente ao pedido

### 👥 Módulo de Clientes

- Cadastro de clientes com histórico de pedidos
- Identificação automática via integração com e-commerce
- Histórico completo de impressões por cliente

### ⚙️ Módulo de Configuração

- Gerenciamento de impressoras (adicionar, configurar, ativar/desativar)
- Presets de configuração de impressão por tipo de material
- Configuração de integração com e-commerces (tokens, webhooks)
- Configurações gerais do sistema

### 📦 Módulo de Arquivo (Futuro)

- Servidor de arquivos para backup temporário de arquivos de pedidos concluídos
- Armazenamento compactado
- Auto-deleção após período configurável (padrão: 6 meses)
- Interface de busca e recuperação de arquivos

---

## 🧪 Metodologia de Desenvolvimento

### Spec Driven Development (SDD) + TDD

O desenvolvimento segue um fluxo rigoroso orientado por especificações:

```
1. SPEC  → Escrever especificação detalhada da feature (sdd-docs/specs/)
2. API   → Definir contrato da API (OpenAPI spec) quando aplicável
3. TEST  → Escrever testes que validam a spec (Red)
4. CODE  → Implementar o mínimo para passar os testes (Green)
5. REFAC → Refatorar mantendo testes verdes (Refactor)
6. DOC   → Atualizar documentação e ADRs se necessário
```

### Estrutura de Specs

Cada feature é documentada em `sdd-docs/specs/` seguindo o template:

```markdown
# Feature: [Nome]
## Contexto
## Requisitos Funcionais
## Requisitos Não-Funcionais
## Critérios de Aceite (Given/When/Then)
## API Contract (se aplicável)
## Dependências
## Notas de Implementação
```

### Testes

| Tipo            | Ferramenta | Escopo                                     |
| --------------- | ---------- | ------------------------------------------ |
| **Unitário**    | Vitest     | Entidades, Use Cases, Services, Hooks      |
| **Integração**  | Vitest     | Repositories + DB, API routes              |
| **E2E**         | Playwright | Fluxos completos pela interface Electron   |

### AI-Assisted Development

O projeto é estruturado para desenvolvimento assistido por agentes de IA:
- Specs claras e padronizadas como contexto para o agente
- Testes como validação automática do trabalho do agente
- ADRs documentam decisões para manter consistência entre sessões
- Estrutura de pastas previsível para navegação eficiente

---

## 💻 Requisitos do Sistema

### Ambiente de Desenvolvimento

- **Node.js**: >= 20.x LTS
- **pnpm**: >= 9.x
- **MySQL**: >= 8.0
- **Git**: >= 2.x

### Máquina Alvo (Produção)

- **RAM**: 4GB (mínimo)
- **CPU**: Dual-core
- **OS**: Windows 10+
- **Disco**: 500MB para a aplicação + espaço para banco de dados

---

## 🚀 Setup do Ambiente

```bash
# 1. Clone o repositório
git clone git@github.com:rafarvns/grafica-manager.git
cd grafica-manager

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações de banco, etc.

# 4. Suba o banco de dados e rode as migrations
pnpm --filter backend prisma:migrate

# 5. Inicie o backend
pnpm --filter backend dev

# 6. Inicie o frontend (Electron)
pnpm --filter frontend dev
```

---

## 📜 Scripts Disponíveis

| Script                         | Descrição                                  |
| ------------------------------ | ------------------------------------------ |
| `pnpm dev`                     | Inicia backend + frontend em paralelo      |
| `pnpm --filter backend dev`    | Inicia apenas o backend                    |
| `pnpm --filter frontend dev`   | Inicia apenas o frontend (Electron)        |
| `pnpm test`                    | Roda todos os testes                       |
| `pnpm test:unit`               | Roda apenas testes unitários               |
| `pnpm test:integration`        | Roda apenas testes de integração           |
| `pnpm test:e2e`                | Roda testes end-to-end                     |
| `pnpm lint`                    | Verifica linting em todos os packages      |
| `pnpm build`                   | Build de produção (backend + frontend)     |
| `pnpm --filter frontend package` | Empacota o Electron para distribuição    |

---

## 🗺️ Roadmap

### Fase 1 — Fundação
- [x] Setup do monorepo (pnpm workspaces, TypeScript, ESLint, Prettier)
- [x] Schema do banco de dados (Prisma)
- [x] Estrutura base do backend (Clean Architecture)
- [x] Estrutura base do frontend (Electron + React)
- [x] Componentes UI base (Button, Input, Modal, Table, Select)

### Fase 2 — Core de Impressão
- [x] Integração com impressoras do sistema (via Electron)
- [ ] Preview de documentos PDF
- [ ] Configuração de parâmetros de impressão (CMYK, papel, qualidade)
- [ ] Registro e contabilização de impressões

### Fase 3 — Pedidos e Clientes
- [ ] CRUD de clientes
- [ ] CRUD de pedidos (manual)
- [ ] Vinculação pedido ↔ impressão ↔ cliente
- [ ] Fluxo de vida do pedido

### Fase 4 — Integrações E-commerce
- [ ] Integração Shopee (webhook + API)
- [ ] Recebimento automático de pedidos
- [ ] Mapeamento de dados Shopee → pedido interno

### Fase 5 — Dashboard e Relatórios
- [ ] Dashboard com métricas de impressão
- [ ] Relatórios por período, cliente, loja
- [ ] Controle de custos

### Fase 6 — Arquivo de Backup (Futuro)
- [ ] Servidor de arquivos com compactação
- [ ] Auto-deleção configurável
- [ ] Interface de busca e recuperação

---

## 📄 Licença

Projeto privado — todos os direitos reservados.

---

## 👤 Autor

**Rafael Varnes** — [@rafarvns](https://github.com/rafarvns)
