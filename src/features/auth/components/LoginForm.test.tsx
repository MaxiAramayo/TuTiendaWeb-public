/**
 * Tests de componente de LoginForm (Fase 1 · 1C).
 * Foco: validación visible (email/password) y llamada a hybridLogin en submit válido.
 * Las dependencias de Firebase (hybridLogin, GoogleButton) y toast se mockean.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const hybridLogin = vi.fn();

vi.mock('@/features/auth/lib/hybrid-login', () => ({
  hybridLogin: (...args: unknown[]) => hybridLogin(...args),
}));

vi.mock('@/features/auth/components/GoogleButton', () => ({
  GoogleButton: () => <button type="button">Google</button>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  beforeEach(() => {
    hybridLogin.mockReset();
  });

  it('renderiza el título de inicio de sesión', () => {
    render(<LoginForm />);
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('muestra error cuando el email está vacío', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Email es requerido')).toBeInTheDocument();
    expect(hybridLogin).not.toHaveBeenCalled();
  });

  it('muestra el mensaje de Zod cuando el formato de email es inválido', async () => {
    // Con `noValidate` en el <form> (hallazgo Fase1 H-2), la validación nativa del
    // navegador ya no intercepta el submit y el mensaje custom de Zod sí se muestra.
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'no-es-un-email');
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Formato de email inválido')).toBeInTheDocument();
    expect(hybridLogin).not.toHaveBeenCalled();
  });

  it('muestra error cuando la contraseña tiene menos de 6 caracteres', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'ana@demo.com');
    await user.type(screen.getByLabelText(/contraseña/i), '123');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
    expect(hybridLogin).not.toHaveBeenCalled();
  });

  it('llama a hybridLogin con las credenciales cuando el formulario es válido', async () => {
    hybridLogin.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'ana@demo.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(hybridLogin).toHaveBeenCalledWith('ana@demo.com', 'secreto123');
  });
});
