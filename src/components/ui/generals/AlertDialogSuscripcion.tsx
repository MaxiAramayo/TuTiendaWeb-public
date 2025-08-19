"use client";

import {
  AlertDialog as AlertDialogComponent,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { authService } from "@/features/auth/services/authService";

interface Props {
  suscripcion?: boolean;
}

const AlertDialogSuscripcion = ({ suscripcion }: Props) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (suscripcion === false) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [suscripcion]);

  console.log("suscripcion", suscripcion);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.log(error);
    }
  };

  const handleContinue = () => {
    const whatsappNumber = "+543853002537";
    const whatsappMessage = "Hola, necesito renovar con mi suscripción.";
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`,
      "_blank"
    );
    // La alerta no se cierra para asegurar que el usuario complete la acción en WhatsApp
  };

  if (suscripcion) {
    return null;
  }

  return (
    <AlertDialogComponent open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suscripción Expirada</AlertDialogTitle>
          <AlertDialogDescription>
            Tu suscripción ha expirado. Para seguir disfrutando de nuestros
            servicios, por favor renueva tu suscripción contactándonos. Haz clic
            en &apos;Renovar Suscripción&apos; para enviarnos un mensaje y
            obtener asistencia.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <div className="flex px-3 py-1.5 border rounded-md items-center justify-center">
            <button onClick={handleSignOut}>Cerrar Sesión</button>
          </div>
          <AlertDialogAction onClick={handleContinue}>
            Renovar Suscripción
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogComponent>
  );
};

export default AlertDialogSuscripcion;
