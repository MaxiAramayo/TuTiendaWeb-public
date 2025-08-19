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
import { useProducts } from "@/features/dashboard/modules/products/hooks/useProducts";
import { Product } from "@/shared/types/firebase.types";
import { useToast } from "../use-toast";

interface Props {
  open: boolean;
  title: string;
  description: string;
  product: Product;
  setOpen: (open: boolean) => void;
}

const AlertDialog = ({ description, open, title, product, setOpen }: Props) => {
  const { toast } = useToast();
  const { deleteProduct } = useProducts();

  const handleDelete = () => {
    try {
      deleteProduct(product.id);
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se ha podido eliminar el producto",
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
