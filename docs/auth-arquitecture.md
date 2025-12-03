Documento de Arquitectura: Sistema de Autenticación - Next.js 15 + Firebase
Stack: Next.js 15, TypeScript, Firebase Admin SDK, Firebase Auth, Zod
Versión: 1.0 | Diciembre 2025

1. Principios Fundamentales
1.1. Server-First Authentication
REGLAS OBLIGATORIAS:

✅ Session management: httpOnly cookies

✅ Token verification: Firebase Admin SDK (servidor)

✅ Auth mutations: Server Actions ('use server')

✅ UI auth state: Firebase Client SDK (onAuthStateChanged)

❌ NO almacenar tokens en localStorage

❌ NO auth logic en Client Components (solo UI)

❌ NO custom claims en cliente

1.2. Hybrid Authentication Pattern
typescript
// FLUJO:
// 1. Cliente: Firebase Client SDK → getIdToken()
// 2. Server Action: verifyIdToken() → set httpOnly cookie
// 3. Servidor: Lee cookie → verifica token → autoriza
RAZÓN: Firebase Admin SDK no puede verificar contraseñas, por eso usamos Client SDK para auth inicial y Server SDK para verificación.

2. Estructura de Base de Datos
2.1. Colección: users
typescript
// Firestore: /users/{userId}
interface UserDocument {
  id: string;                    // UID de Firebase Auth
  email: string;                 // Email principal
  displayName: string;           // Nombre completo
  photoURL?: string;            // Avatar URL
  phone?: string;               // Teléfono en formato E.164
  role: 'owner' | 'admin' | 'employee';  // Rol base
  storeIds: string[];           // Array de tiendas asociadas (ELIMINAR DESPUÉS)
  currentStoreId?: string;      // Tienda activa (ELIMINAR DESPUÉS)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
⚠️ MIGRACIÓN NECESARIA:

Tu estructura actual tiene storeIds y role en Firestore. Estos deben moverse a Custom Claims en Firebase Auth.

typescript
// ❌ ACTUAL (Firestore)
const user = await adminDb.collection('users').doc(userId).get();
const storeId = user.data().storeIds[0];  // Lento, requiere query

// ✅ OBJETIVO (Custom Claims)
const decodedToken = await adminAuth.verifyIdToken(token);
const storeId = decodedToken.storeId;  // Rápido, viene en el token
2.2. Custom Claims (Firebase Auth)
typescript
// Firebase Auth Custom Claims
interface CustomClaims {
  storeId: string;              // Tienda principal del usuario
  role: 'owner' | 'admin' | 'employee';
}

// Cómo se setean:
await adminAuth.setCustomUserClaims(userId, {
  storeId: 'KFk1qdddTBdgFIc2ZAGu',
  role: 'owner'
});

// Disponibles en:
// 1. Server: decodedToken.storeId
// 2. Security Rules: request.auth.token.storeId
// 3. Cliente: user.getIdTokenResult().claims.storeId
VENTAJAS:

Sin queries adicionales a Firestore

Disponibles en Security Rules

Incluidas en el token JWT

Cacheadas automáticamente

3. Schemas de Validación (Zod)
3.1. Login Schema
typescript
// features/auth/schemas/login.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email requerido'),
  password: z.string()
    .min(6, 'Mínimo 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
3.2. Register Schema
typescript
// features/auth/schemas/register.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string()
    .email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  displayName: z.string()
    .min(3, 'Nombre muy corto')
    .max(50, 'Nombre muy largo'),
  phone: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Formato E.164: +541234567890')
    .optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
3.3. Complete Registration Schema
typescript
// features/auth/schemas/complete-registration.schema.ts
import { z } from 'zod';

// Schema para completar perfil + crear tienda (Google OAuth)
export const completeRegistrationSchema = z.object({
  // User profile
  displayName: z.string().min(3).max(50),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  
  // Store setup
  storeName: z.string().min(3).max(100),
  storeType: z.enum(['retail', 'service', 'restaurant', 'other']),
  address: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    zipCode: z.string().optional(),
  }),
});

export type CompleteRegistrationFormData = z.infer<typeof completeRegistrationSchema>;
3.4. User Profile Update Schema
typescript
// features/auth/schemas/user-profile.schema.ts
import { z } from 'zod';

export const userProfileSchema = z.object({
  displayName: z.string().min(3).max(50),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  photoURL: z.string().url().optional(),
});

