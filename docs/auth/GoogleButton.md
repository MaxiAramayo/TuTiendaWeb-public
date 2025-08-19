# Componente GoogleButton

## Descripción

El componente `GoogleButton` proporciona una interfaz de usuario para la autenticación con Google OAuth. Maneja tanto el registro como el inicio de sesión de usuarios nuevos y existentes, incluyendo casos especiales como perfiles incompletos.

## Ubicación

```
src/features/auth/components/GoogleButton.tsx
```

## Características Principales

- **Autenticación OAuth con Google**
- **Manejo de usuarios nuevos y existentes**
- **Detección de perfiles incompletos**
- **Estados de carga visual**
- **Callbacks personalizables**
- **Manejo de errores integrado**
- **Redirección inteligente**

## Props Interface

```typescript
interface GoogleButtonProps {
  onNewUser?: (userData: {
    email: string;
    displayName: string;
    acceptedTerms: boolean;
  }) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  text?: string;
}
```

### Descripción de Props

- **`onNewUser`**: Callback ejecutado para usuarios nuevos o con perfiles incompletos
- **`className`**: Clases CSS adicionales
- **`disabled`**: Deshabilita el botón
- **`variant`**: Estilo visual del botón
- **`size`**: Tamaño del botón
- **`showIcon`**: Mostrar/ocultar icono de Google
- **`text`**: Texto personalizado del botón

## Implementación

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

