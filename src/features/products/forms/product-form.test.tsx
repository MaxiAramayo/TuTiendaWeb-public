/**
 * Tests de componente de ProductForm (Fase 1 · 1C).
 * Foco: validación visible del precio (debe ser positivo) y que no se llama a
 * onSave con datos inválidos. Actions/compresión de imágenes mockeadas.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../actions/category.actions', () => ({ createCategoryAction: vi.fn() }));
vi.mock('../actions/tag.actions', () => ({ createTagAction: vi.fn() }));
vi.mock('browser-image-compression', () => ({ default: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ProductForm from './product-form';

// Referencias estables: el componente sincroniza categories/tags en un useEffect
// que depende de esas props; un literal nuevo por render dispararía un loop infinito.
const EMPTY_CATEGORIES: never[] = [];
const EMPTY_TAGS: never[] = [];

function renderForm(overrides: Record<string, unknown> = {}) {
  const onSave = vi.fn().mockResolvedValue(true);
  const onCancel = vi.fn();
  render(
    <ProductForm
      storeId="demo-store"
      onSave={onSave}
      onCancel={onCancel}
      categories={EMPTY_CATEGORIES}
      tags={EMPTY_TAGS}
      {...overrides}
    />,
  );
  return { onSave, onCancel };
}

describe('ProductForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza el título de nuevo producto', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: /nuevo producto/i })).toBeInTheDocument();
  });

  it('muestra error si el precio no es positivo', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await user.type(screen.getByPlaceholderText(/Camiseta de Algodón/i), 'Remera');
    await user.click(screen.getByRole('button', { name: /guardar producto/i }));

    expect(await screen.findByText('Precio debe ser positivo')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
