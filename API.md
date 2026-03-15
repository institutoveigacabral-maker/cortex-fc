# Cortex FC -- API Reference

## Autenticacao

A API publica (`/api/v1/*`) usa autenticacao via API Key no header:

```
Authorization: Bearer <api-key>
```

Gere suas API Keys em **Configuracoes > API Keys** no painel.

As rotas internas (`/api/*`) usam autenticacao via sessao (NextAuth.js + Google OAuth).

---

## API Publica (v1)

### Players

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/players` | Listar jogadores |

### Analises

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/analyses` | Listar analises |

### Oracle (IA)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/v1/oracle` | Consultar o oraculo IA |

### Reports

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/reports` | Listar relatorios |

### Webhooks

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/webhooks` | Listar webhooks |
| POST | `/api/v1/webhooks` | Criar webhook |
| DELETE | `/api/v1/webhooks` | Remover webhook |

### API Keys

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/keys` | Listar API keys |
| POST | `/api/v1/keys` | Criar API key |
| DELETE | `/api/v1/keys` | Revogar API key |

---

## API Interna

### Agentes IA

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/analista` | Agente analista de desempenho |
| POST | `/api/scout` | Agente scout de jogadores |
| POST | `/api/oracle` | Agente oraculo estrategico |
| POST | `/api/coaching` | Agente de coaching |
| POST | `/api/cfo` | Agente CFO (financeiro) |
| POST | `/api/board` | Agente do conselho |
| POST | `/api/synergy` | Analise de sinergia |

### Jogadores

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/players` | Listar jogadores |
| GET | `/api/players/:id` | Detalhes do jogador |

### Scouting

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/scouting` | Listar alvos |
| POST | `/api/scouting` | Criar alvo |
| PATCH | `/api/scouting/:id` | Atualizar alvo |
| DELETE | `/api/scouting/:id` | Remover alvo |
| GET | `/api/scouting/alerts` | Alertas de scouting |
| POST | `/api/scouting/share` | Compartilhar alvo |

### Analises

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/analyses` | Listar analises |
| POST | `/api/analyses` | Criar analise |
| GET | `/api/analyses/:id` | Detalhes da analise |

### Organizacao

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/orgs` | Listar organizacoes |
| POST | `/api/orgs/switch` | Trocar org ativa |
| GET | `/api/org/branding` | Branding da org |
| PATCH | `/api/org/branding` | Atualizar branding |

### Health

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/health` | Status do sistema |

---

## Rate Limiting

A API publica tem rate limiting via Upstash Redis. Limites por plano:

- **Scout**: 100 req/hora
- **Club**: 500 req/hora
- **Holding**: 2000 req/hora
