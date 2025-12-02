import { getServerSession } from '@/lib/auth/server-session';
import { getProductById } from '@/features/products/services/product.service';
import { getCategories } from '@/features/products/services/category.service';
import { getTags } from '@/features/products/services/tag.service';
import ProductEditView from '@/features/products/components/product-edit-view';
import { redirect, notFound } from 'next/navigation';

export const metadata = {
  title: 'Editar Producto | Dashboard',
  description: 'Editar producto existente',
};

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  if (!session.storeId) {
    redirect('/dashboard');
  }

  const { id } = await params;

  const [product, categories, tags] = await Promise.all([
    getProductById(id, session.storeId),
    getCategories(session.storeId),
    getTags(session.storeId),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductEditView
      product={product}
      storeId={session.storeId}
      categories={categories}
      tags={tags}
    />
  );
}