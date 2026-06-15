/**
 * Helpers para tests de schemas Zod.
 *
 * `issueFor` extrae el mensaje de error asociado a un path concreto, para poder
 * afirmar mensajes literalmente (criterio de aceptación E).
 */
import type { z } from 'zod';

type AnyResult = z.SafeParseReturnType<unknown, unknown>;

/** Mensaje del primer issue cuyo path coincide exactamente (ej: 'password', 'delivery.address'). */
export function issueFor(result: AnyResult, path: string): string | undefined {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path.join('.') === path)?.message;
}

/** Todos los mensajes de error (sin importar path). Útil para refines a nivel objeto. */
export function allMessages(result: AnyResult): string[] {
  if (result.success) return [];
  return result.error.issues.map((i) => i.message);
}

/** Paths que fallaron, como strings 'a.b.c'. */
export function failedPaths(result: AnyResult): string[] {
  if (result.success) return [];
  return result.error.issues.map((i) => i.path.join('.'));
}
