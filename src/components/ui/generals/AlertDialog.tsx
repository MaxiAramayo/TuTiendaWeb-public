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
import { useToast } from "@/components/ui/use-toast";

interface Props {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  setOpen: (open: boolean) => void;
}

const AlertDialog = ({ description, open, title, onConfirm, setOpen }: Props) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await onConfirm();
      toast({
        title: "Éxito",
        description: "Operación realizada correctamente",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error",
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

export default AlertDialog;
