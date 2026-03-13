"use client";

/**
 * Componente de cabecera de bienvenida para la tienda
 *
 * Muestra información principal de la tienda con estado dinámico de apertura.
 *
 * @module features/store/components
 */

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, MessageCircle, Instagram, Facebook, Store } from 'lucide-react';
import { PublicStoreData } from "@/features/store/types/store.types";
import { WeeklySchedule } from "@/features/store/types/store.types";
import { useStoreStatus, useTodaySchedule } from "@/features/store/hooks/useStoreStatus";
import { useStoreThemeContext as useTheme } from "@/features/store/components/ThemeProvider";
import { WeeklyScheduleDisplay } from "@/features/store/components/ui/StoreScheduleDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useThemeClasses, useThemeStyles } from "@/features/store/hooks/useStoreTheme";
import { ImageWithLoader } from "./ui/ImageWithLoader";

// Variantes de animación para entrada del header
const headerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 18 }
  }
};

const logoVariants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 130, damping: 16, delay: 0.15 }
  }
};

const buttonContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.35 }
  }
};

const buttonItemVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 120, damping: 14 }
  }
};

interface HeaderWelcomeProps {
  store: PublicStoreData;
}

export const HeaderWelcome: React.FC<HeaderWelcomeProps> = ({ store }) => {
  // Memoizar el horario semanal para evitar recreaciones innecesarias
  const weeklySchedule = useMemo<WeeklySchedule>(() => {
    if (store.schedule) return store.schedule;

    // Generar horario por defecto
    const defaultDay = {
      isOpen: true,
      openTime: "09:00",
      closeTime: "22:00",
      breaks: []
    };

    return {
      monday: defaultDay,
      tuesday: defaultDay,
      wednesday: defaultDay,
      thursday: defaultDay,
      friday: defaultDay,
      saturday: defaultDay,
      sunday: defaultDay
    };
  }, [store.schedule]);

  // Hook para estado de la tienda con horarios dinámicos
  const storeStatus = useStoreStatus(weeklySchedule);
  const todaySchedule = useTodaySchedule(weeklySchedule);

  // Hook para obtener el tema de la tienda
  const themeContext = useTheme();

  // Color primario del tema para los iconos
  const iconColor = themeContext.theme.colors.primary || '#3b82f6';

  /**
   * Maneja el clic en el botón de WhatsApp
   */
  const handleWhatsAppClick = () => {
    const whatsapp = store.contactInfo?.whatsapp;
    if (!whatsapp) return;

    const message = encodeURIComponent(
      `¡Hola! Me gustaría hacerles una consulta desde la tienda online de ${store.basicInfo?.name || ''}`
    );

    let phoneNumber = whatsapp.replace(/\D/g, '');

    if (!phoneNumber.startsWith('54')) {
      phoneNumber = '54' + phoneNumber;
    }

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleInstagramClick = () => {
    const instagram = store.socialLinks?.instagram;
    if (!instagram) return;
    window.open(instagram, '_blank');
  };

  const handleFacebookClick = () => {
    const facebook = store.socialLinks?.facebook;
    if (!facebook) return;
    window.open(facebook, '_blank');
  };

  return (
    <header className="relative xl:w-[85%] xl:mx-auto">
      <motion.div
        className="relative flex flex-col lg:justify-between rounded-b-3xl shadow-lg py-5 px-5 overflow-hidden gap-3 min-h-[350px]"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        {/* Banner de Fondo con Skeleton */}
        {store.theme?.bannerUrl ? (
          <>
            <ImageWithLoader
              src={store.theme.bannerUrl}
              alt="Banner de la tienda"
              fill
              className="object-cover"
              containerClassName="absolute inset-0 z-0"
              useSkeletonBg={true}
              loaderSize="md"
            />
            {/* Overlay oscuro para legibilidad */}
            <div className="absolute inset-0 bg-black/60 z-0"></div>
          </>
        ) : (
          <div
            className="absolute inset-0 z-0"
            style={{
              background: 'linear-gradient(145deg, #1e293b 0%, color-mix(in srgb, var(--store-primary) 18%, #0f172a) 100%)'
            }}
          />
        )}

        {/* Banner TuTiendaWeb */}
        <motion.div variants={itemVariants}>
          <Link className="flex justify-center items-center z-10" href="/">
            <p className="text-white text-sm drop-shadow-md">
              Creado con <span className="font-bold">TuTiendaWeb</span>
            </p>
            <Image
              src="/favicon.ico"
              alt="Logo TuTiendaWeb"
              width={20}
              height={20}
              className="ml-1 drop-shadow-md"
            />
          </Link>
        </motion.div>

        <div className="lg:flex lg:flex-row-reverse lg:justify-between z-10">
          {/* Logo/Imagen del negocio */}
          <motion.div
            className="items-center justify-center flex mt-5 mb-6 relative lg:w-[400px]"
            variants={logoVariants}
          >
            {/* Círculos decorativos */}
            <div className="bg-white w-[290px] h-[290px] absolute rounded-full opacity-[0.06]"></div>
            <div className="bg-white w-[360px] h-[360px] absolute rounded-full opacity-[0.05]"></div>
            <div className="bg-white w-[440px] h-[440px] absolute rounded-full opacity-[0.04]"></div>

            {/* Imagen de perfil con Skeleton */}
            <div className="w-[220px] h-[220px] rounded-full relative flex items-center justify-center overflow-hidden border-4 border-white/10 shadow-xl bg-white/5 backdrop-blur-sm">
              {store.theme?.logoUrl ? (
                <ImageWithLoader
                  src={store.theme.logoUrl}
                  alt={`Logo de ${store.basicInfo?.name || 'tienda'}`}
                  fill
                  className="object-cover"
                  containerClassName="w-full h-full"
                  useSkeletonBg={true}
                  loaderSize="md"
                />
              ) : (
                /* Fallback: icono de tienda con color primario */
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                >
                  <Store
                    size={88}
                    strokeWidth={1.75}
                    style={{ color: iconColor, filter: `drop-shadow(0 0 18px ${iconColor}66)` }}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Información del negocio */}
          <div className="flex flex-col gap-3 lg:py-5 lg:px-3 lg:mt-10 lg:max-w-2xl">
            <motion.div className="px-4" variants={itemVariants}>
              <h1 className="text-white font-light text-2xl md:text-3xl drop-shadow-md">
                Bienvenido a <span className="font-bold">{store.basicInfo?.name || ''}</span>
              </h1>
            </motion.div>

            <motion.hr className="border-white/20 border-1" variants={itemVariants} />

            {/* Descripción */}
            <motion.p
              className="text-white/90 text-md text-justify px-4 drop-shadow-md"
              variants={itemVariants}
            >
              {store.basicInfo?.description || ''}
            </motion.p>

            {/* Dirección y horario */}
            <motion.div className="flex flex-row gap-4 px-4 flex-wrap" variants={itemVariants}>
              {store.address?.street && (
                <div className="flex items-center gap-2 drop-shadow-md">
                  <MapPin
                    size={24}
                    style={{ color: iconColor }}
                    className="flex-shrink-0"
                  />
                  <p className="text-white/90 text-md">
                    {store.address.street}
                    {store.address.city && `, ${store.address.city}`}
                  </p>
                </div>
              )}

              {store.schedule && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity drop-shadow-md">
                      <Clock
                        size={24}
                        style={{ color: iconColor }}
                        className="flex-shrink-0"
                      />
                      <p className="text-white/90 text-md">Ver horarios</p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" style={{ color: iconColor }} />
                        Horarios de {store.basicInfo?.name || 'la tienda'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <WeeklyScheduleDisplay schedule={weeklySchedule} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </motion.div>

            {/* Botones de contacto y badge de estado */}
            <motion.div
              className="flex flex-wrap items-center gap-3 mt-4 justify-center lg:justify-start px-4 mb-2"
              variants={buttonContainerVariants}
            >
              {store.contactInfo?.whatsapp && (
                <motion.button
                  variants={buttonItemVariants}
                  className="group relative flex items-center gap-2 px-4 py-2.5 bg-black/20 backdrop-blur-md border border-white/30 hover:bg-[var(--store-primary)] hover:border-[var(--store-primary)] text-white rounded-full transition-all duration-300 font-medium text-sm overflow-hidden"
                  onClick={handleWhatsAppClick}
                  aria-label="Contactar por WhatsApp"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle size={18} className="group-hover:rotate-12 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10">WhatsApp</span>
                </motion.button>
              )}

              {store.socialLinks?.instagram && (
                <motion.button
                  variants={buttonItemVariants}
                  className="group relative flex items-center gap-2 px-4 py-2.5 bg-black/20 backdrop-blur-md border border-white/30 hover:bg-[var(--store-primary)] hover:border-[var(--store-primary)] text-white rounded-full transition-all duration-300 font-medium text-sm overflow-hidden"
                  onClick={handleInstagramClick}
                  aria-label="Visitar Instagram"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Instagram size={18} className="group-hover:rotate-12 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10">Instagram</span>
                </motion.button>
              )}

              {store.socialLinks?.facebook && (
                <motion.button
                  variants={buttonItemVariants}
                  className="group relative flex items-center gap-2 px-4 py-2.5 bg-black/20 backdrop-blur-md border border-white/30 hover:bg-[var(--store-primary)] hover:border-[var(--store-primary)] text-white rounded-full transition-all duration-300 font-medium text-sm overflow-hidden"
                  onClick={handleFacebookClick}
                  aria-label="Visitar Facebook"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Facebook size={18} className="group-hover:rotate-12 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10">Facebook</span>
                </motion.button>
              )}

              {/* Badge de estado de la tienda */}
              <motion.div
                variants={buttonItemVariants}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-lg ${storeStatus.status?.isOpen
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${storeStatus.status?.isOpen ? 'bg-white animate-pulse' : 'bg-white'
                  }`}></div>
                {storeStatus.status?.isOpen ? 'Abierto' : 'Cerrado'}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </header>
  );
};

export default HeaderWelcome;
