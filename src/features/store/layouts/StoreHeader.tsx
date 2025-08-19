/**
 * Cabecera principal de la tienda online
 * 
 * Muestra la información principal del negocio, logo, descripción
 * y detalles de contacto.
 * 
 * @module features/store/layouts
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Instagram } from 'lucide-react';

/**
 * Propiedades para el componente StoreHeader
 */
interface StoreHeaderProps {
  /** Nombre del sitio (URL amigable) */
  siteName: string;
  /** Nombre del negocio a mostrar */
  name: string;
  /** Descripción del negocio */
  descripcion: string;
  /** Dirección física del negocio */
  localaddress: string;
  /** Número de WhatsApp (sin prefijo internacional) */
  whatsapp: string;
  /** Enlace al perfil de Instagram */
  instagramlink: string;
  /** Horario de atención */
  openinghours: string;
  /** URL de la imagen de perfil/logo */
  urlProfile: string;
  /** URL de la imagen de portada/fondo */
  urlPortada: string;
}

/**
 * Cabecera principal de la tienda con información del negocio
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const StoreHeader: React.FC<StoreHeaderProps> = ({
  siteName,
  name,
  descripcion,
  localaddress,
  whatsapp,
  instagramlink,
  openinghours,
  urlProfile,
  urlPortada,
}) => {
  // Estado para manejar errores de imagen
  const [profileImageError, setProfileImageError] = useState(false);

  /**
   * Maneja el clic en el botón de WhatsApp
   */
  const handleWhatsAppClick = () => {
    if (!whatsapp) return;
    
    const message = encodeURIComponent(
      `¡Hola! Me gustaría hacerles una consulta desde la tienda online de ${name}`
    );
    
    window.open(`https://wa.me/+54${whatsapp}?text=${message}`, '_blank');
  };

  /**
   * Maneja el clic en el botón de Instagram
   */
  const handleInstagramClick = () => {
    if (!instagramlink) return;
    window.open(instagramlink, '_blank');
  };

  // Estilo para el fondo con o sin imagen de portada
  const backgroundStyle = urlPortada
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${urlPortada})`,
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
              {urlProfile && !profileImageError ? (
                <Image
                  src={urlProfile}
                  alt={`Logo de ${name}`}
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
                Bienvenido a <span className="font-bold">{name}</span>
              </h1>
            </div>

            <hr className="border-white/20 border-1" />
            
            {/* Descripción */}
            <p className="text-white/90 text-md text-justify px-4">
              {descripcion}
            </p>

            {/* Dirección y horario */}
            <div className="flex flex-row gap-4 px-4 flex-wrap">
              {localaddress && (
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/store/location.svg"
                    alt="Ubicación"
                    width={24}
                    height={24}
                  />
                  <p className="text-white/90 text-md">{localaddress}</p>
                </div>
              )}

              {openinghours && (
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/store/clock.svg"
                    alt="Horario"
                    width={24}
                    height={24}
                  />
                  <p className="text-white/90 text-md">{openinghours}</p>
                </div>
              )}
            </div>

            {/* Botones de contacto rediseñados */}
            <div className="flex gap-2 mt-4 justify-center lg:justify-start px-4 mb-2">
              {whatsapp && (
                <button
                  className="group relative flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm overflow-hidden"
                  onClick={handleWhatsAppClick}
                  aria-label="Contactar por WhatsApp"
                >
                  <MessageCircle 
                    size={18} 
                    className="group-hover:rotate-12 transition-transform duration-300 relative z-10" 
                  />
                  <span className="relative z-10">WhatsApp</span>
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              )}
              
              {instagramlink && (
                <button
                  className="group relative flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm overflow-hidden"
                  onClick={handleInstagramClick}
                  aria-label="Visitar Instagram"
                >
                  <Instagram 
                    size={18} 
                    className="group-hover:rotate-12 transition-transform duration-300 relative z-10" 
                  />
                  <span className="relative z-10">Instagram</span>
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;