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
import { MapPin, Clock, MessageCircle, Instagram } from 'lucide-react';
import { StoreData } from "@/shared/types/store";
import { WeeklySchedule } from "@/features/store/types/store.types";
import { useStoreStatus, useTodaySchedule } from "@/features/store/hooks/useStoreStatus";
import { useStoreThemeContext as useTheme } from "@/features/store/components/ThemeProvider";
import { WeeklyScheduleDisplay } from "@/features/store/components/ui/StoreScheduleDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useThemeClasses, useThemeStyles } from "@/features/store/hooks/useStoreTheme";


interface HeaderWelcomeProps {
  store: StoreData & {
    weeklySchedule?: WeeklySchedule;
  };
}

export const HeaderWelcome: React.FC<HeaderWelcomeProps> = ({
  store
}) => {
  // Memoizar el horario semanal para evitar recreaciones innecesarias
  const weeklySchedule = useMemo(() => {
    if (store.weeklySchedule) return store.weeklySchedule;

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
  }, [store.weeklySchedule]);

  // Hook para estado de la tienda con horarios dinámicos
  const storeStatus = useStoreStatus(weeklySchedule);
  const todaySchedule = useTodaySchedule(weeklySchedule);

  // Estado para manejar errores de imagen
  const [profileImageError, setProfileImageError] = useState(false);

  // Hook para obtener el tema de la tienda
  const themeContext = useTheme();

  // Hooks del tema
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();

  // Color primario del tema para los iconos
  const iconColor = themeContext.theme.colors.primary || '#3b82f6';

  /**
   * Maneja el clic en el botón de WhatsApp
   */
  const handleWhatsAppClick = () => {
    if (!store.whatsapp) return;

    const message = encodeURIComponent(
      `¡Hola! Me gustaría hacerles una consulta desde la tienda online de ${store.name}`
    );

    // Limpiar el número y asegurar que tenga el formato correcto
    let phoneNumber = store.whatsapp.replace(/\D/g, ''); // Eliminar todo excepto dígitos

    // Si no comienza con código de país, agregar el de Argentina
    if (!phoneNumber.startsWith('54')) {
      phoneNumber = '54' + phoneNumber;
    }

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  /**
   * Maneja el clic en el botón de Instagram
   */
  const handleInstagramClick = () => {
    if (!store.instagramlink) return;
    window.open(store.instagramlink, '_blank');
  };

  // Estilo para el fondo con o sin imagen de portada
  const backgroundStyle = store.urlPortada
    ? {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${store.urlPortada})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }
    : {
      backgroundColor: "#212134",
    };

  return (
    <header className="relative">
      <div
        className="flex flex-col lg:justify-between rounded-b-3xl shadow-lg py-5 px-5 overflow-hidden gap-3 xl:w-[85%] xl:mx-auto"
        style={backgroundStyle}
      >
        {/* Banner TuTiendaWeb */}
        <Link className="flex justify-center items-center z-10" href="/">
          <p className="text-white text-sm">
            Creado con <span className="font-bold">TuTiendaWeb</span>
          </p>
          <Image
            src="/favicon.ico"
            alt="Logo TuTiendaWeb"
            width={20}
            height={20}
            className="ml-1"
          />
        </Link>

        <div className="lg:flex lg:flex-row-reverse lg:justify-between">
          {/* Logo/Imagen del negocio */}
          <div className="items-center justify-center flex mt-5 mb-6 relative lg:w-[400px] z-10">
            {/* Círculos decorativos */}
            <div className="bg-white w-[290px] h-[290px] absolute rounded-full opacity-[0.06]"></div>
            <div className="bg-white w-[360px] h-[360px] absolute rounded-full opacity-[0.05]"></div>
            <div className="bg-white w-[440px] h-[440px] absolute rounded-full opacity-[0.04]"></div>

            {/* Imagen de perfil */}
            <div className="w-[220px] h-[220px] rounded-full relative flex items-center justify-center overflow-hidden z-10 border-4 border-white/10">
              {store.urlProfile && !profileImageError ? (
                <Image
                  src={store.urlProfile}
                  alt={`Logo de ${store.name}`}
                  width={220}
                  height={220}
                  className="object-cover w-full h-full"
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <Image
                  src="/images/store/modern-store-logo.svg"
                  alt="Logo de tienda moderno"
                  width={220}
                  height={220}
                  className="object-cover w-full h-full bg-gray-200"
                />
              )}
            </div>
          </div>

          {/* Información del negocio */}
          <div className="flex flex-col gap-3 lg:py-5 lg:px-3 lg:mt-10 z-10 lg:max-w-2xl">
            <div className="px-4">
              <h1 className="text-white font-light text-2xl md:text-3xl">
                Bienvenido a <span className="font-bold">{store.name}</span>
              </h1>
            </div>

            <hr className="border-white/20 border-1" />

            {/* Descripción */}
            <p className="text-white/90 text-md text-justify px-4">
              {store.descripcion}
            </p>

            {/* Dirección y horario */}
            <div className="flex flex-row gap-4 px-4 flex-wrap">
              {store.localaddress && (
                <div className="flex items-center gap-2">
                  <MapPin
                    size={24}
                    style={{ color: iconColor }}
                    className="flex-shrink-0"
                  />
                  <p className="text-white/90 text-md">{store.localaddress}</p>
                </div>
              )}

              {store.openinghours && store.weeklySchedule && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <Clock
                        size={24}
                        style={{ color: iconColor }}
                        className="flex-shrink-0"
                      />
                      <p className="text-white/90 text-md">{store.openinghours}</p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" style={{ color: iconColor }} />
                        Horarios de {store.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <WeeklyScheduleDisplay schedule={weeklySchedule} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {store.openinghours && !store.weeklySchedule && (
                <div className="flex items-center gap-2">
                  <Clock
                    size={24}
                    style={{ color: iconColor }}
                    className="flex-shrink-0"
                  />
                  <p className="text-white/90 text-md">{store.openinghours}</p>
                </div>
              )}
            </div>

            {/* Botones de contacto y badge de estado */}
            <div className="flex flex-wrap items-center gap-3 mt-4 justify-center lg:justify-start px-4 mb-2">
              {/* Botones de redes sociales rediseñados */}
              {/* Botones de redes sociales rediseñados - Ghost Style */}
              {store.whatsapp && (
                <button
                  className="group relative flex items-center gap-2 px-4 py-2.5 bg-black/20 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full transition-all duration-300 font-medium text-sm overflow-hidden"
                  onClick={handleWhatsAppClick}
                  aria-label="Contactar por WhatsApp"
                >
                  <MessageCircle
                    size={18}
                    className="group-hover:rotate-12 transition-transform duration-300 relative z-10"
                  />
                  <span className="relative z-10">WhatsApp</span>
                </button>
              )}

              {store.instagramlink && (
                <button
                  className="group relative flex items-center gap-2 px-4 py-2.5 bg-black/20 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full transition-all duration-300 font-medium text-sm overflow-hidden"
                  onClick={handleInstagramClick}
                  aria-label="Visitar Instagram"
                >
                  <Instagram
                    size={18}
                    className="group-hover:rotate-12 transition-transform duration-300 relative z-10"
                  />
                  <span className="relative z-10">Instagram</span>
                </button>
              )}

              {/* Badge de estado de la tienda */}
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-lg ${storeStatus.status?.isOpen
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
                }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${storeStatus.status?.isOpen ? 'bg-white animate-pulse' : 'bg-white'
                  }`}></div>
                {storeStatus.status?.isOpen ? 'Abierto' : 'Cerrado'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderWelcome;
