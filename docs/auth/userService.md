# UserService - Servicio de Gestión de Usuarios

## Descripción

El `UserService` es un servicio singleton que maneja todas las operaciones relacionadas con usuarios en Firestore. Proporciona una interfaz unificada para crear, leer, actualizar y gestionar datos de usuarios y sus tiendas asociadas.

## Ubicación

```
src/features/auth/services/userService.ts
```

## Arquitectura

### Patrón Singleton

```typescript
class UserService {
  private static instance: UserService;
  
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }
  
  private constructor() {
    // Constructor privado para singleton
  }
}

export const userService = UserService.getInstance();
```

### Dependencias

- **Firestore**: Base de datos principal
- **Firebase Auth**: Para obtener usuario actual
- **Tipos TypeScript**: Interfaces de usuario y tienda

## Interfaces y Tipos

### UserData
```typescript
interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stores?: string[]; // Array de IDs de tiendas
  currentStore?: string; // ID de tienda activa
  preferences?: UserPreferences;
  profile?: UserProfile;
}
```

### UserProfile
```typescript
interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Address;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  language?: string;
  timezone?: string;
}
```

### UserPreferences
```typescript
interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: NotificationSettings;
  privacy?: PrivacySettings;
  dashboard?: DashboardSettings;
}
```

### StoreData
```typescript
interface StoreData {
  id: string;
  name: string;
  description?: string;
  category: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings?: StoreSettings;
  status: 'active' | 'inactive' | 'suspended';
}
```

## Métodos Principales

### getUserData(uid: string): Promise<UserData | null>

Obtiene los datos completos de un usuario por su UID.

```typescript
async getUserData(uid: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    return {
      uid: userDoc.id,
      ...data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    } as UserData;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw new Error('Failed to get user data');
  }
}
```

**Parámetros:**
- `uid`: ID único del usuario

**Retorno:**
- `UserData | null`: Datos del usuario o null si no existe

**Uso:**
```typescript
const userData = await userService.getUserData('user-123');
if (userData) {
  console.log('Usuario encontrado:', userData.displayName);
}
```

### createUserDocument(userData: Partial<UserData>): Promise<void>

Crea un nuevo documento de usuario en Firestore.

```typescript
async createUserDocument(userData: Partial<UserData>): Promise<void> {
  try {
    if (!userData.uid) {
      throw new Error('UID is required to create user document');
    }
    
    const now = Timestamp.now();
    const userDocData = {
      email: userData.email || '',
      displayName: userData.displayName || '',
      photoURL: userData.photoURL || null,
      createdAt: now,
      updatedAt: now,
      stores: [],
      currentStore: null,
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          marketing: false
        }
      },
      ...userData
    };
    
    await setDoc(doc(db, 'users', userData.uid), userDocData);
    
    console.log('User document created successfully');
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error('Failed to create user document');
  }
}
```

**Parámetros:**
- `userData`: Datos parciales del usuario (uid requerido)

**Uso:**
```typescript
await userService.createUserDocument({
  uid: 'user-123',
  email: 'user@example.com',
  displayName: 'John Doe'
});
```

### updateUserData(uid: string, updates: Partial<UserData>): Promise<void>

Actualiza los datos de un usuario existente.

```typescript
async updateUserData(uid: string, updates: Partial<UserData>): Promise<void> {
  try {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    // Remover campos que no deben actualizarse
    delete updateData.uid;
    delete updateData.createdAt;
    
    await updateDoc(doc(db, 'users', uid), updateData);
    
    console.log('User data updated successfully');
  } catch (error) {
    console.error('Error updating user data:', error);
    throw new Error('Failed to update user data');
  }
}
```

**Parámetros:**
- `uid`: ID del usuario
- `updates`: Campos a actualizar

**Uso:**
```typescript
await userService.updateUserData('user-123', {
  displayName: 'John Smith',
  profile: {
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1234567890'
  }
});
```

### getUserStores(uid: string): Promise<StoreData[]>

Obtiene todas las tiendas asociadas a un usuario.

```typescript
async getUserStores(uid: string): Promise<StoreData[]> {
  try {
    const storesQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    const storesSnapshot = await getDocs(storesQuery);
    
    return storesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StoreData[];
  } catch (error) {
    console.error('Error getting user stores:', error);
    throw new Error('Failed to get user stores');
  }
}
```

**Parámetros:**
- `uid`: ID del usuario

**Retorno:**
- `StoreData[]`: Array de tiendas del usuario

**Uso:**
```typescript
const stores = await userService.getUserStores('user-123');
console.log(`Usuario tiene ${stores.length} tiendas`);
```

