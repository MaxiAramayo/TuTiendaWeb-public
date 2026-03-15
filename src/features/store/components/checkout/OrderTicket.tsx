/**
 * Componente de ticket de pedido post-compra — rediseño
 *
 * @module features/store/components/checkout
 */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Check,
  MessageCircle,
  Copy,
  ArrowLeft,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  User,
  Store,
  MessageSquare,
} from "lucide-react";
import { useThemeStyles } from "../../hooks/useStoreTheme";
import { useStoreToast } from "../ui/FeedbackToast";
import { formatPrice } from "@/features/products/utils/product.utils";
import type { ProductInCart } from "@/shared/types/store";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface OrderTicketProps {
  orderData: {
    orderId: string;
    orderNumber?: string | number;
    customerName: string;
    products: ProductInCart[];
    subtotal: number;
    deliveryPrice: number;
    total: number;
    deliveryMethod: string | { name: string };
    paymentMethod: string | { name: string; instructions?: string };
    address?: string;
    notes?: string;
    whatsappMessage: string;
    whatsappNumber: string;
    storeName: string;
    date?: Date;
  };
  onBackToStore: () => void;
}

// ─────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────

/** Subtle perforated divider between ticket sections */
const TicketDivider = () => (
  <div className="relative flex items-center my-1 -mx-1">
    <div
      className="flex-1 h-px"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 5px, transparent 5px, transparent 10px)",
      }}
    />
  </div>
);

/** Labelled row with a small tinted icon */
const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-2.5">
    {/* Icon chip */}
    <div className="relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{ backgroundColor: "var(--store-primary)" }}
      />
      <Icon
        className="relative w-4 h-4"
        style={{ color: "var(--store-primary)" }}
      />
    </div>
    {/* Text */}
    <div className="flex-1 min-w-0">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5"
        style={{ color: "var(--store-primary)" }}
      >
        {label}
      </p>
      <div className="text-sm font-medium leading-snug" style={{ color: "#1e293b" }}>
        {value}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────
// Framer Motion variants
// ─────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.45 + i * 0.065,
      type: "spring",
      stiffness: 260,
      damping: 24,
    },
  }),
};

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────

