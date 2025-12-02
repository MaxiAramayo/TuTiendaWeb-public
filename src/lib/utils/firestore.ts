/**
 * Firestore Utilities
 * 
 * Helpers para trabajar con Firestore y prevenir errores comunes
 * 
 * @module lib/utils/firestore
 */

// ============================================================================
// CLEAN FOR FIRESTORE
// ============================================================================

/**
 * Limpia objeto removiendo valores undefined
 * 
 * Firestore no acepta undefined en documentos.
 * Esta función filtra undefined antes de .set() o .update()
 * 
 * Valores permitidos:
 * - null ✅ (se guarda como null en Firestore)
 * - undefined ❌ (se remueve)
 * - '' ✅ (string vacío se guarda)
 * - 0 ✅ (número cero se guarda)
 * - false ✅ (booleano false se guarda)
 * 
 * @param obj - Objeto a limpiar
 * @returns Objeto sin undefined values
 * 
 * @example
 * ```typescript
 * const data = {
 *   name: 'John',
 *   phone: undefined,
 *   age: 0,
 *   active: false,
 *   notes: null
 * };
 * 
 * const clean = cleanForFirestore(data);
 * // { name: 'John', age: 0, active: false, notes: null }
 * // phone fue removido
 * ```
 */
export function cleanForFirestore<T extends Record<string, any>>(
    obj: T
): Partial<T> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key as keyof T] = value;
        }
        return acc;
    }, {} as Partial<T>);
}

// ============================================================================
// FUTURE UTILITIES (placeholder)
// ============================================================================

/**
 * Convierte Firestore Timestamp a Date
 * (Implementar cuando se necesite)
 */
// export function timestampToDate(timestamp: admin.firestore.Timestamp): Date {
//   return timestamp.toDate();
// }
