import { getServerSession } from '@/lib/auth/server-session';
import { getProductById } from '@/features/products/services/product.service';
import ProductDetailsView from '@/features/products/components/product-details-view';
import { redirect, notFound } from 'next/navigation';

export const metadata = {
  title: 'Detalles del Producto | Dashboard',
  description: 'Ver detalles del producto',
};

interface ViewProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewProductPage({ params }: ViewProductPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  const { id } = await params;
  const product = await getProductById(id, session.storeId);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailsView
      product={product}
      storeId={session.storeId}
    />
  );
}