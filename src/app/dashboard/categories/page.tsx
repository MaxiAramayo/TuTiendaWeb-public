import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import { getCategoryTree } from '@/features/products/services/category.service';
import CategoriesManager from '@/features/products/components/categories-manager';

export const metadata = {
  title: 'Categorías | Dashboard',
  description: 'Organiza las categorías y subcategorías de tu catálogo',
};

export default async function CategoriesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  if (!session.storeId) {
    redirect('/dashboard');
  }

  const tree = await getCategoryTree(session.storeId);

  return <CategoriesManager initialTree={tree} />;
}