export type UserProfileData = z.infer<typeof userProfileSchema>;
4. Services (Firebase Admin SDK)
4.1. User Service
typescript
// features/auth/services/server/user.service.ts
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cleanForFirestore } from '@/lib/utils/firestore';
import type { UserDocument } from '../../types/user.types';
import * as admin from 'firebase-admin';

const USERS_COLLECTION = 'users';

// Crear usuario en Firestore (después de Auth)
export async function createUserInFirestore(
  userId: string,
  data: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserDocument> {
  const userData = cleanForFirestore({
    ...data,
    id: userId,
    storeIds: [],
    role: 'owner' as const,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await adminDb.collection(USERS_COLLECTION).doc(userId).set(userData);

  const doc = await adminDb.collection(USERS_COLLECTION).doc(userId).get();
  return { id: doc.id, ...doc.data() } as UserDocument;
}

// Obtener usuario por ID
export async function getUserById(userId: string): Promise<UserDocument | null> {
  const doc = await adminDb.collection(USERS_COLLECTION).doc(userId).get();
  
  if (!doc.exists) return null;
  
  return { id: doc.id, ...doc.data() } as UserDocument;
}

// Actualizar perfil
export async function updateUserProfile(
  userId: string,
  data: Partial<Omit<UserDocument, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  const cleanData = cleanForFirestore({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await adminDb.collection(USERS_COLLECTION).doc(userId).update(cleanData);
}

// Google OAuth: Obtener o crear
export async function getOrCreateUserFromGoogle(
  firebaseUser: admin.auth.UserRecord
): Promise<UserDocument> {
  const existing = await getUserById(firebaseUser.uid);
  
  if (existing) return existing;

  return await createUserInFirestore(firebaseUser.uid, {
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'Usuario Google',
    photoURL: firebaseUser.photoURL,
    phone: firebaseUser.phoneNumber,
    role: 'owner',
    storeIds: [],
  });
}

// ⚠️ MIGRACIÓN: Actualizar storeIds (temporal, eliminar después)
export async function addStoreToUser(userId: string, storeId: string): Promise<void> {
  await adminDb.collection(USERS_COLLECTION).doc(userId).update({
    storeIds: admin.firestore.FieldValue.arrayUnion(storeId),
    currentStoreId: storeId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
4.2. Auth Service (Custom Claims)
typescript
// features/auth/services/server/auth.service.ts
import { adminAuth } from '@/lib/firebase/admin';

interface CustomClaims {
  storeId?: string;
  role?: 'owner' | 'admin' | 'employee';
}

// Setear custom claims
export async function setUserClaims(
  userId: string,
  claims: CustomClaims
): Promise<void> {
  await adminAuth.setCustomUserClaims(userId, claims);
}

// Verificar ID token
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  return await adminAuth.verifyIdToken(token, true); // checkRevoked = true
}

// Revocar tokens (forzar refresh)
export async function revokeUserTokens(userId: string): Promise<void> {
  await adminAuth.revokeRefreshTokens(userId);
}

// Obtener custom claims actuales
export async function getUserClaims(userId: string): Promise<CustomClaims> {
  const user = await adminAuth.getUser(userId);
  return user.customClaims as CustomClaims || {};
}
5. Server Actions
5.1. Login Action
typescript
// features/auth/actions/auth.actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema } from '../schemas/login.schema';
import { verifyIdToken } from '../services/server/auth.service';

type ActionResponse<T = unknown> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export async function loginAction(
  formData: FormData
): Promise<ActionResponse<{ userId: string }>> {
  // 1. PARSE
  const rawData = {
    idToken: formData.get('idToken') as string,
  };

  if (!rawData.idToken) {
    return { success: false, errors: { _form: ['Token no proporcionado'] } };
  }

  // 2. VERIFY TOKEN
  try {
    const decodedToken = await verifyIdToken(rawData.idToken);
    
    // 3. SET COOKIE
    const cookieStore = await cookies();
    cookieStore.set('idToken', rawData.idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hora
      path: '/',
    });

    return { success: true, data: { userId: decodedToken.uid } };
  } catch (error) {
    return { success: false, errors: { _form: ['Token inválido'] } };
  }
}
5.2. Register Action
typescript
// features/auth/actions/auth.actions.ts
'use server';

import { registerSchema } from '../schemas/register.schema';
import { adminAuth } from '@/lib/firebase/admin';
import { createUserInFirestore } from '../services/server/user.service';

export async function registerAction(
  formData: FormData
): Promise<ActionResponse<{ userId: string }>> {
  // 1. PARSE
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
    phone: formData.get('phone'),
  };

  // 2. VALIDATE
  const validation = registerSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  const { email, password, displayName, phone } = validation.data;

  // 3. CREATE IN AUTH
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber: phone,
    });

    // 4. CREATE IN FIRESTORE
    await createUserInFirestore(userRecord.uid, {
      email,
      displayName,
      phone,
      role: 'owner',
      storeIds: [],
    });

    return { success: true, data: { userId: userRecord.uid } };
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return { success: false, errors: { email: ['Email ya registrado'] } };
    }
    return { success: false, errors: { _form: ['Error al crear cuenta'] } };
  }
}
5.3. Complete Registration Action (OAuth)
typescript
// features/auth/actions/auth.actions.ts
'use server';

import { getServerSession } from '@/lib/auth/server-session';
import { completeRegistrationSchema } from '../schemas/complete-registration.schema';
import { updateUserProfile } from '../services/server/user.service';
import { createStore } from '@/features/store/services/store.service';
import { setUserClaims, revokeUserTokens } from '../services/server/auth.service';
import { redirect } from 'next/navigation';

export async function completeRegistrationAction(
  formData: FormData
): Promise<ActionResponse<{ storeId: string }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }

  // 2. PARSE
  const rawData = {
    displayName: formData.get('displayName'),
    phone: formData.get('phone'),
    storeName: formData.get('storeName'),
    storeType: formData.get('storeType'),
    address: {
      street: formData.get('address.street'),
      city: formData.get('address.city'),
      state: formData.get('address.state'),
      zipCode: formData.get('address.zipCode'),
    },
  };

  // 3. VALIDATE
  const validation = completeRegistrationSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  const { displayName, phone, storeName, storeType, address } = validation.data;

  try {
    // 4. UPDATE USER PROFILE
    await updateUserProfile(session.userId, {
      displayName,
      phone,
    });

    // 5. CREATE STORE
    const store = await createStore({
      name: storeName,
      type: storeType,
      address,
      ownerId: session.userId,
    });

    // 6. SET CUSTOM CLAIMS
    await setUserClaims(session.userId, {
      storeId: store.id,
      role: 'owner',
    });

    // 7. REVOKE TOKENS (para que claims estén disponibles)
    await revokeUserTokens(session.userId);

    // 8. ⚠️ TEMPORAL: Actualizar storeIds en Firestore
    await addStoreToUser(session.userId, store.id);

    return { success: true, data: { storeId: store.id } };
  } catch (error) {
    return { success: false, errors: { _form: ['Error al completar registro'] } };
  }
}
5.4. Google Login Action
typescript
// features/auth/actions/auth.actions.ts
'use server';

