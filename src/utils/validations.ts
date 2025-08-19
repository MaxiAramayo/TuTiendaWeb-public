import { User } from "@/shared/types/store";
import { Product } from "@/shared/types/store";

export const isProductNameUnique = (
  productName: string,
  products: Product[]
): boolean => {
  return !products.some(
    (product) => product.name.toLowerCase() === productName.toLowerCase()
  );
};
