/**
 * Complete Registration Schema - Registro completo (Multi-Step)
 * 
 * Combina userProfileSchema + storeSetupSchema
 * Usado en Server Action transaccional que crea:
 * 1. Perfil de usuario
 * 2. Tienda
 * 3. Custom claims (storeId, role)
 * 
 * @module features/auth/schemas/complete-registration.schema
 */

import { z } from 'zod';
import { userProfileSchema } from './user-profile.schema';
import { storeSetupSchema } from './store-setup.schema';

// ============================================================================
// SCHEMA
// ============================================================================

/**
 * Schema combinado usando .merge()
 * 
 * Resultado:
 * {
 *   displayName: string,
 *   phone?: string,
 *   photoURL?: string,
 *   storeName: string,
 *   storeType: 'restaurant' | 'retail' | 'services' | 'other',
 *   address?: string
 * }
 */
export const completeRegistrationSchema = userProfileSchema.merge(storeSetupSchema);

// ============================================================================
// TYPES
// ============================================================================

export type CompleteRegistrationData = z.infer<typeof completeRegistrationSchema>;