import { cookies } from 'next/headers';
import { verifyIdToken } from '../services/server/auth.service';
import { getOrCreateUserFromGoogle } from '../services/server/user.service';
import { adminAuth } from '@/lib/firebase/admin';

export async function googleLoginAction(
  formData: FormData
): Promise<ActionResponse<{ userId: string; needsSetup: boolean }>> {
  // 1. PARSE
  const idToken = formData.get('idToken') as string;

  if (!idToken) {
    return { success: false, errors: { _form: ['Token no proporcionado'] } };
  }

  // 2. VERIFY
  try {
    const decodedToken = await verifyIdToken(idToken);
    const firebaseUser = await adminAuth.getUser(decodedToken.uid);

    // 3. GET OR CREATE USER
    const user = await getOrCreateUserFromGoogle(firebaseUser);

    // 4. SET COOKIE
    const cookieStore = await cookies();
    cookieStore.set('idToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60,
      path: '/',
    });

    // 5. CHECK IF NEEDS SETUP
    const needsSetup = !user.storeIds || user.storeIds.length === 0;

    return { 
      success: true, 
      data: { userId: user.id, needsSetup } 
    };
  } catch (error) {
    return { success: false, errors: { _form: ['Error en login con Google'] } };
  }
}
5.5. Logout Action
typescript
// features/auth/actions/auth.actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('idToken');
  
  redirect('/login');
}
6. Hybrid Helpers (Client → Server)
6.1. Hybrid Login
typescript
// features/auth/lib/hybrid-login.ts
'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { loginAction } from '../actions/auth.actions';

