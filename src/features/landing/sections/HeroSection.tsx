/**
 * Sección Hero de la landing page
 *
 * @module features/landing/sections
 */

"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import CtaButton from "../components/CtaButton";

const containerAnimation = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.1 },
  },
};

const itemAnimation = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const HeroSection = () => {
  return (
    <section
      id="inicio"
      className="pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="container mx-auto px-5 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-0">

          {/* ── Contenido ── */}
          <motion.div
            className="w-full md:w-1/2 md:pr-12 text-center md:text-left"
            initial="hidden"
            animate="visible"
            variants={containerAnimation}
          >
            {/* Badge */}
            <motion.div variants={itemAnimation}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm mb-6 tracking-wide">
                🚀 7 días de prueba gratis
              </span>
            </motion.div>

            {/* Título */}
            <motion.h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-5 leading-[1.1] tracking-tight"
              variants={itemAnimation}
            >
              Digitalizá tu negocio con{" "}
              <span className="text-purple-600">TuTiendaWeb</span>
            </motion.h1>

            {/* Descripción */}
            <motion.p
              className="text-lg sm:text-xl text-gray-500 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed"
              variants={itemAnimation}
            >
              Creá tu catálogo digital, compartilo por WhatsApp y recibí
              pedidos desde cualquier dispositivo. Para tiendas, restaurantes y
              cualquier comercio que hace entregas.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
              variants={itemAnimation}
            >
              <CtaButton
                href="/sign-up"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Probá gratis 7 días
              </CtaButton>

              <CtaButton
                href={process.env.NEXT_PUBLIC_DEMO_STORE_URL ?? "/carta/demo"}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Ver demo →
              </CtaButton>
            </motion.div>

            {/* Trust line */}
            <motion.p
              className="mt-5 text-sm text-gray-400"
              variants={itemAnimation}
            >
              Sin contrato · Sin tarjeta de crédito · Cancelás cuando quieras
            </motion.p>
          </motion.div>

          {/* ── Imagen ── */}
          <motion.div
            className="w-full md:w-1/2 relative flex justify-center"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full max-w-[340px] sm:max-w-[400px]">
              {/* Decorativos */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-100 rounded-full opacity-50 z-0 hidden md:block" />
              <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-blue-100 rounded-full opacity-40 z-0 hidden md:block" />

              {/* Imagen principal */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/landing/Cell-Home.webp"
                  alt="Panel de TuTiendaWeb — gestioná tu negocio desde cualquier dispositivo"
                  width={400}
                  height={600}
                  className="w-full h-auto rounded-2xl"
                  priority
                />
              </div>

              {/* Tarjeta flotante — Nuevo pedido */}
              <motion.div
                className="absolute -left-4 sm:-left-12 top-1/4 bg-white p-3 sm:p-4 rounded-xl shadow-xl z-20 hidden sm:flex items-center gap-3"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Nuevo pedido</p>
                  <p className="text-xs text-gray-500">Hace un momento</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
