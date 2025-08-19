/**
 * Tipos específicos para autenticación
 * 
 * @module features/auth/auth.types
 */

/**
 * Credenciales de autenticación
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Error de autenticación estructurado
 */
export interface AuthError {
  code: string;
  message: string;
  field?: 'email' | 'password' | 'general';
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Usuario autenticado (datos mínimos de Firebase Auth)
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

/**
 * Resultado de autenticación con Google
 */
export interface GoogleAuthResult {
  userCredential: any; // UserCredential de Firebase
  isNewUser: boolean;
}

/**
 * Datos para crear usuario durante registro
 */
export interface CreateUserData {
  email: string;
  password: string;
  userData: {
    displayName: string;
    role: 'owner';
    storeIds: string[];
    preferences?: any;
  };
}