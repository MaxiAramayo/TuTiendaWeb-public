import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableNetwork, 
  disableNetwork,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  doc,
  getDoc
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

/**
 * Configuración optimizada de Firebase con manejo de errores mejorado
 * y retry logic para evitar errores ERR_ABORTED
 */

// Validar que todas las variables de entorno estén presentes
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey!,
  authDomain: requiredEnvVars.authDomain!,
  projectId: requiredEnvVars.projectId!,
  storageBucket: requiredEnvVars.storageBucket!,
  appId: requiredEnvVars.appId!,
};

// Inicializar Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializar servicios con configuración optimizada
export const auth = getAuth(app);

// Configurar Firestore con settings optimizados para evitar ERR_ABORTED
let db: any;
try {
  // Intentar inicializar Firestore con configuración optimizada
  db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true, // Forzar long polling para evitar ERR_ABORTED
    ignoreUndefinedProperties: true, // Ignorar propiedades undefined
    experimentalAutoDetectLongPolling: false, // Desactivar auto-detección
  });
} catch (error) {
  // Si ya está inicializado, usar la instancia existente
  db = getFirestore(app);
}

export { db };
export const storage = getStorage(app);

/**
 * Conexión a los emuladores de Firebase (solo en desarrollo local).
 * Se activa con NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.
 * El guard global evita reconectar en cada HMR.
 */
if (
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
  !(globalThis as any).__FIREBASE_EMULATORS_CONNECTED__
) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    (globalThis as any).__FIREBASE_EMULATORS_CONNECTED__ = true;
    console.log('🔌 Firebase conectado a los emuladores locales');
  } catch (error) {
    console.warn('⚠️ No se pudo conectar a los emuladores de Firebase:', error);
  }
}

/**
 * Función para reconectar Firestore de forma segura usando el mutex
 */
export const reconnectFirestore = async (): Promise<void> => {
  await firestoreMutex.acquire();
  
  try {
    console.log('🔄 Iniciando reconexión de Firestore...');
    
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    await enableNetwork(db);
    
    console.log('✅ Firestore reconectado exitosamente');
  } catch (error: any) {
    console.error('❌ Error al reconectar Firestore:', error?.code || error?.message);
    throw error;
  } finally {
    firestoreMutex.release();
  }
};

/**
 * Función de retry para operaciones de Firestore con manejo mejorado de ERR_ABORTED
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2, // Reducir reintentos para evitar bloqueos
  delay: number = 500 // Reducir delay inicial
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Manejo específico para diferentes tipos de errores
      const isNetworkError = error?.code === 'unavailable' || 
                            error?.message?.includes('ERR_ABORTED') ||
                            error?.message?.includes('network') ||
                            error?.code === 'deadline-exceeded';
      
      if (isNetworkError) {
        console.warn(`🔄 Intento ${attempt}/${maxRetries} falló (${error?.code || 'network-error'}), reintentando...`);
        
        if (attempt < maxRetries) {
          // Delay exponencial pero más corto
          const backoffDelay = Math.min(delay * Math.pow(1.5, attempt - 1), 2000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      } else {
        // Si no es un error de conexión, no reintentar
        console.error('❌ Error no recuperable:', error?.code, error?.message);
        throw error;
      }
    }
  }
  
  console.error('❌ Todos los reintentos fallaron:', lastError?.message);
  throw lastError!;
};

/**
 * Estado global para controlar las operaciones de red de Firestore
 */
let isOptimizing = false;
let optimizationPromise: Promise<void> | null = null;

/**
 * Mutex para evitar llamadas concurrentes a disableNetwork/enableNetwork
 */
class FirestoreMutex {
  private isLocked = false;
  private queue: Array<() => void> = [];

  /**
   * Adquirir el lock para operaciones de red
   */
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isLocked) {
        this.isLocked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  /**
   * Liberar el lock y procesar la cola
   */
  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.isLocked = false;
    }
  }
}

const firestoreMutex = new FirestoreMutex();

/**
 * Función para verificar el estado de la conexión de Firestore de forma segura
 */
export const checkFirestoreConnection = async (): Promise<boolean> => {
  try {
    // Verificar conectividad sin usar enableNetwork para evitar conflictos
    // Usar una operación de lectura simple en su lugar
    const testDoc = doc(db, '__test__', 'connection');
    await getDoc(testDoc);
    return true;
  } catch (error: any) {
    // Si el error es de permisos, significa que la conexión funciona
    if (error?.code === 'permission-denied') {
      return true;
    }
    console.warn('⚠️ Problema de conectividad con Firestore:', error?.code || error?.message);
    return false;
  }
};

/**
 * Función para optimizar la configuración de Firestore de forma segura
 */
export const optimizeFirestoreSettings = async (): Promise<void> => {
  // Si ya se está optimizando, retornar la promesa existente
  if (isOptimizing && optimizationPromise) {
    console.log('🔄 Optimización de Firestore ya en progreso, esperando...');
    return optimizationPromise;
  }

  // Crear nueva promesa de optimización
  optimizationPromise = (async () => {
    await firestoreMutex.acquire();
    
    try {
      isOptimizing = true;
      console.log('🔧 Iniciando optimización de Firestore...');
      
      // Verificar conectividad de forma segura
      const isConnected = await checkFirestoreConnection();
      
      if (!isConnected) {
        console.log('🔧 Firestore desconectado, reiniciando conexión...');
        
        // Reiniciar conexión de forma controlada
        await disableNetwork(db);
        await new Promise(resolve => setTimeout(resolve, 200)); // Aumentar delay
        await enableNetwork(db);
        
        console.log('✅ Conexión de Firestore reiniciada');
      } else {
        console.log('✅ Firestore ya está conectado correctamente');
      }
    } catch (error: any) {
      console.warn('⚠️ Error durante optimización de Firestore:', error?.code || error?.message);
      
      // En caso de error, intentar solo enableNetwork para asegurar conectividad
      try {
        await enableNetwork(db);
      } catch (enableError) {
        console.warn('⚠️ No se pudo habilitar la red de Firestore:', enableError);
      }
    } finally {
      isOptimizing = false;
      optimizationPromise = null;
      firestoreMutex.release();
    }
  })();

  return optimizationPromise;
};

export default app;
