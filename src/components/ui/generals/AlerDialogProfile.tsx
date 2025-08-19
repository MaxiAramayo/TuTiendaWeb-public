"use client";
import {
  AlertDialog as AlertDialogComponent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "../use-toast";

interface Props {
  open: boolean;
  title: string;
  description: string;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
}

const AlertDialogProfile = ({
  description,
  open,
  title,
  setOpen,
  onConfirm,
}: Props) => {
  const { toast } = useToast();

  const handleDelete = () => {
    try {
      onConfirm();
      toast({
        title: "Imagen eliminada",
        description: "La imagen ha sido eliminada correctamente",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se ha podido eliminar la imagen",
        duration: 2000,
        variant: "destructive",
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <AlertDialogComponent open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogComponent>
  );
};

export default AlertDialogProfile;
