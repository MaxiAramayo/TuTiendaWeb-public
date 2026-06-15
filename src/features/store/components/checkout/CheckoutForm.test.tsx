/**
 * Tests de componente de CheckoutForm (Fase 1 · 1C).
 * Foco: validación visible (nombre, dirección en delivery) y que al checkout
 * SOLO se envían producto/cantidad/variantes (sin precios — seguridad H-1).
 * Dependencias pesadas (framer-motion, cart store, theme, action) mockeadas.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const processCheckoutAction = vi.fn();

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    { get: () => ({ children }: { children?: React.ReactNode }) => <div>{children}</div> },
  ),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/features/store/store/cart.store', () => ({ useCartStore: () => ({ clearCart: vi.fn() }) }));
vi.mock('@/features/store/hooks/useStoreTheme', () => ({ useThemeClasses: () => ({}) }));
vi.mock('@/features/store/components/ThemeProvider', () => ({ useStoreThemeOptional: () => undefined }));
vi.mock('@/features/store/actions/checkout.actions', () => ({
  processCheckoutAction: (...args: unknown[]) => processCheckoutAction(...args),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CheckoutForm } from './CheckoutForm';

const baseProps = {
  carrito: [{ idProduct: 'p1', cantidad: 2, topics: [], aclaracion: '' }] as never,
  total: 1000,
  storeId: 'demo-store',
  storeName: 'Tienda Demo',
  whatsapp: '',
};

describe('CheckoutForm', () => {
  beforeEach(() => processCheckoutAction.mockReset());

  it('renderiza el botón de confirmar pedido', () => {
    render(<CheckoutForm {...baseProps} />);
    expect(screen.getByRole('button', { name: /confirmar pedido/i })).toBeInTheDocument();
  });

  it('muestra error cuando el nombre es muy corto', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...baseProps} />);

    await user.type(screen.getByLabelText(/nombre completo/i), 'A');
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }));

    expect(await screen.findByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument();
    expect(processCheckoutAction).not.toHaveBeenCalled();
  });

  it('exige dirección cuando la entrega es delivery', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm {...baseProps} />);

    await user.type(screen.getByLabelText(/nombre completo/i), 'María García');
    await user.click(screen.getByRole('button', { name: /delivery/i }));
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }));

    expect(await screen.findByText('La dirección es requerida para delivery')).toBeInTheDocument();
    expect(processCheckoutAction).not.toHaveBeenCalled();
  });

  it('al confirmar (retiro) envía items sin precios al servidor', async () => {
    processCheckoutAction.mockResolvedValue({
      success: true,
      data: {
        orderId: 'o1',
        orderNumber: 'ORD-1',
        subtotal: 1000,
        deliveryFee: 0,
        total: 1000,
        whatsappMessage: 'msg',
        whatsappNumber: '549110000',
        storeName: 'Tienda Demo',
      },
    });
    const user = userEvent.setup();
    render(<CheckoutForm {...baseProps} />);

    await user.type(screen.getByLabelText(/nombre completo/i), 'María García');
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }));

    expect(processCheckoutAction).toHaveBeenCalledTimes(1);
    const payload = processCheckoutAction.mock.calls[0][0] as {
      items: Array<Record<string, unknown>>;
    };
    expect(payload.items[0]).toMatchObject({ productId: 'p1', quantity: 2 });
    expect(payload.items[0]).not.toHaveProperty('unitPrice');
    expect(payload.items[0]).not.toHaveProperty('price');
  });
});
