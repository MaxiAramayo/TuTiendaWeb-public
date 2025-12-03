/**
 * Componente de estadísticas del perfil
 * 
 * Muestra información estadística sobre la completitud y estado del perfil
 * con funcionalidades interactivas y recomendaciones específicas.
 * 
 * @module features/dashboard/modules/profile/ui
 */

import { StoreProfile } from "../types/store.type";
import { calculateProfileCompleteness } from "../utils/profile.utils";

/**
 * Props para el componente de estadísticas
 */
interface ProfileStatsProps {
  /** Perfil de la tienda del cual mostrar estadísticas */
  user: StoreProfile;
  /** Función callback opcional cuando se hace clic en editar */
  onEditClick?: () => void;
}

/**
 * Componente que muestra estadísticas del perfil
 * Los datos se actualizan automáticamente cuando se guarda el perfil
 * porque el store de Zustand se actualiza
 */
const ProfileStats = ({ user: profile, onEditClick }: ProfileStatsProps) => {
  // Calcular completitud dinámicamente
  const completeness = calculateProfileCompleteness(profile);
  const isComplete = completeness >= 80; // Consider profile complete at 80%

  // Campos faltantes para dar recomendaciones específicas (solo campos esenciales)
  const missingFields = [
    { field: 'basicInfo.name', label: 'Nombre del comercio', required: true, value: profile.basicInfo?.name },
    { field: 'basicInfo.description', label: 'Descripción', required: true, value: profile.basicInfo?.description },
    { field: 'contactInfo.whatsapp', label: 'WhatsApp', required: true, value: profile.contactInfo?.whatsapp },
  ].filter(item => !item.value || (typeof item.value === 'string' && item.value.trim() === '') || item.value === undefined || item.value === null);

  // Campos recomendados (opcionales pero importantes)
  const recommendedFields = [
    { field: 'socialLinks.instagram', label: 'Instagram', value: profile.socialLinks?.instagram },
    { field: 'address.street', label: 'Dirección', value: profile.address?.street },
  ].filter(item => !item.value || (typeof item.value === 'string' && item.value.trim() === ''));

  const requiredMissing = missingFields;
  const optionalMissing = recommendedFields;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Estado del Perfil
        </h3>
        {!isComplete && onEditClick && (
          <button
            onClick={onEditClick}
            className="text-sm bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors"
          >
            Completar
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Barra de progreso mejorada */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              Progreso de completitud
            </span>
            <span className="text-sm font-bold text-gray-800">
              {completeness}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ease-out ${
                completeness >= 90
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : completeness >= 70
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : completeness >= 50
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                  : "bg-gradient-to-r from-red-500 to-red-600"
              }`}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {/* Estado con iconos mejorados */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Estado del perfil:</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                isComplete
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isComplete ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Completo
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Incompleto
                </>
              )}
            </span>
          </div>
        </div>

        {/* Recomendaciones específicas */}
        {!isComplete && (
          <div className="space-y-3">
            {requiredMissing.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Campos requeridos faltantes:
                </h4>
                <ul className="text-xs text-red-700 space-y-1">
                  {requiredMissing.map((field, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span>•</span>
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {optionalMissing.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Para mejorar tu perfil:
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  {optionalMissing.map((field, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span>•</span>
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de éxito para perfil completo */}
        {isComplete && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <strong>¡Excelente!</strong> Tu perfil está completo y optimizado para atraer más clientes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileStats;