### checkStoreNameAvailability(name: string, excludeStoreId?: string): Promise<boolean>

Verifica si un nombre de tienda está disponible.

```typescript
async checkStoreNameAvailability(name: string, excludeStoreId?: string): Promise<boolean> {
  try {
    const normalizedName = name.toLowerCase().trim();
    
    let storeQuery = query(
      collection(db, 'stores'),
      where('name', '==', normalizedName)
    );
    
    const storesSnapshot = await getDocs(storeQuery);
    
    // Si se proporciona excludeStoreId, ignorar esa tienda
    if (excludeStoreId) {
      const filteredDocs = storesSnapshot.docs.filter(
        doc => doc.id !== excludeStoreId
      );
      return filteredDocs.length === 0;
    }
    
    return storesSnapshot.empty;
  } catch (error) {
    console.error('Error checking store name availability:', error);
    throw new Error('Failed to check store name availability');
  }
}
```

**Parámetros:**
- `name`: Nombre de tienda a verificar
- `excludeStoreId`: ID de tienda a excluir de la verificación (opcional)

**Retorno:**
- `boolean`: true si está disponible, false si ya existe

**Uso:**
```typescript
const isAvailable = await userService.checkStoreNameAvailability('Mi Tienda');
if (isAvailable) {
  console.log('Nombre disponible');
} else {
  console.log('Nombre ya en uso');
}
```

### createNewStore(storeData: Omit<StoreData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>

Crea una nueva tienda y la asocia al usuario.

```typescript
async createNewStore(storeData: Omit<StoreData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    // Verificar disponibilidad del nombre
    const isNameAvailable = await this.checkStoreNameAvailability(storeData.name);
    if (!isNameAvailable) {
      throw new Error('Store name is already taken');
    }
    
    const now = Timestamp.now();
    const newStoreData = {
      ...storeData,
      name: storeData.name.toLowerCase().trim(),
      createdAt: now,
      updatedAt: now,
      status: 'active' as const,
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        language: 'es',
        ...storeData.settings
      }
    };
    
    // Crear documento de tienda
    const storeRef = await addDoc(collection(db, 'stores'), newStoreData);
    
    // Actualizar usuario con nueva tienda
    await this.addStoreToUser(storeData.ownerId, storeRef.id);
    
    console.log('New store created successfully:', storeRef.id);
    return storeRef.id;
  } catch (error) {
    console.error('Error creating new store:', error);
    throw new Error('Failed to create new store');
  }
}
```

**Parámetros:**
- `storeData`: Datos de la tienda (sin id, createdAt, updatedAt)

**Retorno:**
- `string`: ID de la nueva tienda creada

**Uso:**
```typescript
const storeId = await userService.createNewStore({
  name: 'Mi Nueva Tienda',
  description: 'Descripción de mi tienda',
  category: 'retail',
  ownerId: 'user-123'
});
console.log('Tienda creada con ID:', storeId);
```

### addStoreToUser(uid: string, storeId: string): Promise<void>

Asocia una tienda existente a un usuario.

```typescript
async addStoreToUser(uid: string, storeId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const userData = await this.getUserData(uid);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    const currentStores = userData.stores || [];
    
    // Evitar duplicados
    if (!currentStores.includes(storeId)) {
      const updatedStores = [...currentStores, storeId];
      
      await updateDoc(userRef, {
        stores: updatedStores,
        currentStore: userData.currentStore || storeId, // Establecer como actual si es la primera
        updatedAt: Timestamp.now()
      });
    }
    
    console.log('Store added to user successfully');
  } catch (error) {
    console.error('Error adding store to user:', error);
    throw new Error('Failed to add store to user');
  }
}
```

**Parámetros:**
- `uid`: ID del usuario
- `storeId`: ID de la tienda

**Uso:**
```typescript
await userService.addStoreToUser('user-123', 'store-456');
```

### setCurrentStore(uid: string, storeId: string): Promise<void>

Establece la tienda activa para un usuario.

```typescript
async setCurrentStore(uid: string, storeId: string): Promise<void> {
  try {
    const userData = await this.getUserData(uid);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    if (!userData.stores?.includes(storeId)) {
      throw new Error('Store does not belong to user');
    }
    
    await updateDoc(doc(db, 'users', uid), {
      currentStore: storeId,
      updatedAt: Timestamp.now()
    });
    
    console.log('Current store updated successfully');
  } catch (error) {
    console.error('Error setting current store:', error);
    throw new Error('Failed to set current store');
  }
}
```

**Parámetros:**
- `uid`: ID del usuario
- `storeId`: ID de la tienda a establecer como actual

