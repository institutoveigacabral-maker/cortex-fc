/**
 * Centralized error message map — all PT-BR.
 * Two systems:
 * 1. ERROR_MESSAGES: code-based lookup for structured API responses
 * 2. ERROR_MAP: pattern-based matching for raw error strings
 */

// --- Code-based error messages ---

export const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  unauthorized: "Sessao expirada. Faca login novamente.",
  forbidden: "Voce nao tem permissao para esta acao.",
  invalid_credentials: "Email ou senha incorretos.",

  // Validation
  invalid_input: "Entrada invalida. Verifique os dados e tente novamente.",
  required_field: "Campo obrigatorio nao preenchido.",
  invalid_email: "Email invalido.",
  invalid_uuid: "ID invalido.",
  threat_detected: "Entrada invalida detectada.",

  // Rate limiting
  rate_limited: "Muitas requisicoes. Aguarde alguns minutos.",
  rate_limited_user: "Limite de requisicoes por usuario atingido.",
  rate_limited_org: "Limite de requisicoes da organizacao atingido.",

  // Quota
  quota_exceeded: "Limite do plano atingido. Faca upgrade para continuar.",
  analysis_quota: "Limite de analises do mes atingido.",
  agent_quota: "Limite de execucoes de agente atingido.",
  report_quota: "Limite de relatorios do mes atingido.",

  // Feature gates
  feature_unavailable: "Recurso disponivel a partir do plano Professional.",
  tier_required: "Faca upgrade para acessar este recurso.",

  // Network/API
  network_error: "Erro de conexao. Verifique sua internet.",
  api_error: "Erro interno. Tente novamente em alguns minutos.",
  timeout: "Requisicao expirou. Tente novamente.",
  service_unavailable: "Servico temporariamente indisponivel.",

  // AI
  ai_error: "Erro ao processar com IA. Tente novamente.",
  ai_timeout: "Analise de IA expirou. Tente novamente.",
  ai_rate_limit: "Limite de chamadas de IA atingido. Aguarde.",

  // Data
  not_found: "Recurso nao encontrado.",
  already_exists: "Este registro ja existe.",
  conflict: "Conflito de dados. Atualize a pagina e tente novamente.",

  // Stripe
  stripe_not_configured: "Sistema de pagamento nao configurado.",
  payment_failed: "Falha no pagamento. Verifique seus dados.",

  // Generic
  unknown: "Algo deu errado. Tente novamente.",
}

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown
}

/** Helper to create standardized API error responses */
export function apiError(code: string, status: number = 400) {
  return { error: getErrorMessage(code), code, status }
}

// --- Pattern-based error matching (for raw error strings) ---

const ERROR_MAP: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /API_FOOTBALL_KEY not configured/i,
    message: "API de futebol nao configurada. Adicione a chave nas configuracoes.",
  },
  {
    pattern: /RAPIDAPI_KEY/i,
    message: "Chave da API de futebol invalida ou ausente.",
  },
  {
    pattern: /Free plans? (do not|don't) have access/i,
    message: "Temporada indisponivel no plano gratuito. Use temporadas de 2022 a 2024.",
  },
  {
    pattern: /rate.?limit|too many requests|429/i,
    message: "Limite de requisicoes atingido. Aguarde alguns minutos e tente novamente.",
  },
  {
    pattern: /fetch failed|network|ECONNREFUSED|ENOTFOUND/i,
    message: "Sem conexao com o servidor. Verifique sua internet e tente novamente.",
  },
  {
    pattern: /timeout|ETIMEDOUT/i,
    message: "A requisicao demorou demais. Tente novamente em instantes.",
  },
  {
    pattern: /unauthorized|401|not authenticated/i,
    message: "Sessao expirada. Faca login novamente.",
  },
  {
    pattern: /forbidden|403/i,
    message: "Voce nao tem permissao para esta acao.",
  },
  {
    pattern: /not found|404/i,
    message: "Recurso nao encontrado.",
  },
  {
    pattern: /500|internal server/i,
    message: "Erro interno do servidor. Tente novamente em instantes.",
  },
  {
    pattern: /player.*not found/i,
    message: "Jogador nao encontrado na base de dados.",
  },
  {
    pattern: /already exists|duplicate/i,
    message: "Este registro ja existe na base de dados.",
  },
  {
    pattern: /invalid.*json|unexpected token/i,
    message: "Erro ao processar dados. Tente novamente.",
  },
  {
    pattern: /quota|credit|billing/i,
    message: "Limite do plano atingido. Verifique sua assinatura.",
  },
]

export function friendlyError(raw?: string | null): string {
  if (!raw) return "Ocorreu um erro inesperado. Tente novamente."

  // Try code-based lookup first
  if (ERROR_MESSAGES[raw]) return ERROR_MESSAGES[raw]

  for (const { pattern, message } of ERROR_MAP) {
    if (pattern.test(raw)) return message
  }

  // If the message is already in Portuguese and short enough, use it directly
  if (raw.length < 120 && /[a-záéíóúãõç]/i.test(raw)) {
    return raw
  }

  return "Ocorreu um erro inesperado. Tente novamente."
}
