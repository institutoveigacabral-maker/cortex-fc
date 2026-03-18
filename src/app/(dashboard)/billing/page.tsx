"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getTierLimits, TIER_NAMES, isTierAtLeast } from "@/lib/feature-gates";

interface OrgInfo {
  tier: string;
  stripeSubscriptionId: string | null;
}

interface UsageData {
  analyses: number;
  agentRuns: number;
  tokensUsed: number;
}

const PLANS = [
  {
    tier: "scout_individual" as const,
    price: { monthly: 49, yearly: 39 },
    currency: "EUR",
  },
  {
    tier: "club_professional" as const,
    price: { monthly: 299, yearly: 239 },
    currency: "EUR",
    popular: true,
  },
  {
    tier: "holding_multiclub" as const,
    price: { monthly: 899, yearly: 719 },
    currency: "EUR",
  },
];

const FEATURE_ROWS = [
  { key: "analysesPerMonth", label: "analyses" },
  { key: "usersPerOrg", label: "users" },
  { key: "agents", label: "aiAgents" },
  { key: "algorithms", label: "algorithms" },
  { key: "scoutingTargets", label: "scoutingTargets" },
  { key: "reportsPerMonth", label: "reports" },
  { key: "apiAccess", label: "apiAccess" },
  { key: "whiteLabel", label: "whiteLabel" },
  { key: "sso", label: "sso" },
  { key: "exportFormats", label: "exportFormats" },
] as const;

function formatFeatureValue(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Sim" : "--";
  if (typeof value === "number") return value === -1 ? "Ilimitado" : String(value);
  if (Array.isArray(value)) return value.length === 0 ? "--" : value.join(", ");
  return String(value);
}

