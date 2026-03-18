# Cortex FC

![CI](https://github.com/institutoveigacabral-maker/cortex-fc/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Plataforma de analytics de futebol com agentes de IA. Combina inteligencia artificial (Anthropic Claude) com dados estatisticos para oferecer analises taticas, scouting de jogadores e modelagem financeira para clubes de futebol.

Seis agentes de IA especializados trabalham em conjunto para suportar decisoes de contratacao, blindagem e emprestimo, alimentados por indices proprietarios (Vx e Rx) e contexto RAG.

Producao: [https://cortex-fc.vercel.app](https://cortex-fc.vercel.app)

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Banco de dados | Neon (PostgreSQL serverless) + Drizzle ORM |
| IA | Anthropic Claude SDK |
| Autenticacao | NextAuth.js v5 (beta) + Google OAuth |
| Background jobs | Inngest |
| Pagamentos | Stripe |
| Rate limiting | Upstash Redis |
| Monitoramento | Sentry |
| Email | Resend |
| UI | Tailwind CSS 4, Radix UI, Recharts, Framer Motion |
| i18n | next-intl (PT-BR, EN) |
| PWA | Serwist (service worker, suporte offline) |
| Testes | Vitest, Testing Library, jsdom |
| Deploy | Vercel |

---

## Funcionalidades

### Agentes de IA

A plataforma conta com seis agentes especializados, construidos sobre um `base-agent` comum:

- **Oracle** -- Agente central de consulta. Responde perguntas sobre jogadores e tatica usando contexto RAG.
- **Analista** -- Analise estatistica detalhada de desempenho individual e coletivo.
- **Scout** -- Identificacao e avaliacao de jogadores para contratacao, com alertas de scouting.
- **Board Advisor** -- Consultoria estrategica para diretoria, com matriz de decisao (CONTRATAR, BLINDAR, MONITORAR, EMPRESTIMO, RECUSAR).
- **CFO Modeler** -- Modelagem financeira de contratacoes e impacto salarial.
- **Coaching Assist** -- Suporte tatico para comissao tecnica.

### Analytics

- Indices proprietarios: **Vx** (valor de mercado) e **Rx** (rendimento).
- Scatter plot Vx vs Rx para comparacao visual de elencos.
- Radar neural por jogador com camadas de desempenho.
- Heatmap posicional e clusters (GK, CB, FB, MF, WG, ST).
- Estatisticas por temporada com graficos interativos.
- Sinergia de elenco (squad synergy).
- Timeline de transferencias.

### Plataforma

- Multi-organizacao com troca de contexto (org switcher).
- RBAC (controle de acesso baseado em roles).
- SSO por organizacao.
- Sistema de convites por email.
- Planos de assinatura via Stripe (free, scout_individual, club_professional, holding_multiclub).
- Feature gates por tier.
- Exportacao de relatorios em PDF.
- Audit logs.
- Notificacoes push e in-app.
- PWA com suporte offline.
- Internacionalizacao (PT-BR e EN).
- Cron jobs para sincronizacao de partidas, estatisticas e relatorio semanal.
- API publica versionada (v1) com autenticacao por API key.

---

## Setup Local

### Pre-requisitos

- Node.js 20+
- pnpm

### Instalacao

```bash
git clone https://github.com/institutoveigacabral-maker/cortex-fc.git
cd cortex-fc
pnpm install
```

### Variaveis de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Variaveis principais:

| Variavel | Descricao |
|----------|-----------|
| `DATABASE_URL` | Connection string Neon PostgreSQL |
| `ANTHROPIC_API_KEY` | Chave de API da Anthropic (Claude) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciais OAuth Google |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook Stripe |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis (Upstash) |
| `RESEND_API_KEY` | Chave de API do Resend (email) |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN do Sentry (monitoramento) |
| `CRON_SECRET` | Secret para autenticacao dos cron jobs |
| `RAPIDAPI_KEY` | Chave para API-Football (dados de partidas) |

Consulte [`.env.example`](.env.example) para a lista completa.

### Banco de Dados

```bash
pnpm drizzle-kit push
pnpm db:seed              # opcional: dados de exemplo
```

### Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Comando | Descricao |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de producao |
| `pnpm start` | Iniciar servidor de producao |
| `pnpm lint` | Executar ESLint |
| `pnpm typecheck` | Verificacao de tipos TypeScript |
| `pnpm test` | Executar testes |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm test:coverage` | Testes com cobertura (v8) |
| `pnpm format` | Formatar codigo com Prettier |
| `pnpm format:check` | Verificar formatacao |
| `pnpm drizzle-kit push` | Aplicar schema no banco |
| `pnpm drizzle-kit studio` | Interface visual do Drizzle |

---

## Arquitetura

```
src/
├── app/
│   ├── (auth)/              # Paginas de login/registro
│   ├── (dashboard)/         # Dashboard principal
│   │   ├── agent-console/   # Console dos agentes de IA
│   │   ├── analysis/        # Analises de jogadores
│   │   ├── analytics/       # Graficos e metricas
│   │   ├── chat/            # Chat com agentes
│   │   ├── players/         # Gestao de jogadores
│   │   ├── scouting/        # Relatorios de scouting
│   │   ├── reports/         # Relatorios exportaveis
│   │   ├── simulator/       # Simulador de cenarios
│   │   ├── billing/         # Assinatura e pagamentos
│   │   ├── settings/        # Configuracoes
│   │   ├── holding/         # Visao multi-clube
│   │   └── audit-log/       # Logs de auditoria
│   ├── api/                 # API routes (internal + v1 publica)
│   ├── docs/                # Documentacao publica
│   ├── pricing/             # Pagina de precos
│   └── scouting/            # Compartilhamento publico de scouting
├── components/
│   ├── cortex/              # Componentes do dominio (PlayerCard, NeuralRadar, VxRxScatter, etc.)
│   └── ui/                  # Componentes base (Radix UI)
├── db/
│   ├── schema.ts            # Schema Drizzle (tabelas, enums, relations)
│   ├── queries.ts           # Queries reutilizaveis
│   ├── index.ts             # Conexao com Neon
│   └── seed.ts              # Dados de exemplo
├── hooks/                   # Hooks customizados (offline, auto-save, notifications)
├── i18n/                    # Configuracao de internacionalizacao
├── inngest/
│   └── functions.ts         # Background jobs (cache invalidation, notificacoes)
├── lib/
│   ├── agents/              # Agentes de IA (oracle, analista, scout, board, cfo, coaching)
│   ├── cortex/              # Logica de dominio (Vx, Rx, decision-matrix, neural-layers)
│   ├── cache.ts             # Cache com Upstash Redis
│   ├── rate-limit.ts        # Rate limiting
│   ├── rbac.ts              # Controle de acesso
│   ├── stripe.ts            # Integracao Stripe
│   ├── pdf-generator.ts     # Geracao de PDF
│   ├── rag-context.ts       # Contexto RAG para agentes
│   └── webhook-dispatch.ts  # Dispatch de webhooks
├── messages/                # Arquivos de traducao (pt-BR.json, en.json)
├── services/                # Integracao com APIs externas (API-Football)
└── types/                   # Tipos TypeScript compartilhados
```

### Fluxo de Decisao

1. Dados de jogadores sao sincronizados via cron jobs (API-Football).
2. Agentes de IA analisam os dados usando contexto RAG.
3. O sistema calcula indices Vx (valor) e Rx (rendimento).
4. A matriz de decisao gera recomendacoes: CONTRATAR, BLINDAR, MONITORAR, EMPRESTIMO ou RECUSAR.
5. Relatorios sao gerados e podem ser exportados em PDF ou compartilhados.

---

## Deploy

### Vercel

O projeto esta configurado para deploy na Vercel com cron jobs automaticos.

```bash
vercel --prod
```

### Banco de Dados (Neon)

1. Crie um projeto no [Neon](https://neon.tech).
2. Copie a connection string para `DATABASE_URL`.
3. Execute as migrations:

```bash
pnpm drizzle-kit push
```

### Servicos Necessarios

- **Neon** -- PostgreSQL serverless
- **Upstash** -- Redis para cache e rate limiting
- **Stripe** -- Pagamentos e assinaturas
- **Inngest** -- Background jobs
- **Resend** -- Envio de emails transacionais
- **Sentry** -- Monitoramento de erros
- **Anthropic** -- API de IA (Claude)

---

## Licenca

Este projeto esta licenciado sob a [MIT License](LICENSE).