type HybridResponse<T = unknown> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export async function hybridLogin(
  email: string,
  password: string
): Promise<HybridResponse<{ userId: string }>> {
  try {
    // 1. CLIENT SDK: Autenticar
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Obtener ID Token
    const idToken = await userCredential.user.getIdToken();
    
    // 3. SERVER ACTION: Crear sesión
    const formData = new FormData();
    formData.append('idToken', idToken);
    
    const result = await loginAction(formData);
    
    return result;
  } catch (error: any) {
    if (error.code === 'auth/wrong-password') {
      return { success: false, errors: { password: ['Contraseña incorrecta'] } };
    }
    if (error.code === 'auth/user-not-found') {
      return { success: false, errors: { email: ['Usuario no encontrado'] } };
    }
    return { success: false, errors: { _form: ['Error al iniciar sesión'] } };
  }
}
6.2. Hybrid Register
typescript
// features/auth/lib/hybrid-login.ts
'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { registerAction, loginAction } from '../actions/auth.actions';

export async function hybridRegister(
  email: string,
  password: string,
  displayName: string,
  phone?: string
): Promise<HybridResponse<{ userId: string }>> {
  // 1. SERVER: Crear cuenta
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('displayName', displayName);
  if (phone) formData.append('phone', phone);
  
  const registerResult = await registerAction(formData);
  
  if (!registerResult.success) {
    return registerResult;
  }

  // 2. CLIENT: Auto-login
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // 3. SERVER: Crear sesión
    const loginFormData = new FormData();
    loginFormData.append('idToken', idToken);
    
    await loginAction(loginFormData);
    
    return registerResult;
  } catch (error) {
    return { success: false, errors: { _form: ['Error al autenticar'] } };
  }
}
6.3. Refresh Token (Custom Claims)
typescript
// features/auth/lib/hybrid-login.ts
'use client';

import { auth } from '@/lib/firebase/client';