export default function BillingPage() {
  const t = useTranslations("billing");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);

  const currentTier = orgInfo?.tier ?? "free";

  const fetchOrgInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/org/info");
      if (res.ok) {
        const data = await res.json();
        setOrgInfo(data);
      }
    } catch {
      // silently fail — will show free tier
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchOrgInfo();
    fetchUsage();
  }, [fetchOrgInfo, fetchUsage]);

  const handleCheckout = async (tier: string) => {
    setLoading(tier);
    setMessage(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao criar checkout" });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexao" });
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: "error", text: data.error ?? "Erro ao abrir portal" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexao" });
    } finally {
      setLoading(null);
    }
  };

  const limits = getTierLimits(currentTier);

  // Check URL params for success/canceled
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const showSuccess = params?.get("success") === "true";
  const showCanceled = params?.get("canceled") === "true";

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <p className="text-zinc-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* Status messages */}
      {showSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-400">
          {t("subscriptionActivated")}
        </div>
      )}
      {showCanceled && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-400">
          {t("checkoutCanceled")}
        </div>
      )}
      {message && (
        <div
          className={`rounded-lg p-4 border ${
            message.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current plan + manage */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">{t("currentPlan")}</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xl font-semibold text-white">
                {TIER_NAMES[currentTier as keyof typeof TIER_NAMES] ?? "Free"}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                {currentTier === "free" ? "Free" : "Ativo"}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-zinc-500">
              <span>
                {limits.analysesPerMonth === -1
                  ? "Ilimitado"
                  : `${limits.analysesPerMonth} ${t("analyses").toLowerCase()}/mes`}
              </span>
              <span>
                {limits.usersPerOrg === -1
                  ? "Ilimitado"
                  : `${limits.usersPerOrg} usuario(s)`}
              </span>
              <span>{limits.agents.length} agente(s) IA</span>
            </div>
          </div>
          {currentTier !== "free" && (
            <button
              onClick={handlePortal}
              disabled={loading === "portal"}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {loading === "portal" ? "Abrindo..." : t("manageSub")}
            </button>
          )}
        </div>
      </div>

      {/* Usage this month */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t("usage")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-sm text-zinc-400">{t("analyses")}</p>
            <p className="text-2xl font-bold text-white mt-1">
              {usage?.analyses ?? "--"}
              {limits.analysesPerMonth !== -1 && (
                <span className="text-sm font-normal text-zinc-500">
                  {" "}/ {limits.analysesPerMonth}
                </span>
              )}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-sm text-zinc-400">{t("agentRuns")}</p>
            <p className="text-2xl font-bold text-white mt-1">
              {usage?.agentRuns ?? "--"}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-sm text-zinc-400">{t("tokensUsed")}</p>
            <p className="text-2xl font-bold text-white mt-1">
              {usage?.tokensUsed != null
                ? usage.tokensUsed.toLocaleString()
                : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setInterval("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "monthly"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => setInterval("yearly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "yearly"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Anual
          <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            -20%
          </span>
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentTier === plan.tier;
          const isUpgrade = !isTierAtLeast(currentTier, plan.tier);
          const price = plan.price[interval];
          const planLimits = getTierLimits(plan.tier);

          return (
            <div
              key={plan.tier}
              className={`relative bg-zinc-900 border rounded-xl p-6 flex flex-col ${
                plan.popular
                  ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                  : "border-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {TIER_NAMES[plan.tier]}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">
                    {"\u20AC"}{price}
                  </span>
                  <span className="text-zinc-400 text-sm">/mes</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.analysesPerMonth === -1
                    ? "Analises ilimitadas"
                    : `${planLimits.analysesPerMonth} analises/mes`}
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.agents.length} agentes IA
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.algorithms.length} algoritmos
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.usersPerOrg === -1
                    ? "Usuarios ilimitados"
                    : `Ate ${planLimits.usersPerOrg} usuario(s)`}
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.scoutingTargets === -1
                    ? "Scouting ilimitado"
                    : `${planLimits.scoutingTargets} alvos de scouting`}
                </li>
                {planLimits.apiAccess && (
                  <li className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckIcon />
                    Acesso API
                  </li>
                )}
                {planLimits.whiteLabel && (
                  <li className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckIcon />
                    White-label
                  </li>
                )}
                {planLimits.sso && (
                  <li className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckIcon />
                    SSO / SAML
                  </li>
                )}
                {planLimits.exportFormats.length > 0 && (
                  <li className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckIcon />
                    Export: {planLimits.exportFormats.join(", ").toUpperCase()}
                  </li>
                )}
              </ul>

              <button
                onClick={() => handleCheckout(plan.tier)}
                disabled={isCurrentPlan || loading === plan.tier}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                  isCurrentPlan
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : plan.popular
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {loading === plan.tier
                  ? "Redirecionando..."
                  : isCurrentPlan
                  ? t("currentPlan")
                  : isUpgrade
                  ? t("upgrade")
                  : "Mudar plano"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">{t("features")}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-zinc-400 pb-3 pr-4">Recurso</th>
              <th className="text-center text-zinc-400 pb-3 px-4">Free</th>
              {PLANS.map((plan) => (
                <th key={plan.tier} className="text-center text-zinc-400 pb-3 px-4">
                  {TIER_NAMES[plan.tier]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row) => {
              const freeLimits = getTierLimits("free");
              return (
                <tr key={row.key} className="border-b border-zinc-800/50">
                  <td className="py-3 pr-4 text-zinc-300">{t(`feature_${row.label}`)}</td>
                  <td className="py-3 px-4 text-center text-zinc-500">
                    {formatFeatureValue(row.key, freeLimits[row.key])}
                  </td>
                  {PLANS.map((plan) => {
                    const planLimits = getTierLimits(plan.tier);
                    return (
                      <td key={plan.tier} className="py-3 px-4 text-center text-zinc-300">
                        {formatFeatureValue(row.key, planLimits[row.key])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invoice history placeholder */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t("invoiceHistory")}</h3>
        <p className="text-sm text-zinc-500">{t("invoiceHistoryPlaceholder")}</p>
      </div>

      {/* FAQ / Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informacoes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
          <div>
            <p className="font-medium text-zinc-300">Trial gratuito</p>
            <p>Todos os novos planos incluem 14 dias de trial gratis. Cancele a qualquer momento.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-300">Pagamento seguro</p>
            <p>Processado via Stripe. Aceitamos Visa, Mastercard, American Express e SEPA.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-300">Downgrade</p>
            <p>Voce pode fazer downgrade a qualquer momento. O acesso premium continua ate o fim do ciclo pago.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-300">Enterprise / Volume</p>
            <p>Para grupos com 3+ clubes ou necessidades customizadas, entre em contato: enterprise@cortexfc.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
