/**
 * Componente de bienvenida del panel de control
 *
 * @module features/dashboard/modules/overview/components
 */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingCart,
  BarChart3,
  Plus,
  Eye,
  BookOpen,
  Settings,
  QrCode,
  CreditCard,
  TrendingUp,
  Zap,
  CheckCircle2,
  WifiOff,
  ArrowRight,
  Store,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useCurrentStore } from "@/features/dashboard/hooks/useCurrentStore";
import { SellsStats } from "@/features/dashboard/modules/sells/schemas/sell.schema";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { formatNumber } from "@/shared/utils/format.utils";
import { toast } from "sonner";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface DashboardWelcomeProps {
  initialStats?: {
    totalProducts: number;
    activeProducts: number;
  };
  sellStats?: SellsStats;
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

// ─────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────

/** KPI stat card */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
            {value}
          </p>
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
        <div className={`flex-shrink-0 p-2.5 rounded-xl ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

/** Quick action button */
function ActionButton({
  title,
  description,
  icon: Icon,
  onClick,
  primary,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:shadow-md
        ${
          primary
            ? "bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-white border-gray-100 hover:border-indigo-200 text-gray-900"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 p-2 rounded-xl transition-transform group-hover:scale-110
            ${primary ? "bg-white/20" : "bg-indigo-50"}`}
        >
          <Icon
            className={`w-5 h-5 ${primary ? "text-white" : "text-indigo-600"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold leading-tight ${
              primary ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </p>
          <p
            className={`text-xs mt-0.5 leading-tight ${
              primary ? "text-indigo-200" : "text-gray-500"
            }`}
          >
            {description}
          </p>
        </div>
        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5
            ${
              primary
                ? "text-indigo-200"
                : "text-gray-300 group-hover:text-indigo-400"
            }`}
        />
      </div>
    </button>
  );
}

