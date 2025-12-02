import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth/server-session';
import { getProducts } from '@/features/products/services/product.service';
import { getCategories } from '@/features/products/services/category.service';
import { getTags } from '@/features/products/services/tag.service';
import ProductsMain from '@/features/products/components/products-main';
import ProductsLoading from './loading';
import { redirect } from 'next/navigation';

// Metadatos
export const metadata = {
  title: 'Productos | Dashboard',
  description: 'Gestión de productos',
};

// ============================================================================
// SERVER COMPONENT - FETCH EN SERVIDOR
// ============================================================================
export default async function ProductsPage() {
  // 1. VERIFICAR AUTH
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  if (!session.storeId) {
    redirect('/dashboard');
  }

  // 2. FETCH INICIAL (en servidor)
  const [products, categories, tags] = await Promise.all([
    getProducts(session.storeId),
    getCategories(session.storeId),
    getTags(session.storeId),
  ]);

  // 3. RENDERIZAR PASANDO PROPS
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsMain
        initialProducts={products}
        categories={categories}
        tags={tags}
        storeId={session.storeId}
      />
    </Suspense>
  );
}