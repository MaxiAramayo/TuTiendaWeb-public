/**
 * Componente de botón para cerrar sesión
 * 
 * Refactored to use Server Action (logoutAction) instead of authService
 * 
 * @module features/dashboard/components
 */

"use client";

import { useState } from "react";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import Image from "next/image";
import { AlertCircle } from "lucide-react";

/**
 * Interfaz de props para el componente SignOutButton
 */
interface SignOutButtonProps {
  /** Función opcional a ejecutar antes de cerrar sesión */
  onSignOutSuccess?: () => void;
  /** Texto opcional para el botón - por defecto "Cerrar sesión" */
  buttonText?: string;
  /** Si está dentro de un dropdown menu */
  inDropdown?: boolean;
}

/**
 * Componente de botón para cerrar sesión de usuario
 * Usa Server Action (logoutAction) siguiendo el patrón "Server Actions First"
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const SignOutButton: React.FC<SignOutButtonProps> = ({
  onSignOutSuccess,
  buttonText = "Cerrar sesión",
  inDropdown = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Maneja el proceso de cierre de sesión
   */
  const handleSignOut = async (e?: React.MouseEvent) => {
    if (inDropdown && e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Ejecutar callback antes del logout si existe
      if (onSignOutSuccess) {
        onSignOutSuccess();
      }

      // Usar Server Action para logout
      await logoutAction();

      // logoutAction hace redirect a '/', no se ejecuta código después
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setError("No se pudo cerrar sesión. Intente nuevamente.");
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  /**
   * Cancela el proceso de confirmación
   */
  const handleCancel = (e?: React.MouseEvent) => {
    if (inDropdown && e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowConfirm(false);
    setError(null);
  };

  if (inDropdown) {
    return (
      <div className="w-full" onClick={(e) => e.stopPropagation()}>
        {showConfirm ? (
          <div className="flex flex-col space-y-2 p-2">
            <p className="text-sm text-center">¿Confirma cerrar sesión?</p>
            <div className="flex justify-between gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSignOut(e);
                }}
                disabled={isLoading}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
              >
                {isLoading ? "Saliendo..." : "Sí, salir"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel(e);
                }}
                disabled={isLoading}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
            {error && (
              <div className="flex items-center text-red-400 text-xs mt-1">
                <AlertCircle size={12} className="mr-1" />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex items-center cursor-pointer w-full"
            onClick={(e) => {
              e.stopPropagation();
              handleSignOut(e);
            }}
          >
            <Image
              src="/icons/dashboard/logout.svg"
              alt="Cerrar sesión"
              width={16}
              height={16}
              className="mr-2"
            />
            <span>{buttonText}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {showConfirm ? (
        <div className="flex items-center p-2 rounded-lg bg-red-500/10">
          <div className="flex flex-col space-y-2 w-full">
            <p className="text-sm text-white text-center">¿Confirma cerrar sesión?</p>
            <div className="flex justify-between gap-2">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
              >
                {isLoading ? "Saliendo..." : "Sí, salir"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
            {error && (
              <div className="flex items-center text-red-400 text-xs mt-1">
                <AlertCircle size={12} className="mr-1" />
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          onClick={handleSignOut}
        >
          <div className="bg-[#ffffff26] rounded-lg p-3">
            <Image
              src="/icons/dashboard/logout.svg"
              alt="Cerrar sesión"
              width={20}
              height={20}
            />
          </div>
          <span className="ms-3 font-semibold text-white">{buttonText}</span>
        </div>
      )}
    </div>
  );
};

export default SignOutButton;