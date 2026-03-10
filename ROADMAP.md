# CORTEX FC — Roadmap & Esteira de Producao

> Ultima atualizacao: Março 2026
> Status: MVP Demo (pre-revenue)

---

## Estado Atual do Produto

| Componente | Status | Detalhe |
|------------|--------|---------|
| 5 Agentes IA (ORACLE, SCOUT, ANALISTA, CFO, BOARD) | ✅ Real | Chamam Claude API, retornam JSON estruturado |
| Wizard de Analise (5 etapas) | ⚠️ Parcial | Input manual + formulas locais, NAO chama agente IA |
| Dashboard + 6 Paginas | ✅ Real | Dados reais do Neon PostgreSQL |
| API Routes (5 endpoints) | ✅ Real | GET/POST, validacao de input |
| 55 Jogadores PL reais | ✅ Real | Seed com dados publicos 2024/25 |
| Landing Page + Pricing | ✅ Real | Funil de conversao completo |
| Login/Register | ⚠️ Stub | Formularios existem, sem auth real |
| Autenticacao (NextAuth) | ❌ Stub | Instalado mas nao configurado |
| Pagamento (Stripe) | ❌ Inexistente | Nenhuma integracao |
| PDF Export | ⚠️ Parcial | window.print() funciona, sem geracao server-side |
| Email | ❌ Inexistente | Sem servico configurado |
| Tabelas nao usadas | ⚠️ Schema only | transfers, matches, playerMatchStats, agentRuns |
| Multi-tenancy | ❌ Inexistente | Hardcoded Nottingham Forest |

---

## Fase 1 — MVP Monetizavel (4-6 semanas)

> **Objetivo**: Cobrar o primeiro cliente. Transformar demo em produto funcional.

### Sprint 1.1 — Autenticacao & Multi-tenancy (1 semana)