**Uso:**
```typescript
await userService.setCurrentStore('user-123', 'store-456');
```

### removeStoreFromUser(uid: string, storeId: string): Promise<void>

Remueve la asociación de una tienda con un usuario.

```typescript
async removeStoreFromUser(uid: string, storeId: string): Promise<void> {
  try {
    const userData = await this.getUserData(uid);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    const currentStores = userData.stores || [];
    const updatedStores = currentStores.filter(id => id !== storeId);
    
    const updateData: any = {
      stores: updatedStores,
      updatedAt: Timestamp.now()
    };
    
    // Si la tienda removida era la actual, establecer nueva tienda actual
    if (userData.currentStore === storeId) {
      updateData.currentStore = updatedStores.length > 0 ? updatedStores[0] : null;
    }
    
    await updateDoc(doc(db, 'users', uid), updateData);
    
    console.log('Store removed from user successfully');
  } catch (error) {
    console.error('Error removing store from user:', error);
    throw new Error('Failed to remove store from user');
  }
}
```

**Parámetros:**
- `uid`: ID del usuario
- `storeId`: ID de la tienda a remover

**Uso:**
```typescript
await userService.removeStoreFromUser('user-123', 'store-456');
```

### updateUserPreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void>

Actualiza las preferencias del usuario.

```typescript
async updateUserPreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
  try {
    const userData = await this.getUserData(uid);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    const updatedPreferences = {
      ...userData.preferences,
      ...preferences
    };
    
    await updateDoc(doc(db, 'users', uid), {
      preferences: updatedPreferences,
      updatedAt: Timestamp.now()
    });
    
    console.log('User preferences updated successfully');
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new Error('Failed to update user preferences');
  }
}
```

**Parámetros:**
- `uid`: ID del usuario
- `preferences`: Preferencias a actualizar

**Uso:**
```typescript
await userService.updateUserPreferences('user-123', {
  theme: 'dark',
  notifications: {
    email: false,
    push: true,
    marketing: false
  }
});
```

### deleteUser(uid: string): Promise<void>

Elimina completamente un usuario y sus datos asociados.

```typescript
async deleteUser(uid: string): Promise<void> {
  try {
    // Obtener tiendas del usuario
    const userStores = await this.getUserStores(uid);
    
    // Eliminar todas las tiendas del usuario
    const deleteStorePromises = userStores.map(store => 
      deleteDoc(doc(db, 'stores', store.id))
    );
    
    await Promise.all(deleteStorePromises);
    
    // Eliminar documento del usuario
    await deleteDoc(doc(db, 'users', uid));
    
    console.log('User and associated data deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}
```

**Parámetros:**
- `uid`: ID del usuario a eliminar

**Uso:**
```typescript
// ⚠️ Operación destructiva - usar con precaución
await userService.deleteUser('user-123');
```

## Métodos de Utilidad

### validateUserData(userData: Partial<UserData>): ValidationResult

Valida los datos de usuario antes de operaciones.

```typescript
validateUserData(userData: Partial<UserData>): ValidationResult {
  const errors: string[] = [];
  
  if (userData.email && !this.isValidEmail(userData.email)) {
    errors.push('Invalid email format');
  }
  
  if (userData.displayName && userData.displayName.length < 2) {
    errors.push('Display name must be at least 2 characters');
  }
  
  if (userData.profile?.phone && !this.isValidPhone(userData.profile.phone)) {
    errors.push('Invalid phone number format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

private isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

private isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
```

### sanitizeUserData(userData: Partial<UserData>): Partial<UserData>

Sanitiza los datos de entrada.

```typescript
sanitizeUserData(userData: Partial<UserData>): Partial<UserData> {
  const sanitized = { ...userData };
  
  if (sanitized.email) {
    sanitized.email = sanitized.email.toLowerCase().trim();
  }
  
  if (sanitized.displayName) {
    sanitized.displayName = sanitized.displayName.trim();
  }
  
  if (sanitized.profile?.firstName) {
    sanitized.profile.firstName = sanitized.profile.firstName.trim();
  }
  
  if (sanitized.profile?.lastName) {
    sanitized.profile.lastName = sanitized.profile.lastName.trim();
  }
  
  return sanitized;
}
```

## Patrones de Uso

### Creación de Usuario Completo

