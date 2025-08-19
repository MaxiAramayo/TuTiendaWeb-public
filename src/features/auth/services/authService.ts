/**
 * Servicio de autenticación
 * 
 * @module features/auth/services/authService
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  UserCredential,
  getAdditionalUserInfo
} from 'firebase/auth';
import {
  Timestamp
} from 'firebase/firestore';

import { auth } from '@/lib/firebase/client';
import { User } from '@/features/user/user.types';
import { AuthCredentials, CreateUserData, GoogleAuthResult } from '@/features/auth/auth.types';
import { userService } from '@/features/user/services/userService';
import { handleAuthError } from '../utils/errorHandling';



/**
 * Servicio de autenticación
 */
class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  async signIn({ email, password }: AuthCredentials): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Iniciar sesión con Google
   */
  async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(userCredential);
      let isNewUser = additionalInfo?.isNewUser || false;

      // Verificar si el usuario ya existe en Firestore para evitar duplicados
       if (userCredential.user) {
         try {
           const existingUser = await userService.getUserData(userCredential.user.uid);
           if (existingUser) {
             // Usuario ya existe en Firestore
             isNewUser = false;
           } else if (isNewUser) {
             // Usuario nuevo confirmado, crear documento en Firestore
             await userService.createUserDocument(userCredential.user.uid, {
               id: userCredential.user.uid,
               email: userCredential.user.email || '',
               displayName: userCredential.user.displayName || '',
               role: 'owner',
               storeIds: [],
               createdAt: Timestamp.now(),
               updatedAt: Timestamp.now()
             });
           }
         } catch (userError) {
           // Si hay error al obtener el usuario, asumimos que es nuevo
           if (isNewUser) {
             await userService.createUserDocument(userCredential.user.uid, {
               id: userCredential.user.uid,
               email: userCredential.user.email || '',
               displayName: userCredential.user.displayName || '',
               role: 'owner',
               storeIds: [],
               createdAt: Timestamp.now(),
               updatedAt: Timestamp.now()
             });
           }
         }
       }

      return { userCredential, isNewUser };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Registrar nuevo usuario con email y contraseña
   */
  async signUp({ email, password, userData }: CreateUserData): Promise<string> {
    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Crear documento de usuario en Firestore
      const user: User = {
        id: uid,
        email,
        displayName: userData.displayName || email.split('@')[0],
        role: 'owner',
        storeIds: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Solo agregar preferences si está definido
      if (userData.preferences !== undefined) {
        user.preferences = userData.preferences;
      }

      await userService.createUserDocument(uid, user);
      return uid;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }



  /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }





  /**
   * Manejar errores de autenticación usando el sistema centralizado
   */
  private handleAuthError(error: any): Error {
    const errorInfo = handleAuthError(error, false); // No mostrar toast aquí
    const enhancedError = new Error(errorInfo.message);
    // Preservar el código de error original
    (enhancedError as any).code = error?.code || 'unknown';
    (enhancedError as any).field = errorInfo.field;
    return enhancedError;
  }
}

export const authService = new AuthService();
