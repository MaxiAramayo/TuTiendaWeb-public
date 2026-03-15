/**
 * Componente unificado del estado de salud del perfil
 * 
 * Combina estadísticas y consejos en un diseño más compacto y moderno.
 * 
 * @module features/dashboard/modules/profile/ui
 */

import { StoreProfile } from "../types/store.type";
import { calculateProfileCompleteness, getProfileRecommendations } from '../utils/profile.utils';
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHealthProps {
  profile: StoreProfile;
  onEditClick?: () => void;
}

export default function ProfileHealth({ profile, onEditClick }: ProfileHealthProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const completeness = calculateProfileCompleteness(profile);
  const isComplete = completeness >= 80;
  const recommendations = getProfileRecommendations(profile);

  // Generar consejos
  const tips = [];

  // Faltantes esenciales
  if (!profile.basicInfo?.name || profile.basicInfo.name.trim() === '') {
    tips.push({
      type: "error",
      title: "Nombre del comercio faltante",
      description: "Agrega el nombre para que te identifiquen fácilmente.",
      priority: 1
    });
  }
  if (!profile.basicInfo?.description || profile.basicInfo.description.trim() === '') {
    tips.push({
      type: "error",
      title: "Descripción faltante",
      description: "Una descripción ayuda a los clientes a conocer tu negocio.",
      priority: 1
    });
  }
  if (!profile.contactInfo?.whatsapp || profile.contactInfo.whatsapp.trim() === '') {
    tips.push({
      type: "error",
      title: "WhatsApp faltante",
      description: "Agrega tu número para que puedan contactarte.",
      priority: 1
    });
  }

  // Recomendaciones
  recommendations.forEach((rec, idx) => {
    tips.push({
      type: "info",
      title: "Recomendación",
      description: rec,
      priority: 2 + idx
    });
  });

  if (completeness >= 80 && completeness < 100) {
    tips.push({
      type: "success",
      title: "Casi listo",
      description: "Sube imágenes de alta calidad para optimizar tu contenido.",
      priority: 4
    });
  }

  tips.sort((a, b) => a.priority - b.priority);
  const topTips = tips.slice(0, 3);
  const hasTips = tips.length > 0;

  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all",
      isComplete ? "border-green-200 bg-green-50/30" : ""
    )}>
      {/* Resumen Compacto (Siempre visible) */}
      <div 
        className={cn(
          "p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer sm:cursor-default",
          hasTips ? "hover:bg-gray-50/50 sm:hover:bg-transparent" : ""
        )}
        onClick={() => hasTips && window.innerWidth < 640 && setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Circulo de Progreso */}
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-gray-100"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={125.6} // 2 * pi * 20
                  strokeDashoffset={125.6 - (125.6 * completeness) / 100}
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    completeness >= 90 ? "text-green-500" :
                    completeness >= 70 ? "text-blue-500" :
                    completeness >= 50 ? "text-amber-500" : "text-red-500"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-700">{completeness}%</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                Salud del Perfil
                {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </h3>
              <p className="text-sm text-gray-500">
                {isComplete ? "¡Tu perfil está optimizado!" : "Completa tu perfil para atraer más clientes."}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de la barra */}
        <div className="flex items-center gap-3">
          {!isComplete && onEditClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick();
              }}
              className="hidden sm:flex text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors items-center gap-2 font-medium"
            >
              Completar ahora
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {hasTips && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium bg-gray-100/50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors ml-auto sm:ml-0"
            >
              {isExpanded ? 'Ocultar tips' : `${tips.length} tips`}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Detalles Expandibles (Tips) */}
      <AnimatePresence>
        {isExpanded && hasTips && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topTips.map((tip, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "p-3 rounded-lg border flex gap-3 items-start",
                      tip.type === 'error' ? "bg-red-50 border-red-100" :
                      tip.type === 'success' ? "bg-green-50 border-green-100" :
                      "bg-blue-50 border-blue-100"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5",
                      tip.type === 'error' ? "text-red-500" :
                      tip.type === 'success' ? "text-green-500" :
                      "text-blue-500"
                    )}>
                      {tip.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                       tip.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                       <Info className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className={cn(
                        "text-sm font-semibold mb-0.5",
                        tip.type === 'error' ? "text-red-900" :
                        tip.type === 'success' ? "text-green-900" :
                        "text-blue-900"
                      )}>{tip.title}</h4>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        tip.type === 'error' ? "text-red-700" :
                        tip.type === 'success' ? "text-green-700" :
                        "text-blue-700"
                      )}>{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {tips.length > 3 && (
                <p className="text-xs text-center text-gray-500 mt-4">
                  Y {tips.length - 3} consejos más disponibles. Revisa tu información básica.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