interface GoogleButtonProps {
  onNewUser?: (userData: {
    email: string;
    displayName: string;
    acceptedTerms: boolean;
  }) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  text?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onNewUser,
  className = '',
  disabled = false,
  variant = 'outline',
  size = 'md',
  showIcon = true,
  text = 'Continuar con Google'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      // Manejar usuarios nuevos o con perfiles incompletos
      if ((result?.isNewUser || result?.hasIncompleteProfile) && onNewUser) {
        const userData = {
          email: result.user?.email || '',
          displayName: result.user?.displayName || '',
          acceptedTerms: true // Google users auto-accept terms
        };
        
        onNewUser(userData);
      } else if (result?.isNewUser || result?.hasIncompleteProfile) {
        // Si no hay callback, redirigir a complete-profile
        router.push('/complete-profile');
      }
      // Para usuarios existentes con perfil completo, useAuth maneja la redirección
      
    } catch (error) {
      console.error('Error en Google Sign-In:', error);
      // El error ya es manejado por useAuth/authService
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full ${className}`}
      onClick={handleGoogleSignIn}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Conectando...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {showIcon && <GoogleIcon className="w-4 h-4 mr-2" />}
          {text}
        </div>
      )}
    </Button>
  );
};
```

## Estados del Componente

### Estados Internos

```typescript
const [isLoading, setIsLoading] = useState(false);
```

- **`isLoading`**: Indica si la autenticación está en progreso

### Estados Visuales

1. **Reposo**: Botón normal con texto e icono
2. **Cargando**: Spinner y texto "Conectando..."
3. **Deshabilitado**: Botón no interactivo
4. **Error**: Manejado por el sistema de errores global

## Flujo de Autenticación

### Diagrama de Flujo

```
Usuario hace clic → setIsLoading(true) → signInWithGoogle()
                                              ↓
                                         Resultado
                                              ↓
                    ┌─────────────────────────┼─────────────────────────┐
                    ↓                         ↓                         ↓
            Usuario Nuevo              Perfil Incompleto        Usuario Existente
                    ↓                         ↓                         ↓
              onNewUser?                onNewUser?               Redirección
                    ↓                         ↓                 automática
            ┌───────┴───────┐         ┌───────┴───────┐       a /dashboard
            ↓               ↓         ↓               ↓
      Callback          Redirigir  Callback      Redirigir
      onNewUser         a /complete onNewUser    a /complete
                        -profile                 -profile
```

### Casos de Uso

#### 1. Usuario Nuevo con Callback
```typescript
// En página de registro
<GoogleButton 
  onNewUser={(userData) => {
    // Procesar datos del usuario
    setUserData(userData);
    // Continuar con el flujo de registro
    nextStep();
  }}
/>
```

#### 2. Usuario Nuevo sin Callback
```typescript
// En página de login simple
<GoogleButton />
// Redirige automáticamente a /complete-profile
```

#### 3. Usuario Existente con Perfil Completo
```typescript
// Cualquier contexto
<GoogleButton />
// Redirige automáticamente a /dashboard
```

#### 4. Usuario Existente con Perfil Incompleto
```typescript
// Con callback para manejo personalizado
<GoogleButton 
  onNewUser={(userData) => {
    // Manejar perfil incompleto
    handleIncompleteProfile(userData);
  }}
/>
```

## Integración con useAuth

### Dependencias

```typescript
const { signInWithGoogle } = useAuth();
```

### Resultado de signInWithGoogle

```typescript
interface GoogleSignInResult {
  user: User | null;
  isNewUser: boolean;
  hasIncompleteProfile: boolean;
}
```

### Manejo de Estados

- **Loading**: Controlado localmente en el componente
- **Error**: Manejado por `useAuth` y sistema de errores
- **Success**: Determinado por el resultado de `signInWithGoogle`

## Variantes de Diseño

### Variantes de Estilo

```typescript
// Botón por defecto (outline)
<GoogleButton variant="outline" />

// Botón sólido
<GoogleButton variant="default" />
```

### Tamaños

```typescript
// Pequeño
<GoogleButton size="sm" />

// Mediano (default)
<GoogleButton size="md" />

// Grande
<GoogleButton size="lg" />
```

### Personalización

```typescript
// Sin icono
<GoogleButton showIcon={false} />

// Texto personalizado
<GoogleButton text="Iniciar sesión con Google" />

// Clases adicionales
<GoogleButton className="my-custom-class" />
```

## Manejo de Errores

### Errores Comunes

1. **Popup bloqueado**
   - Código: `auth/popup-blocked`
   - Mensaje: "Popup bloqueado. Permita popups para este sitio"

2. **Popup cerrado por usuario**
   - Código: `auth/popup-closed-by-user`
   - Mensaje: "Inicio de sesión cancelado"

3. **Error de red**
   - Código: `auth/network-request-failed`
   - Mensaje: "Error de conexión. Verifique su internet"

### Estrategia de Manejo

```typescript
try {
  const result = await signInWithGoogle();
  // Procesar resultado exitoso
} catch (error) {
  // Error ya manejado por useAuth/authService
  // Solo logging local si es necesario
  console.error('Error en Google Sign-In:', error);
} finally {
  setIsLoading(false);
}
```

## Accesibilidad

### Características de Accesibilidad

- **Keyboard navigation**: Botón accesible por teclado
- **Screen readers**: Texto descriptivo apropiado
- **Focus management**: Estados de focus visibles
- **ARIA labels**: Etiquetas apropiadas para tecnologías asistivas

### Mejoras Recomendadas

```typescript
<Button
  type="button"
  aria-label={isLoading ? 'Conectando con Google...' : 'Iniciar sesión con Google'}
  aria-disabled={disabled || isLoading}
  role="button"
  tabIndex={disabled ? -1 : 0}
>
```

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleButton } from './GoogleButton';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mocks
jest.mock('../hooks/useAuth');
jest.mock('next/navigation');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('GoogleButton', () => {
  const mockSignInWithGoogle = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
      isLoading: false,
      error: null
    });
    
    mockUseRouter.mockReturnValue({
      push: mockPush
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<GoogleButton />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
  });

  it('should show loading state when clicked', async () => {
    mockSignInWithGoogle.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<GoogleButton />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Conectando...')).toBeInTheDocument();
    });
  });

  it('should call onNewUser for new users', async () => {
    const mockOnNewUser = jest.fn();
    const mockResult = {
      user: { email: 'test@gmail.com', displayName: 'Test User' },
      isNewUser: true,
      hasIncompleteProfile: false
    };
    
    mockSignInWithGoogle.mockResolvedValue(mockResult);
    
    render(<GoogleButton onNewUser={mockOnNewUser} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockOnNewUser).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        displayName: 'Test User',
        acceptedTerms: true
      });
    });
  });

  it('should redirect to complete-profile for new users without callback', async () => {
    const mockResult = {
      user: { email: 'test@gmail.com', displayName: 'Test User' },
      isNewUser: true,
      hasIncompleteProfile: false
    };
    
    mockSignInWithGoogle.mockResolvedValue(mockResult);
    
    render(<GoogleButton />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/complete-profile');
    });
  });

  it('should handle incomplete profiles', async () => {
    const mockOnNewUser = jest.fn();
    const mockResult = {
      user: { email: 'test@gmail.com', displayName: 'Test User' },
      isNewUser: false,
      hasIncompleteProfile: true
    };
    
    mockSignInWithGoogle.mockResolvedValue(mockResult);
    
    render(<GoogleButton onNewUser={mockOnNewUser} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockOnNewUser).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        displayName: 'Test User',
        acceptedTerms: true
      });
    });
  });

  it('should be disabled when disabled prop is true', () => {
    render(<GoogleButton disabled />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<GoogleButton className="custom-class" />);
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should render custom text', () => {
    render(<GoogleButton text="Custom Google Text" />);
    
    expect(screen.getByText('Custom Google Text')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    render(<GoogleButton showIcon={false} />);
    
    // Verificar que no hay icono de Google
    expect(screen.queryByTestId('google-icon')).not.toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('GoogleButton Integration', () => {
  it('should complete full authentication flow', async () => {
    // Mock successful Google authentication
    const mockUser = {
      uid: 'google-user-123',
      email: 'test@gmail.com',
      displayName: 'Test User'
    };
    
    // Test complete flow from button click to redirect
    render(<GoogleButton />);
    
    fireEvent.click(screen.getByRole('button'));
    
    // Verify loading state
    expect(screen.getByText('Conectando...')).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Conectando...')).not.toBeInTheDocument();
    });
    
    // Verify redirect or callback execution
    // (depends on test setup)
  });
});
```

### E2E Tests

```typescript
// cypress/integration/google-auth.spec.ts
describe('Google Authentication', () => {
  it('should authenticate with Google successfully', () => {
    cy.visit('/sign-up');
    
    // Mock Google OAuth popup
    cy.window().then((win) => {
      cy.stub(win, 'open').returns({
        closed: false,
        location: { href: 'https://accounts.google.com/oauth/authorize' }
      });
    });
    
    cy.get('[data-testid="google-button"]').click();
    
    // Verify loading state
    cy.contains('Conectando...').should('be.visible');
    
    // Mock successful authentication
    cy.window().its('postMessage').invoke('call', window, {
      type: 'GOOGLE_AUTH_SUCCESS',
      user: {
        email: 'test@gmail.com',
        displayName: 'Test User'
      }
    });
    
    // Verify redirect
    cy.url().should('include', '/complete-profile');
  });
});
```

## Performance

### Optimizaciones

1. **Lazy loading del icono**
```typescript
const GoogleIcon = lazy(() => import('@/components/icons/GoogleIcon'));
```

2. **Memoización del componente**
```typescript
export const GoogleButton = React.memo<GoogleButtonProps>(({
  onNewUser,
  className,
  disabled,
  variant,
  size,
  showIcon,
  text
}) => {
  // ... implementación
});
```

3. **Debounce de clicks**
```typescript
const debouncedHandleClick = useMemo(
  () => debounce(handleGoogleSignIn, 1000),
  [handleGoogleSignIn]
);
```

### Métricas Recomendadas

- **Tiempo de respuesta** del botón
- **Tasa de éxito** de autenticación
- **Tiempo de carga** del popup
- **Tasa de abandono** en el popup

## Mejores Prácticas

### 1. Uso del Callback
```typescript
// ✅ Bueno: Usar callback para flujos personalizados
<GoogleButton 
  onNewUser={(userData) => {
    setFormData(userData);
    nextStep();
  }}
/>

// ❌ Malo: No usar callback cuando se necesita control
<GoogleButton /> // Solo para login simple
```

### 2. Manejo de Estados
```typescript
// ✅ Bueno: Deshabilitar durante carga
<GoogleButton disabled={isSubmitting || isLoading} />

// ❌ Malo: No controlar estados
<GoogleButton /> // Puede permitir múltiples clicks
```

### 3. Personalización
```typescript
// ✅ Bueno: Personalizar según contexto
<GoogleButton 
  text="Registrarse con Google"
  variant="default"
  size="lg"
/>

// ✅ Bueno: Mantener consistencia
<GoogleButton text="Iniciar sesión con Google" />
```

### 4. Accesibilidad
```typescript
// ✅ Bueno: Proporcionar contexto
<GoogleButton 
  aria-label="Registrarse usando cuenta de Google"
  text="Continuar con Google"
/>
```

## Troubleshooting

### Problemas Comunes

#### Popup Bloqueado
**Síntoma**: El popup de Google no se abre
**Solución**: 
- Verificar configuración del navegador
- Instruir al usuario sobre permisos de popup
- Implementar detección de popup bloqueado

#### Callback No Ejecutado
**Síntoma**: `onNewUser` no se llama para usuarios nuevos
**Solución**:
- Verificar que `result.isNewUser` sea `true`
- Revisar lógica de detección de usuarios nuevos
- Comprobar que el callback esté definido

#### Redirección Incorrecta
**Síntoma**: Usuario redirigido a página incorrecta
**Solución**:
- Verificar lógica de `hasIncompleteProfile`
- Revisar configuración de rutas
- Comprobar estado del usuario en Firestore

#### Estados de Carga Persistentes
**Síntoma**: Botón permanece en estado de carga
**Solución**:
- Verificar que `finally` se ejecute siempre
- Revisar manejo de errores
- Comprobar que no hay promesas sin resolver

## Mejoras Futuras

1. **Soporte para múltiples proveedores OAuth**
2. **Animaciones de transición** mejoradas
3. **Retry automático** para errores de red
4. **Preload del popup** para mejor UX
5. **Métricas de conversión** integradas
6. **Soporte para autenticación sin popup**
7. **Personalización avanzada** de estilos
8. **Integración con analytics** para tracking