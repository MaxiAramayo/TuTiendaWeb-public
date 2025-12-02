import { getServerSession } from '@/lib/auth/server-session';
import { getCategories } from '@/features/products/services/category.service';
import { getTags } from '@/features/products/services/tag.service';
import ProductCreateView from '@/features/products/components/product-create-view';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Nuevo Producto | Dashboard',
  description: 'Crear un nuevo producto',
};

export default async function NewProductPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  const [categories, tags] = await Promise.all([
    getCategories(session.storeId),
    getTags(session.storeId),
  ]);


  return (
    <ProductCreateView
      storeId={session.storeId}
      categories={categories}
      tags={tags}
    />
  );
}