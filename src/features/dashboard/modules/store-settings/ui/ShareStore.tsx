"use client"
/**
 * Componente para compartir la tienda
 * 
 * Proporciona funcionalidad para copiar enlaces y mensajes de la tienda
 * 
 * @module features/dashboard/modules/profile/ui
 */

import { useState } from "react";
import { User } from "@/features/user/user.types";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Eye, ExternalLink } from "lucide-react";
import { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";
import { useProfile } from "@/features/dashboard/modules/store-settings/hooks/useProfile";

/**
 * Props para el componente de compartir tienda
 */
interface ShareStoreProps {
  /** Usuario propietario de la tienda */
  user: User;
  /** Perfil de la tienda (opcional) */
  storeProfile?: StoreProfile;
}

/**
 * Componente para compartir información de la tienda
 */
const ShareStore = ({ user, storeProfile: propStoreProfile }: ShareStoreProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const { profile: hookStoreProfile } = useProfile();
  
  // Usar el perfil pasado como prop o el del hook
  const storeProfile = propStoreProfile || hookStoreProfile;

  /**
   * Copia texto al portapapeles con feedback visual
   */
  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      
      toast({
        title: "Copiado",
        description: `${type} copiado al portapapeles.`,
        duration: 2000,
        variant: "default",
      });
    } catch (error) {
      console.error("Error al copiar:", error);
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles.",
        duration: 2000,
        variant: "destructive",
      });
    }
  };

  const slug = storeProfile?.basicInfo?.slug || user.displayName || 'tienda';
  const storeName = storeProfile?.basicInfo?.name || user.displayName || 'Mi Tienda';
  const storeUrl = `tutiendaweb.com.ar/${slug}`;
  const fullStoreUrl = `https://${storeUrl}`;
  
  const shareMessage = `¡Hola! 👋

¡Bienvenido a ${storeName}! 🛍️
  
Para ver nuestros productos y realizar tu pedido, por favor haz clic en el siguiente enlace: 
👉 ${storeUrl}
  
Si tienes alguna pregunta o necesitas ayuda, estamos aquí para ayudarte. 😊
  
¡Gracias por elegirnos! ✨`;

  return (
    <div className="space-y-6 p-4 bg-white border rounded-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Compartir tu tienda
        </h2>
        
        {/* Enlace directo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600">
            Enlace de tu tienda
          </label>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Link
              href={fullStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-blue-600 hover:text-blue-700 underline truncate"
            >
              {storeUrl}
            </Link>
            <button
              onClick={() => handleCopy(storeUrl, "Enlace")}
              className={`p-2 rounded-md transition-all ${
                copied === "Enlace"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              title="Copiar enlace"
            >
              {copied === "Enlace" ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <img src="/icons/profile/copy.svg" alt="Copiar" className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje para compartir */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">
          Mensaje para WhatsApp
        </label>
        <div className="relative">
          <textarea
            value={shareMessage}
            readOnly
            className="w-full p-3 text-sm bg-gray-50 border rounded-lg resize-none"
            rows={8}
          />
          <button
            onClick={() => handleCopy(shareMessage, "Mensaje")}
            className={`absolute top-2 right-2 p-2 rounded-md transition-all ${
              copied === "Mensaje"
                ? "bg-green-100 text-green-700"
                : "bg-white hover:bg-gray-100 shadow-sm"
            }`}
            title="Copiar mensaje"
          >
            {copied === "Mensaje" ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <img src="/icons/profile/copy.svg" alt="Copiar" className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Usa este mensaje como bienvenida para tus clientes en WhatsApp
        </p>
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-2">
        <a
          href={fullStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs flex items-center space-x-2 transition-all hover:scale-105 text-blue-600 flex-1"
        >
          <Eye className="w-4 h-4" />
          <span>Ver tienda</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Compartir por WhatsApp
        </a>
      </div>
    </div>
  );
};

export default ShareStore;