export const OrderTicket: React.FC<OrderTicketProps> = ({
  orderData,
  onBackToStore,
}) => {
  const router = useRouter();
  const { showOrder, showError } = useStoreToast();
  const [isResending, setIsResending] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Defensive destructuring
  const {
    orderId = `order-${Date.now()}`,
    orderNumber,
    customerName = "Cliente",
    deliveryMethod = "pickup",
    paymentMethod = "cash",
    address = "",
    notes = "",
    products = [],
    subtotal = 0,
    deliveryPrice = 0,
    total = 0,
    whatsappMessage = "",
    whatsappNumber = "",
    storeName = "Mi Tienda",
    date = new Date(),
  } = orderData || {};

  const displayOrderId = orderNumber
    ? `#${orderNumber}`
    : `#${orderId.slice(-6).toUpperCase()}`;

  const items = Array.isArray(products) ? products : [];

  const normalizedDelivery =
    typeof deliveryMethod === "string" ? { name: deliveryMethod } : deliveryMethod;
  const normalizedPayment =
    typeof paymentMethod === "string"
      ? { name: paymentMethod }
      : paymentMethod;

  // ── Handlers ──────────────────────────────────

  const handleResendWhatsApp = async () => {
    setIsResending(true);
    try {
      if (whatsappNumber && whatsappMessage) {
        const clean = whatsappNumber.replace(/\s+/g, "");
        window.open(`https://wa.me/${clean}?text=${encodeURIComponent(whatsappMessage)}`);
      }
      showOrder("Mensaje reenviado a WhatsApp", { duration: 3000 });
    } catch {
      showError("Error al reenviar mensaje", { duration: 3000 });
    } finally {
      setIsResending(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setHasCopied(true);
      showOrder("Mensaje copiado al portapapeles", { duration: 2000 });
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      showError("Error al copiar mensaje", { duration: 2000 });
    }
  };

  const handleBackToStore = () => {
    if (onBackToStore) onBackToStore();
    else router.push("/");
  };

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);

  // Open WhatsApp automatically on mount
  useEffect(() => {
    if (whatsappNumber && whatsappMessage) {
      const clean = whatsappNumber.replace(/\s+/g, "");
      const timer = setTimeout(() => {
        window.open(
          `https://wa.me/${clean}?text=${encodeURIComponent(whatsappMessage)}`,
          "_blank"
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        backgroundColor: "var(--store-secondary, #f1f5f9)",
        fontFamily:
          "var(--store-font-family, system-ui), system-ui, sans-serif",
      }}
    >
      <div className="max-w-md mx-auto space-y-3">

        {/* ─── TICKET CARD ─────────────────────────── */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl shadow-black/[0.08] overflow-hidden"
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.65, bounce: 0.28 }}
        >

          {/* ── Header band ── */}
          <div
            className="relative px-6 pt-8 pb-12 text-center overflow-hidden"
            style={{ backgroundColor: "var(--store-primary)" }}
          >
            {/* Decorative blobs */}
            <div
              className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            />
            <div
              className="absolute -bottom-6 -left-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            />

            {/* Animated check */}
            <motion.div
              className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              initial={{ scale: 0, rotate: -120 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                delay: 0.22,
                stiffness: 240,
                damping: 14,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  delay: 0.46,
                  stiffness: 320,
                  damping: 12,
                }}
              >
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>

            <motion.h1
              className="relative z-10 text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
            >
              ¡Pedido confirmado!
            </motion.h1>

            <motion.p
              className="relative z-10 mt-1.5 font-mono text-[11px] tracking-[0.22em] uppercase"
              style={{ color: "rgba(255,255,255,0.65)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.66 }}
            >
              {displayOrderId}
            </motion.p>

            {/* Zigzag tear at the bottom */}
            <svg
              className="absolute bottom-0 left-0 w-full"
              height="16"
              viewBox="0 0 400 16"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d={[
                  "M0,16",
                  ...Array.from({ length: 40 }, (_, i) => {
                    const x1 = i * 10;
                    const x2 = x1 + 5;
                    const x3 = x1 + 10;
                    return `L${x1},16 L${x2},0 L${x3},16`;
                  }),
                  "Z",
                ].join(" ")}
                fill="var(--store-secondary, #f1f5f9)"
              />
            </svg>
          </div>

          {/* ── Body ── */}
          <div className="px-5 pt-1 pb-5">

            {/* Store + date */}
            <motion.div
              className="grid grid-cols-2 gap-0"
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <InfoRow icon={Store} label="Tienda" value={storeName} />
              <InfoRow
                icon={Clock}
                label="Fecha"
                value={
                  <span className="text-xs leading-tight block">
                    {formatDate(date)}
                  </span>
                }
              />
            </motion.div>

            <TicketDivider />

            {/* Customer */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
              <InfoRow icon={User} label="Cliente" value={customerName} />
            </motion.div>

            <TicketDivider />

            {/* Delivery */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
              <InfoRow
                icon={Truck}
                label="Entrega"
                value={
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{normalizedDelivery?.name}</span>
                    {deliveryPrice > 0 && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          color: "var(--store-primary)",
                          backgroundColor: "var(--store-primary-light, #dbeafe)",
                        }}
                      >
                        +{formatPrice(deliveryPrice)}
                      </span>
                    )}
                  </span>
                }
              />
              {address && (
                <div className="flex items-start gap-1.5 pl-11 -mt-1 pb-1">
                  <MapPin
                    className="w-3 h-3 flex-shrink-0 mt-0.5"
                    style={{ color: "var(--store-primary)" }}
                  />
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    {address}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Payment */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
              <InfoRow
                icon={CreditCard}
                label="Pago"
                value={normalizedPayment?.name}
              />
              {normalizedPayment?.instructions && (
                <div
                  className="ml-11 mb-2 -mt-1 p-2.5 rounded-xl text-xs leading-relaxed"
                  style={{ color: "#475569" }}
                >
                  <div className="relative overflow-hidden rounded-xl px-3 py-2.5">
                    <div
                      className="absolute inset-0 opacity-[0.07]"
                      style={{ backgroundColor: "var(--store-primary)" }}
                    />
                    <p className="relative">
                      <span
                        className="font-semibold"
                        style={{ color: "var(--store-primary)" }}
                      >
                        Instrucciones:{" "}
                      </span>
                      {normalizedPayment.instructions}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {notes && (
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
                <InfoRow
                  icon={MessageSquare}
                  label="Comentarios"
                  value={notes}
                />
              </motion.div>
            )}

            <TicketDivider />

            {/* Products list */}
            <motion.div
              className="py-2.5"
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3"
                style={{ color: "var(--store-primary)" }}
              >
                Productos
              </p>
              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-tight"
                        style={{ color: "#1e293b" }}
                      >
                        {item.name || "Producto"}
                      </p>
                      {item.topics && item.topics.length > 0 && (
                        <p
                          className="text-xs mt-0.5 leading-tight"
                          style={{ color: "#94a3b8" }}
                        >
                          {item.topics.map((t) => t.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#1e293b" }}
                      >
                        {formatPrice((item.price || 0) * (item.cantidad || 1))}
                      </p>
                      <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                        x{item.cantidad || 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <TicketDivider />

            {/* Totals */}
            <motion.div
              className="pt-2.5 space-y-1.5"
              custom={6}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "#64748b" }}>
                  Subtotal
                </span>
                <span className="text-sm font-medium" style={{ color: "#334155" }}>
                  {formatPrice(subtotal)}
                </span>
              </div>
              {deliveryPrice > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#64748b" }}>
                    Costo de envío
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#334155" }}
                  >
                    {formatPrice(deliveryPrice)}
                  </span>
                </div>
              )}

              {/* Total row */}
              <div
                className="flex justify-between items-center pt-3 mt-1"
                style={{
                  borderTop: "1.5px solid rgba(0,0,0,0.07)",
                }}
              >
                <span
                  className="text-base font-bold"
                  style={{ color: "#0f172a" }}
                >
                  Total
                </span>
                <span
                  className="text-xl font-bold"
                  style={{ color: "var(--store-primary)" }}
                >
                  {formatPrice(total)}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ─── ACTIONS CARD ────────────────────────── */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl shadow-black/[0.06] p-5 space-y-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72, type: "spring", bounce: 0.2 }}
        >
          {/* WhatsApp notice */}
          <div className="relative overflow-hidden rounded-2xl px-4 py-3 flex items-start gap-3">
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundColor: "var(--store-primary)" }}
            />
            <MessageCircle
              className="relative w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: "var(--store-primary)" }}
            />
            <p className="relative text-xs leading-relaxed" style={{ color: "#475569" }}>
              Tu pedido fue enviado por WhatsApp al comercio. Si no lo recibiste,
              podés reenviarlo desde acá.
            </p>
          </div>

          {/* Primary CTA — WhatsApp */}
          <Button
            onClick={handleResendWhatsApp}
            disabled={isResending}
            className="w-full h-12 text-[15px] font-semibold rounded-2xl gap-2.5 text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--store-primary)" }}
          >
            <MessageCircle className="w-5 h-5" />
            {isResending ? "Enviando..." : "Reenviar a WhatsApp"}
          </Button>

          {/* Secondary actions */}
          <div className="flex gap-2.5">
            <Button
              onClick={handleCopyMessage}
              variant="outline"
              className="flex-1 h-10 rounded-xl text-sm gap-2 border-gray-200 transition-colors"
              style={
                hasCopied
                  ? {
                      borderColor: "var(--store-primary)",
                      color: "var(--store-primary)",
                    }
                  : { color: "#475569" }
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {hasCopied ? (
                  <motion.span
                    key="copied"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                  >
                    <Check className="w-3.5 h-3.5" /> Copiado
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar mensaje
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            <Button
              onClick={handleBackToStore}
              variant="ghost"
              className="flex-1 h-10 rounded-xl text-sm gap-2"
              style={{ color: "#64748b" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </Button>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default OrderTicket;