export async function refreshCurrentToken(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user');
  
  // Force refresh para obtener nuevos claims
  await user.getIdToken(true);
}
7. Auth Provider (Token Sync)
typescript
// components/providers/auth-provider.tsx
'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { logoutAction } from '@/features/auth/actions/auth.actions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario logueado: sync token
        try {
          const idToken = await user.getIdToken();
          
          await fetch('/api/auth/sync-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        } catch (error) {
          console.error('[AuthProvider] Error syncing token:', error);
        }
      } else {
        // Usuario deslogueado: limpiar cookie
        try {
          await fetch('/api/auth/sync-token', { method: 'DELETE' });
        } catch (error) {
          console.error('[AuthProvider] Error clearing session:', error);
        }
      }
    });

    // Auto-refresh cada 30 min
    const refreshInterval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken(true); // force refresh
        
        await fetch('/api/auth/sync-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      }
    }, 30 * 60 * 1000); // 30 min

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  return <>{children}</>;
}
8. API Route (Token Sync)
typescript
// app/api/auth/sync-token/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/features/auth/services/server/auth.service';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Verificar token
    await verifyIdToken(idToken);

    // Setear cookie
    const cookieStore = await cookies();
    cookieStore.set('idToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('idToken');
  
  return NextResponse.json({ success: true });
}
9. Server Session Helper
typescript
// lib/auth/server-session.ts
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export interface ServerSession {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  storeId: string | null;      // Custom claim
  role: string | null;         // Custom claim
}

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('idToken')?.value;

    if (!idToken) return null;

    // Verificar token
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    
    // Obtener datos adicionales
    const user = await adminAuth.getUser(decodedToken.uid);

    return {
      userId: decodedToken.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified,
      storeId: (decodedToken.storeId as string) || null,
      role: (decodedToken.role as string) || null,
    };
  } catch (error) {
    console.error('[getServerSession] Error:', error);
    return null;
  }
}
10. Components
10.1. Login Form
typescript
// features/auth/components/LoginForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';
import { hybridLogin } from '../lib/hybrid-login';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    startTransition(async () => {
      const result = await hybridLogin(data.email, data.password);

      if (result.success) {
        toast.success('Sesión iniciada');
        router.push('/dashboard');
      } else {
        Object.entries(result.errors).forEach(([field, messages]) => {
          setError(field as keyof LoginFormData, { message: messages[0] });
        });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input 
          id="email"
          type="email"
          {...register('email')} 
          className="w-full"
        />
        {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input 
          id="password"
          type="password"
          {...register('password')} 
          className="w-full"
        />
        {errors.password && <span className="text-red-500">{errors.password.message}</span>}
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
10.2. Register Form
typescript
// features/auth/components/RegisterForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema, type RegisterFormData } from '../schemas/register.schema';
import { hybridRegister } from '../lib/hybrid-login';
import { toast } from 'sonner';

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const { register, handleSubmit, formState: { errors }, setError } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    startTransition(async () => {
      const result = await hybridRegister(
        data.email,
        data.password,
        data.displayName,
        data.phone
      );

      if (result.success) {
        toast.success('Cuenta creada');
        router.push('/auth/complete-profile');
      } else {
        Object.entries(result.errors).forEach(([field, messages]) => {
          setError(field as keyof RegisterFormData, { message: messages[0] });
        });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label>Nombre completo</label>
        <input {...register('displayName')} />
        {errors.displayName && <span className="text-red-500">{errors.displayName.message}</span>}
      </div>

      <div>
        <label>Email</label>
        <input type="email" {...register('email')} />
        {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      </div>

      <div>
        <label>Contraseña</label>
        <input type="password" {...register('password')} />
        {errors.password && <span className="text-red-500">{errors.password.message}</span>}
      </div>

      <div>
        <label>Teléfono (opcional)</label>
        <input placeholder="+541234567890" {...register('phone')} />
        {errors.phone && <span className="text-red-500">{errors.phone.message}</span>}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creando cuenta...' : 'Registrarse'}
      </button>
    </form>
  );
}
10.3. Google Button
typescript
// features/auth/components/GoogleButton.tsx
'use client';

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { googleLoginAction } from '../actions/auth.actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function GoogleButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const idToken = await result.user.getIdToken();
      
      const formData = new FormData();
      formData.append('idToken', idToken);
      
      const actionResult = await googleLoginAction(formData);

      if (actionResult.success) {
        if (actionResult.data.needsSetup) {
          router.push('/auth/complete-profile');
        } else {
          router.push('/dashboard');
        }
      } else {
        toast.error(actionResult.errors._form?.[0]);
      }
    } catch (error: any) {
      toast.error('Error al iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full border py-2 rounded flex items-center justify-center gap-2"
    >
      {isLoading ? 'Cargando...' : 'Continuar con Google'}
    </button>
  );
}
10.4. Logout Button
typescript
// features/auth/components/LogoutButton.tsx
'use client';

import { logoutAction } from '../actions/auth.actions';

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="text-red-600">
        Cerrar sesión
      </button>
    </form>
  );
}
11. Estructura de Carpetas (Auth Module)
text
src/
├── features/
│   └── auth/
│       ├── actions/
│       │   └── auth.actions.ts          # Server Actions
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   ├── RegisterForm.tsx
│       │   ├── GoogleButton.tsx
│       │   ├── LogoutButton.tsx
│       │   └── GoogleProfileSetup.tsx
│       ├── lib/
│       │   └── hybrid-login.ts          # Hybrid helpers
│       ├── schemas/
│       │   ├── login.schema.ts
│       │   ├── register.schema.ts
│       │   ├── user-profile.schema.ts
│       │   └── complete-registration.schema.ts
│       ├── services/
│       │   └── server/
│       │       ├── user.service.ts
│       │       └── auth.service.ts
│       └── types/
│           └── user.types.ts
│
├── components/
│   └── providers/
│       └── auth-provider.tsx            # Token sync provider
│
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── sync-token/
│   │           └── route.ts             # API route
│   ├── layout.tsx                       # AuthProvider wrapper
│   └── (auth)/
│       ├── login/
│       │   └── page.tsx
│       ├── register/
│       │   └── page.tsx
│       └── complete-profile/
│           └── page.tsx
│
└── lib/
    └── auth/
        └── server-session.ts            # Session helper
12. Tipos
typescript
// features/auth/types/user.types.ts
import { Timestamp } from 'firebase-admin/firestore';

export interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: 'owner' | 'admin' | 'employee';
  storeIds: string[];           // ⚠️ Eliminar después
  currentStoreId?: string;      // ⚠️ Eliminar después
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServerSession {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  storeId: string | null;       // Custom claim
  role: string | null;          // Custom claim
}
13. Migración de Custom Claims
13.1. Script de Migración
typescript
// scripts/migrate-to-custom-claims.ts
import { adminAuth, adminDb } from '@/lib/firebase/admin';

async function migrateUserToCustomClaims(userId: string) {
  // 1. Obtener usuario de Firestore
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData) {
    console.log(`User ${userId} not found in Firestore`);
    return;
  }

  // 2. Extraer storeId y role
  const storeId = userData.storeIds?.[0] || userData.currentStoreId;
  const role = userData.role || 'owner';

  if (!storeId) {
    console.log(`User ${userId} has no storeId, skipping`);
    return;
  }

  // 3. Setear custom claims
  await adminAuth.setCustomUserClaims(userId, {
    storeId,
    role,
  });

  console.log(`✅ User ${userId} migrated: storeId=${storeId}, role=${role}`);

  // 4. Revocar tokens
  await adminAuth.revokeRefreshTokens(userId);
  console.log(`✅ Tokens revoked for ${userId}`);
}

// Migrar todos
async function migrateAllUsers() {
  const usersSnapshot = await adminDb.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    await migrateUserToCustomClaims(doc.id);
  }

  console.log('✅ Migration complete');
}

migrateAllUsers();
13.2. Verificar Custom Claims
bash
# Firebase CLI
firebase auth:export users.json --project YOUR_PROJECT_ID

# Ver claims en el JSON exportado
14. Security Rules (Firestore)
javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Solo el usuario puede leer su propio documento
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Solo el usuario puede actualizar ciertos campos
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['displayName', 'phone', 'photoURL', 'updatedAt']);
    }
    
    // Stores collection
    match /stores/{storeId} {
      // Solo miembros de la tienda pueden leer
      allow read: if request.auth != null 
        && request.auth.token.storeId == storeId;
      
      // Solo owners pueden escribir
      allow write: if request.auth != null 
        && request.auth.token.storeId == storeId
        && request.auth.token.role == 'owner';
      
      // Products subcollection
      match /products/{productId} {
        allow read: if request.auth != null 
          && request.auth.token.storeId == storeId;
        
        allow write: if request.auth != null 
          && request.auth.token.storeId == storeId
          && request.auth.token.role in ['owner', 'admin'];
      }
    }
  }
}
15. Flujos de Autenticación
15.1. Flujo: Login Email/Password
text
1. Usuario ingresa email/password en LoginForm
2. LoginForm → hybridLogin(email, password)
3. hybridLogin:
   a. signInWithEmailAndPassword (Firebase Client SDK)
   b. user.getIdToken()
   c. loginAction(formData con idToken)
