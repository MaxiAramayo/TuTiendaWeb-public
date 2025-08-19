/**
 * Componente de consejos de optimización del perfil
 * 
 * Proporciona recomendaciones personalizadas para mejorar el perfil
 * y aumentar las conversiones de la tienda.
 * 
 * @module features/dashboard/modules/profile/ui
 */

import { StoreProfile } from "../types/store.type";
import { calculateProfileCompleteness, getProfileRecommendations } from '../utils/profile.utils';

/**
 * Props para el componente de consejos
 */
interface ProfileTipsProps {
  /** Perfil de la tienda para analizar y generar consejos */
  user: StoreProfile;
}

/**
 * Componente que muestra consejos de optimización del perfil
 */
const ProfileTips = ({ user: profile }: ProfileTipsProps) => {
  const completeness = calculateProfileCompleteness(profile);
  const recommendations = getProfileRecommendations(profile);
  
  // Generar consejos basados en el perfil actual
  const tips = [];

  // Campos faltantes esenciales
  if (!profile.basicInfo?.name || profile.basicInfo.name.trim() === '') {
    tips.push({
      type: "error",
      icon: "⚠️",
      title: "Nombre del comercio faltante",
      description: "Agrega el nombre de tu comercio para que los clientes te identifiquen fácilmente.",
      priority: 1
    });
  }

  if (!profile.basicInfo?.description || profile.basicInfo.description.trim() === '') {
    tips.push({
      type: "error",
      icon: "📝",
      title: "Descripción faltante",
      description: "Una descripción atractiva ayuda a los clientes a conocer tu negocio.",
      priority: 1
    });
  }

  if (!profile.contactInfo?.whatsapp || profile.contactInfo.whatsapp.trim() === '') {
    tips.push({
      type: "error",
      icon: "📱",
      title: "WhatsApp faltante",
      description: "Agrega tu número de WhatsApp para que los clientes puedan contactarte fácilmente.",
      priority: 1
    });
  }

  // Consejos de recomendaciones del sistema
  recommendations.forEach((recommendation, index) => {
    tips.push({
      type: "info",
      icon: "💡",
      title: "Recomendación",
      description: recommendation,
      priority: 2 + index
    });
  });

  // Consejos avanzados
  if (completeness >= 80) {
    tips.push({
      type: "success",
      icon: "🚀",
      title: "Optimiza tu contenido",
      description: "Tu perfil está casi completo. Asegúrate de que las fotos sean de alta calidad y la descripción sea atractiva.",
      priority: 4
    });
  }

  if (completeness === 100) {
    tips.push({
      type: "success",
      icon: "🎉",
      title: "¡Perfil completo!",
      description: "Excelente trabajo. Ahora enfócate en agregar productos y promocionar tu tienda.",
      priority: 4
    });
  }

  // Ordenar por prioridad y limitar a los más importantes
  tips.sort((a, b) => a.priority - b.priority);

  // No mostrar si no hay consejos
  if (tips.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        💡 Consejos para tu perfil
      </h3>
      
      <div className="space-y-3">
        {tips.slice(0, 3).map((tip, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              tip.type === "error"
                ? "bg-red-50 border-red-200"
                : tip.type === "warning"
                ? "bg-amber-50 border-amber-200"
                : tip.type === "success"
                ? "bg-green-50 border-green-200"
                : tip.type === "info"
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
              <div className="flex-1">
                <h4
                  className={`font-medium text-sm mb-1 ${
                    tip.type === "error"
                      ? "text-red-800"
                      : tip.type === "warning"
                      ? "text-amber-800"
                      : tip.type === "success"
                      ? "text-green-800"
                      : tip.type === "info"
                      ? "text-blue-800"
                      : "text-gray-800"
                  }`}
                >
                  {tip.title}
                </h4>
                <p
                  className={`text-sm ${
                    tip.type === "error"
                      ? "text-red-700"
                      : tip.type === "warning"
                      ? "text-amber-700"
                      : tip.type === "success"
                      ? "text-green-700"
                      : tip.type === "info"
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {tip.description}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {tips.length > 3 && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              +{tips.length - 3} consejos más disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTips;