```typescript
const createCompleteUser = async (authUser: User, additionalData: any) => {
  try {
    // 1. Crear documento base
    await userService.createUserDocument({
      uid: authUser.uid,
      email: authUser.email!,
      displayName: authUser.displayName || '',
      photoURL: authUser.photoURL
    });
    
    // 2. Actualizar con datos adicionales
    if (additionalData.profile) {
      await userService.updateUserData(authUser.uid, {
        profile: additionalData.profile
      });
    }
    
    // 3. Crear tienda si se proporciona
    if (additionalData.store) {
      const storeId = await userService.createNewStore({
        ...additionalData.store,
        ownerId: authUser.uid
      });
      
      console.log('Usuario y tienda creados exitosamente');
    }
    
  } catch (error) {
    console.error('Error creating complete user:', error);
    throw error;
  }
};
```

### Gestión de Múltiples Tiendas

```typescript
const manageUserStores = async (uid: string) => {
  try {
    // Obtener tiendas actuales
    const stores = await userService.getUserStores(uid);
    
    // Crear nueva tienda
    const newStoreId = await userService.createNewStore({
      name: 'Nueva Tienda',
      category: 'retail',
      ownerId: uid
    });
    
    // Establecer como tienda actual
    await userService.setCurrentStore(uid, newStoreId);
    
    // Obtener datos actualizados
    const updatedUser = await userService.getUserData(uid);
    
    return {
      totalStores: stores.length + 1,
      currentStore: updatedUser?.currentStore,
      newStoreId
    };
    
  } catch (error) {
    console.error('Error managing user stores:', error);
    throw error;
  }
};
```

### Actualización de Perfil

```typescript
const updateUserProfile = async (uid: string, profileData: any) => {
  try {
    // Validar datos
    const validation = userService.validateUserData({ profile: profileData });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Sanitizar datos
    const sanitizedData = userService.sanitizeUserData({ profile: profileData });
    
    // Actualizar perfil
    await userService.updateUserData(uid, sanitizedData);
    
    // Obtener datos actualizados
    const updatedUser = await userService.getUserData(uid);
    
    return updatedUser;
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
```

## Integración con Hooks

### useUserData Hook

```typescript
const useUserData = (uid: string | null) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!uid) {
      setUserData(null);
      setLoading(false);
      return;
    }
    
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await userService.getUserData(uid);
        setUserData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [uid]);
  
  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!uid) return;
    
    try {
      await userService.updateUserData(uid, updates);
      // Refetch data
      const updatedData = await userService.getUserData(uid);
      setUserData(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }, [uid]);
  
  return {
    userData,
    loading,
    error,
    updateUser
  };
};
```

### useUserStores Hook

```typescript
const useUserStores = (uid: string | null) => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!uid) {
      setStores([]);
      setLoading(false);
      return;
    }
    
    const fetchStores = async () => {
      try {
        setLoading(true);
        const userStores = await userService.getUserStores(uid);
        setStores(userStores);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stores');
        setStores([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStores();
  }, [uid]);
  
  const createStore = useCallback(async (storeData: Omit<StoreData, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => {
    if (!uid) return null;
    
    try {
      const storeId = await userService.createNewStore({
        ...storeData,
        ownerId: uid
      });
      
      // Refetch stores
      const updatedStores = await userService.getUserStores(uid);
      setStores(updatedStores);
      
      return storeId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store');
      return null;
    }
  }, [uid]);
  
  return {
    stores,
    loading,
    error,
    createStore
  };
};
```

## Testing

### Unit Tests