4. loginAction:
   a. verifyIdToken (Firebase Admin SDK)
   b. cookieStore.set('idToken', ...)
   c. return { success: true }
5. hybridLogin retorna success
6. LoginForm → router.push('/dashboard')
7. AuthProvider detecta onAuthStateChanged
8. AuthProvider → POST /api/auth/sync-token (redundante pero asegura sync)
15.2. Flujo: Register
text
1. Usuario completa RegisterForm
2. RegisterForm → hybridRegister(email, password, displayName, phone)
3. hybridRegister:
   a. registerAction(formData) → crea usuario en Auth + Firestore
   b. signInWithEmailAndPassword (auto-login)
   c. loginAction(formData con idToken) → crea sesión
4. RegisterForm → router.push('/auth/complete-profile')
5. Usuario completa perfil + tienda
6. completeRegistrationAction:
   a. Actualiza perfil
   b. Crea tienda
   c. setUserClaims({ storeId, role: 'owner' })
   d. revokeUserTokens() → fuerza refresh
7. Cliente → refreshCurrentToken() → obtiene nuevos claims
8. Router → '/dashboard'
15.3. Flujo: Google OAuth
text
1. Usuario hace clic en GoogleButton
2. GoogleButton → signInWithPopup(googleProvider)
3. Firebase Auth retorna UserCredential
4. GoogleButton → googleLoginAction(idToken)
5. googleLoginAction:
   a. verifyIdToken
   b. getOrCreateUserFromGoogle → crea en Firestore si no existe
   c. cookieStore.set('idToken', ...)
   d. return { success: true, needsSetup: !user.storeIds.length }
6. Si needsSetup → '/auth/complete-profile'
7. Si no → '/dashboard'
15.4. Flujo: Logout
text
1. Usuario hace clic en LogoutButton
2. LogoutButton → form action={logoutAction}
3. logoutAction:
   a. cookieStore.delete('idToken')
   b. redirect('/login')
4. AuthProvider detecta onAuthStateChanged(null)
5. AuthProvider → DELETE /api/auth/sync-token