/** Navigation section card */
function SectionCard({
  title,
  description,
  stat,
  icon: Icon,
  iconBg,
  iconColor,
  onClick,
}: {
  title: string;
  description: string;
  stat: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`flex-shrink-0 p-2.5 ${iconBg} rounded-xl group-hover:scale-105 transition-transform`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          <p className="text-xs font-semibold text-indigo-600 mt-1.5">{stat}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────

const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({
  initialStats,
  sellStats,
}) => {
  const router = useRouter();
  const {
    storeSlug,
    storeName,
    storeProfile,
    isLoading: storeLoading,
  } = useCurrentStore();
  const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus();
  const [logoError, setLogoError] = useState(false);
  // Trigger staggered entry animations after mount
  const [visible, setVisible] = useState(false);

  const logoUrl = storeProfile?.theme?.logoUrl;
  const showLogo = !!logoUrl && !logoError;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isOnline && wasOffline) {
      toast.success("Conexión restaurada.");
      resetWasOffline();
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  const greeting = useMemo(() => getGreeting(), []);

  // Plan info from store profile
  const subscription = storeProfile?.subscription;
  const planActivo = subscription?.active ?? false;
  const planNames: Record<string, string> = {
    free: "Plan Gratuito",
    trial: "Período de prueba",
    basic: "Plan Básico",
    pro: "Plan Pro",
    enterprise: "Plan Enterprise",
  };
  const planLabel = subscription
    ? planNames[subscription.plan] ?? "Plan activo"
    : "Sin suscripción activa";

  const isOnTrial = subscription?.plan === 'trial' && subscription?.active;
  const trialEndMs = isOnTrial && subscription?.endDate
    ? new Date(subscription.endDate as string).getTime()
    : 0;
  const trialDaysLeft = trialEndMs
    ? Math.max(0, Math.ceil((trialEndMs - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const displayName = storeLoading ? null : storeName || "tu tienda";

  // ── KPIs ──
  const kpis = [
    {
      label: "Productos",
      value: initialStats?.totalProducts ?? 0,
      sub: `${initialStats?.activeProducts ?? 0} activos`,
      icon: Package,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Ventas totales",
      value: sellStats?.totalOrders ?? 0,
      sub: "pedidos registrados",
      icon: ShoppingCart,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Ingresos",
      value: `$${formatNumber(sellStats?.totalSales ?? 0)}`,
      sub: "acumulados",
      icon: TrendingUp,
      accent: "bg-orange-50 text-orange-600",
    },
    {
      label: "Promedio por venta",
      value: `$${formatNumber(sellStats?.averageOrderValue ?? 0)}`,
      sub: "por pedido",
      icon: BarChart3,
      accent: "bg-purple-50 text-purple-600",
    },
  ];

  // ── Quick actions ──
  const quickActions = [
    {
      title: "Crear producto",
      description: "Añadir al catálogo",
      icon: Plus,
      primary: true,
      action: () => router.push("/dashboard/products/new"),
    },
    {
      title: "Nueva venta",
      description: "Registrar un pedido",
      icon: ShoppingCart,
      action: () => router.push("/dashboard/sells/new"),
    },
    {
      title: "Ver tienda",
      description: "Catálogo público",
      icon: Eye,
      action: () => storeSlug && window.open(`/${storeSlug}`, "_blank"),
    },
    {
      title: "Ver productos",
      description: "Gestionar catálogo",
      icon: Package,
      action: () => router.push("/dashboard/products"),
    },
  ];

  // ── Sections ──
  const sections = [
    {
      title: "Productos",
      description: "Gestioná tu catálogo de productos",
      stat: `${initialStats?.totalProducts ?? 0} en total`,
      icon: Package,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      path: "/dashboard/products",
    },
    {
      title: "Ventas",
      description: "Historial y estadísticas",
      stat: `${sellStats?.totalOrders ?? 0} registradas`,
      icon: BarChart3,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      path: "/dashboard/sells",
    },
    {
      title: "Configuración",
      description: "Datos, pagos y entregas",
      stat: "Personalizar tienda",
      icon: Settings,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
      path: "/dashboard/profile",
    },
    {
      title: "Código QR",
      description: "Compartí tu tienda fácilmente",
      stat: "Generar QR",
      icon: QrCode,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      path: "/dashboard/qr",
    },
    {
      title: "Guías",
      description: "Tutoriales y documentación",
      stat: "Ver guías",
      icon: BookOpen,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      path: "/dashboard/guides",
    },
    {
      title: "Suscripción",
      description: "Administrá tu plan",
      stat: planLabel,
      icon: CreditCard,
      iconBg: planActivo ? "bg-emerald-50" : "bg-red-50",
      iconColor: planActivo ? "text-emerald-600" : "text-red-500",
      path: "/dashboard/subscription",
    },
  ];

  // Shared animation class
  const anim = "transition-all duration-500 ease-out";
  const show = visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-7 lg:py-10 space-y-6 sm:space-y-8">

        {/* ── Hero header ─────────────────────────────── */}
        <div className={`${anim} ${show} bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}
          style={{ transitionDelay: "0ms" }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 lg:p-8">

            {/* Store identity */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-lg shadow-indigo-100">
                {storeLoading ? (
                  /* Skeleton while store data loads — no flicker to icon */
                  <div className="w-full h-full bg-gray-200 animate-pulse" />
                ) : showLogo ? (
                  <img
                    src={logoUrl}
                    alt={storeName ?? "Logo de la tienda"}
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
                    <Store className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                  {greeting}
                </p>
                {displayName ? (
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {displayName}
                  </h1>
                ) : (
                  <div className="h-7 w-48 bg-gray-100 animate-pulse rounded-lg" />
                )}
                <p className="text-sm text-gray-400 mt-0.5">
                  Panel de control
                </p>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full
                  ${
                    planActivo
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  }`}
              >
                {planActivo ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {planLabel}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full
                  ${
                    isOnline
                      ? "bg-gray-50 text-gray-500 ring-1 ring-gray-200"
                      : "bg-red-50 text-red-600 ring-1 ring-red-200"
                  }`}
              >
                {isOnline ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5" />
                )}
                {isOnline ? "En línea" : "Sin conexión"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Trial banner ────────────────────────────── */}
        {isOnTrial && (
          <div className={`${anim} ${show} flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4`}
            style={{ transitionDelay: "60ms" }}>
            <div className="flex-shrink-0 p-2 bg-amber-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Período de prueba — {trialDaysLeft === 0 ? "vence hoy" : `${trialDaysLeft} ${trialDaysLeft === 1 ? "día restante" : "días restantes"}`}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Estás usando todas las funciones gratis. Activá tu plan para seguir después del trial.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/subscription")}
              className="flex-shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Ver planes
            </button>
          </div>
        )}

        {/* ── KPI cards ──────────────────────────────── */}
        <section className={`${anim} ${show}`} style={{ transitionDelay: "80ms" }}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">
            Resumen general
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpis.map((kpi) => (
              <StatCard key={kpi.label} {...kpi} />
            ))}
          </div>
        </section>

        {/* ── Quick actions ───────────────────────────── */}
        <section className={`${anim} ${show}`} style={{ transitionDelay: "160ms" }}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <ActionButton
                key={a.title}
                title={a.title}
                description={a.description}
                icon={a.icon}
                onClick={a.action}
                primary={a.primary}
              />
            ))}
          </div>
        </section>

        {/* ── Manage store ────────────────────────────── */}
        <section className={`${anim} ${show}`} style={{ transitionDelay: "240ms" }}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">
            Administrar tienda
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sections.map((s) => (
              <SectionCard
                key={s.title}
                title={s.title}
                description={s.description}
                stat={s.stat}
                icon={s.icon}
                iconBg={s.iconBg}
                iconColor={s.iconColor}
                onClick={() => router.push(s.path)}
              />
            ))}
          </div>
        </section>

        {/* ── Help banner ─────────────────────────────── */}
        <section className={`${anim} ${show} bg-indigo-600 rounded-2xl p-5 sm:p-7 lg:p-8`}
          style={{ transitionDelay: "320ms" }}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0 p-3 bg-white/15 rounded-xl">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-1.5">
                ¿Necesitás ayuda para empezar?
              </h3>
              <p className="text-sm text-indigo-200 mb-4 leading-relaxed max-w-xl">
                Consultá nuestras guías para configurar tu tienda, agregar
                productos y gestionar ventas de forma rápida y sencilla.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => router.push("/dashboard/guides")}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Ver guías
                </button>
                <button
                  onClick={() => router.push("/dashboard/products/new")}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition-colors border border-white/25"
                >
                  <Plus className="w-4 h-4" />
                  Crear primer producto
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default DashboardWelcome;