| Task | Prioridade | Complexidade |
|------|-----------|-------------|
| Configurar NextAuth v5 (credentials + Google OAuth) | P0 | Media |
| middleware.ts — proteger todas as rotas /dashboard/* | P0 | Baixa |
| Fluxo real de registro (criar org + user no DB) | P0 | Media |
| Fluxo real de login (verificar senha com bcrypt) | P0 | Media |
| Sessao persistente (JWT ou session DB) | P0 | Baixa |
| Multi-tenancy: filtrar queries por orgId | P0 | Alta |
| Roles (admin/analyst/viewer) — gate por permissao | P1 | Media |

**Entregavel**: Usuario registra, loga, ve apenas dados da sua organizacao.

### Sprint 1.2 — ORACLE no Wizard de Analise (1 semana)

| Task | Prioridade | Complexidade |
|------|-----------|-------------|
| Botao "Gerar com IA" no wizard (chama ORACLE agent) | P0 | Media |
| ORACLE preenche automaticamente: layers C1-C7, Vx/Rx, algoritmos | P0 | Media |
| Reasoning gerado pelo Claude em vez de template hardcoded | P0 | Baixa |
| Loading state durante chamada IA (10-15s) | P0 | Baixa |
| Salvar agentRun no banco (audit log) | P1 | Baixa |
| Permitir usuario ajustar scores pos-IA antes de salvar | P1 | Baixa |
| Rate limit: max analises/mes por tier | P1 | Media |

**Entregavel**: Analista clica "Gerar com IA", Claude analisa o jogador, preenche tudo. Usuario revisa e salva.

### Sprint 1.3 — Pagamento com Stripe (1 semana)

| Task | Prioridade | Complexidade |
|------|-----------|-------------|
| Instalar Stripe SDK | P0 | Baixa |
| Criar produtos/precos no Stripe Dashboard (3 tiers) | P0 | Baixa |
| Checkout session (redirect para Stripe) | P0 | Media |
| Webhook /api/webhooks/stripe (payment.succeeded) | P0 | Alta |
| Atualizar tier da organizacao no DB apos pagamento | P0 | Media |
| Portal do cliente Stripe (gerenciar assinatura) | P1 | Baixa |
| Feature gating real: checar tier antes de permitir acao | P0 | Media |
| Pagina /billing com historico de faturas | P2 | Media |

**Entregavel**: Cliente escolhe plano, paga, acessa features do tier correto.

### Sprint 1.4 — Polish & Lancamento (1 semana)

| Task | Prioridade | Complexidade |
|------|-----------|-------------|
| Paginas legais: Termos de Uso, Politica de Privacidade | P0 | Baixa |
| Email transacional (Resend): boas-vindas, reset senha | P0 | Media |
| Error boundaries em todas as paginas | P1 | Baixa |
| Loading skeletons nas paginas de dados | P1 | Baixa |
| Dominio personalizado (cortexfc.com) | P1 | Baixa |
| SEO meta tags na landing e pricing | P1 | Baixa |
| Analytics (Vercel Analytics ou PostHog) | P2 | Baixa |
| Onboarding wizard para novos usuarios | P2 | Media |

**Entregavel**: Produto pronto para vender. Primeiro cliente pagante.

---

## Fase 2 — Product-Market Fit (6-8 semanas)

> **Objetivo**: Reter clientes. Tornar o produto indispensavel.

### Sprint 2.1 — Agentes Integrados

| Task | Detalhe |
|------|---------|
| SCOUT agent no Scouting | Buscar alvos por perfil (posicao, idade, orcamento) via IA |
| ANALISTA agent nos Reports | Gerar relatorio tatico pos-jogo automaticamente |
| CFO agent no Player Detail | Modelagem financeira ao clicar "Simular Contratacao" |
| BOARD ADVISOR no Dashboard | Briefing executivo semanal gerado por IA |
| Historico de agent runs | Pagina /agent-runs com logs, tokens, custo |

### Sprint 2.2 — Relatrios Premium

| Task | Detalhe |
|------|---------|
| Geracao PDF server-side (Puppeteer ou @react-pdf/renderer) | PDF profissional com branding |
| Templates de relatorio: Player Report, Squad Analysis, Scouting Report | 4 tipos |
| Agendamento: relatorio semanal automatico por email | Cron + Resend |
| Compartilhamento por link (relatorio publico com token) | URL assinada |

### Sprint 2.3 — Dados ao Vivo

| Task | Detalhe |
|------|---------|
| Integracao API-Football (RapidAPI) | Stats reais de jogos |
| Importar stats de jogadores (xG, xA, passes, tackles) | Popular playerMatchStats |
| Importar resultados de partidas | Popular matches |
| Importar transferencias | Popular transfers |
| Atualizar valores de mercado periodicamente | Cron semanal |
| Dashboard com dados ao vivo | Stats da temporada atual |

### Sprint 2.4 — Scouting Pipeline Completo

| Task | Detalhe |
|------|---------|
| CRUD de scouting targets (adicionar, editar status, notas) | API + UI |
| Pipeline kanban com drag-and-drop | Mover entre etapas |
| Comparacao side-by-side funcional | Ja existe, melhorar UX |
| Alertas de mercado: jogador mudou de valor, contrato expirando | Push/email |
| Shortlist compartilhavel com diretoria | Link + permissoes |

---

## Fase 3 — Escala (8-12 semanas)

> **Objetivo**: Atender multiplos clubes. Virar plataforma.

### 3.1 — Multi-Club & Enterprise

| Task | Detalhe |
|------|---------|
| Multi-tenancy completo | Org switcher, dados isolados |
| Holding dashboard | Visao agregada de multiplos clubes |
| Benchmarking entre clubes | Comparar squads, investimentos, SCN medio |
| SSO/SAML para enterprise | Login corporativo |
| Audit log completo | Quem fez o que, quando |
| White-label | Logo, cores, dominio do cliente |

### 3.2 — API Publica

| Task | Detalhe |
|------|---------|
| API REST documentada (OpenAPI/Swagger) | /api/v1/* |
| API keys com rate limiting | Tiers de uso |
| Webhooks para clientes | Notificar quando analise concluida |
| SDK JavaScript/Python | Para integracoes |

### 3.3 — Performance & Infra

| Task | Detalhe |
|------|---------|
| Cache (Redis/Upstash) para queries pesadas | Dashboard stats |
| Background jobs (Inngest ou Trigger.dev) | PDF, emails, syncs |
| CDN para assets estaticos | Logos, fotos de jogadores |
| Monitoring (Sentry) | Error tracking |
| Database read replicas | Performance em escala |

---

## Fase 4 — Diferenciacao (12+ semanas)

> **Objetivo**: Moat competitivo. Features que ninguem mais tem.

| Feature | Impacto |
|---------|---------|
| **Modelo de ML proprio** | Treinar com dados historicos para melhorar predicoes |
| **Video analysis** | Upload de clips, IA extrai eventos taticos |
| **Mobile app (React Native)** | Scouts em campo acessam no celular |
| **Integracao Wyscout/InStat** | Dados premium de scouting |
| **Simulador de janela** | "E se contratarmos X e vendermos Y?" |
| **Indice de sinergia de elenco** | Como novo jogador encaixa no time |
| **Mercado de analises** | Clubes vendem/compram relatorios entre si |
| **Chat IA contextual** | "Claude, compare Saka com Palmer para nossa ala direita" |

---

## Esteira de Producao (CI/CD)

### Fluxo de Trabalho

```
Feature Branch → PR → Code Review → Staging → Smoke Test → Production
```

### Setup Necessario

| Ferramenta | Uso | Status |
|-----------|------|--------|
| **GitHub** | Repositorio, PRs, Issues | ⚠️ Precisa criar repo |
| **Vercel** | Deploy automatico (push = deploy) | ✅ Configurado |
| **Vercel Preview** | Deploy por PR (URL de preview) | ✅ Automatico com GitHub |
| **GitHub Actions** | CI: lint, typecheck, build | ❌ Configurar |
| **Neon Branching** | DB branch por PR (dados isolados) | ❌ Configurar |
| **Sentry** | Error monitoring producao | ❌ Instalar |
| **PostHog / Vercel Analytics** | Product analytics | ❌ Instalar |
| **Upstash** | Rate limiting, cache, queues | ❌ Futuro |

### GitHub Actions Sugerido

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
```

### Ambientes

| Ambiente | URL | Branch | DB |
|----------|-----|--------|-----|
| **Production** | cortex-fc.vercel.app | main | Neon main |
| **Staging** | staging.cortex-fc.vercel.app | staging | Neon staging branch |
| **Preview** | pr-{n}.cortex-fc.vercel.app | feature/* | Neon preview branch |
| **Local** | localhost:3000 | — | Neon dev branch |

---

## Metricas de Sucesso por Fase

| Fase | KPI | Meta |
|------|-----|------|
| **Fase 1** | Primeiro cliente pagante | 1 clube em 30 dias |
| **Fase 1** | MRR | €299+ (1 Club Professional) |
| **Fase 2** | Retencao mensal | >90% |
| **Fase 2** | Analises geradas por cliente/mes | >20 |
| **Fase 2** | NPS | >40 |
| **Fase 3** | Clientes ativos | 10+ clubes |
| **Fase 3** | MRR | €5.000+ |
| **Fase 4** | ARR | €100.000+ |

---

## Stack Tecnico Recomendado (Adicoes)

| Necessidade | Ferramenta | Custo |
|-------------|-----------|-------|
| Pagamento | **Stripe** | 2.9% + €0.30/tx |
| Email | **Resend** | Free ate 3k/mes |
| Auth | **NextAuth v5** (ja instalado) | Free |
| Background Jobs | **Inngest** ou **Trigger.dev** | Free tier |
| Cache/Rate Limit | **Upstash Redis** | Free tier |
| Monitoring | **Sentry** | Free tier |
| Analytics | **PostHog** | Free ate 1M events |
| Football Data | **API-Football** (RapidAPI) | Free ate 100 req/dia |
| PDF Server-side | **@react-pdf/renderer** | Free |
| File Storage | **Vercel Blob** ou **S3** | ~$0.02/GB |

---

## Prioridade Imediata (Proxima Sessao)

1. **Criar repositorio GitHub** e conectar ao Vercel (auto-deploy)
2. **Sprint 1.1**: NextAuth + middleware + multi-tenancy
3. **Sprint 1.2**: ORACLE agent no wizard de analise

Estas 3 tarefas desbloqueiam todo o resto.