```typescript
import { userService } from './userService';
import { db } from '@/lib/firebase';

// Mock Firestore
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn()
  }
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserData', () => {
    it('should return user data when user exists', async () => {
      const mockUserData = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      const mockDoc = {
        exists: () => true,
        id: 'test-uid',
        data: () => mockUserData
      };
      
      (db.getDoc as jest.Mock).mockResolvedValue(mockDoc);
      
      const result = await userService.getUserData('test-uid');
      
      expect(result).toEqual(expect.objectContaining(mockUserData));
    });

    it('should return null when user does not exist', async () => {
      const mockDoc = {
        exists: () => false
      };
      
      (db.getDoc as jest.Mock).mockResolvedValue(mockDoc);
      
      const result = await userService.getUserData('non-existent-uid');
      
      expect(result).toBeNull();
    });

    it('should throw error when Firestore operation fails', async () => {
      (db.getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));
      
      await expect(userService.getUserData('test-uid')).rejects.toThrow('Failed to get user data');
    });
  });

  describe('createUserDocument', () => {
    it('should create user document with required fields', async () => {
      const userData = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      (db.setDoc as jest.Mock).mockResolvedValue(undefined);
      
      await userService.createUserDocument(userData);
      
      expect(db.setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          email: userData.email,
          displayName: userData.displayName,
          stores: [],
          currentStore: null
        })
      );
    });

    it('should throw error when uid is missing', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      await expect(userService.createUserDocument(userData)).rejects.toThrow('UID is required');
    });
  });

  describe('checkStoreNameAvailability', () => {
    it('should return true when store name is available', async () => {
      const mockSnapshot = {
        empty: true,
        docs: []
      };
      
      (db.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      
      const result = await userService.checkStoreNameAvailability('Available Store');
      
      expect(result).toBe(true);
    });

    it('should return false when store name is taken', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [{ id: 'existing-store' }]
      };
      
      (db.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      
      const result = await userService.checkStoreNameAvailability('Taken Store');
      
      expect(result).toBe(false);
    });

    it('should exclude specified store from availability check', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [{ id: 'store-to-exclude' }]
      };
      
      (db.getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      
      const result = await userService.checkStoreNameAvailability('Store Name', 'store-to-exclude');
      
      expect(result).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
describe('UserService Integration', () => {
  it('should create user and store in sequence', async () => {
    const uid = 'integration-test-uid';
    
    // Create user
    await userService.createUserDocument({
      uid,
      email: 'integration@test.com',
      displayName: 'Integration Test User'
    });
    
    // Create store
    const storeId = await userService.createNewStore({
      name: 'Integration Test Store',
      category: 'test',
      ownerId: uid
    });
    
    // Verify user has store
    const userData = await userService.getUserData(uid);
    expect(userData?.stores).toContain(storeId);
    expect(userData?.currentStore).toBe(storeId);
    
    // Verify store exists
    const stores = await userService.getUserStores(uid);
    expect(stores).toHaveLength(1);
    expect(stores[0].id).toBe(storeId);
  });
});
```

## Mejores Prácticas

### 1. Manejo de Errores
```typescript
// ✅ Bueno: Manejo específico de errores
try {
  const userData = await userService.getUserData(uid);
  if (!userData) {
    throw new Error('User not found');
  }
  return userData;
} catch (error) {
  if (error.code === 'permission-denied') {
    throw new Error('Access denied');
  }
  throw error;
}

// ❌ Malo: Ignorar errores
const userData = await userService.getUserData(uid).catch(() => null);
```

### 2. Validación de Datos
```typescript
// ✅ Bueno: Validar antes de operaciones
const validation = userService.validateUserData(userData);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// ❌ Malo: No validar datos de entrada
await userService.updateUserData(uid, userData); // Puede fallar
```

### 3. Operaciones Atómicas
```typescript
// ✅ Bueno: Usar transacciones para operaciones relacionadas
const batch = writeBatch(db);
batch.set(doc(db, 'users', uid), userData);
batch.set(doc(db, 'stores', storeId), storeData);
await batch.commit();

// ❌ Malo: Operaciones separadas que pueden fallar parcialmente
await userService.createUserDocument(userData);
await userService.createNewStore(storeData); // Puede fallar dejando usuario sin tienda
```

### 4. Caching y Performance
```typescript
// ✅ Bueno: Cache de datos frecuentemente accedidos
const userCache = new Map<string, UserData>();

const getCachedUserData = async (uid: string) => {
  if (userCache.has(uid)) {
    return userCache.get(uid)!;
  }
  
  const userData = await userService.getUserData(uid);
  if (userData) {
    userCache.set(uid, userData);
  }
  
  return userData;
};
```

## Troubleshooting

### Problemas Comunes

#### Usuario no encontrado
**Síntoma**: `getUserData` retorna `null`
**Soluciones**:
- Verificar que el UID sea correcto
- Confirmar que el documento existe en Firestore
- Revisar reglas de seguridad de Firestore

#### Error de permisos
**Síntoma**: `permission-denied` en operaciones
**Soluciones**:
- Verificar autenticación del usuario
- Revisar reglas de seguridad
- Confirmar que el usuario tiene acceso al documento

#### Nombres de tienda duplicados
**Síntoma**: Error al crear tienda con nombre existente
**Soluciones**:
- Usar `checkStoreNameAvailability` antes de crear
- Implementar manejo de conflictos
- Sugerir nombres alternativos

#### Datos inconsistentes
**Síntoma**: Usuario tiene tiendas que no existen
**Soluciones**:
- Implementar validación de integridad
- Limpiar referencias huérfanas
- Usar transacciones para operaciones relacionadas

## Mejoras Futuras

1. **Caching avanzado** con invalidación inteligente
2. **Búsqueda de usuarios** con índices optimizados
3. **Backup automático** de datos críticos
4. **Métricas de uso** y analytics
5. **Migración de datos** para cambios de esquema
6. **Compresión de datos** para optimizar almacenamiento
7. **Replicación** para alta disponibilidad
8. **Auditoría** de cambios en datos de usuario