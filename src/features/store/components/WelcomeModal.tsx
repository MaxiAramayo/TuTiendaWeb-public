"use client";

/**
 * Modal de bienvenida de la tienda pública.
 *
 * Se muestra una sola vez por navegador (por tienda) al abrir el catálogo.
 * Explica en 3 pasos cómo hacer un pedido. Se cierra con el botón, la X,
 * la tecla Escape o haciendo clic fuera del modal.
 *
 * @module features/store/components/WelcomeModal
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface WelcomeModalProps {
  storeName: string;
  /** Identificador de la tienda, usado para recordar que ya se mostró. */
  storeId: string;
}

const STEPS = [
  {
    emoji: "🔍",
    title: "Explorá el menú",
    desc: "Buscá por nombre o categoría lo que más te guste.",
  },
  {
    emoji: "🛒",
    title: "Armá tu pedido",
    desc: "Sumá productos al carrito con extras y aclaraciones.",
  },
  {
    emoji: "📲",
    title: "Confirmá por WhatsApp",
    desc: "Enviá tu pedido y coordiná la entrega al instante.",
  },
];

export function WelcomeModal({ storeName, storeId }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `ttw-welcome:${storeId}`;
    let seen = false;
    try {
      seen = localStorage.getItem(key) === "1";
    } catch {
      // localStorage no disponible (modo privado, etc.) — mostramos igual.
    }
    if (seen) return;

    // Pequeño delay para que aparezca con la tienda ya renderizada.
    const t = setTimeout(() => {
      setOpen(true);
      try {
        localStorage.setItem(key, "1");
      } catch {
        /* noop */
      }
    }, 550);

    return () => clearTimeout(t);
  }, [storeId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-0 p-0 gap-0">
        {/* Encabezado con acento del color de la tienda */}
        <div
          className="relative px-6 pt-7 pb-6 text-center"
          style={{
            background:
              "linear-gradient(145deg, var(--store-primary, #db2777) 0%, color-mix(in srgb, var(--store-primary, #db2777) 70%, #000) 100%)",
          }}
        >
          <span className="text-4xl" aria-hidden>
            👋
          </span>
          <DialogTitle className="mt-2 text-xl font-bold text-white">
            ¡Bienvenido a {storeName}!
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/85">
            Hacé tu pedido en 3 simples pasos
          </DialogDescription>
        </div>

        {/* Pasos */}
        <div className="flex flex-col gap-4 px-6 py-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              className="flex items-start gap-3.5"
              initial={{ opacity: 0, x: -12 }}
              animate={open ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 120, damping: 16 }}
            >
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-xl"
                style={{ backgroundColor: "color-mix(in srgb, var(--store-primary, #db2777) 12%, #fff)" }}
              >
                {step.emoji}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="text-xs leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Acción + marca */}
        <div className="px-6 pb-6">
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-full py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "var(--store-primary, #db2777)" }}
          >
            ¡Empezar a pedir! 🚀
          </button>

          <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-gray-400">
            <span>Creado con</span>
            <Image src="/favicon.ico" alt="TuTiendaWeb" width={14} height={14} className="opacity-70" />
            <span className="font-semibold text-gray-500">TuTiendaWeb</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeModal;
