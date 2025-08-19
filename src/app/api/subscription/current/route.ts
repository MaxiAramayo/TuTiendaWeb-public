/**
 * API Route para obtener la suscripción actual del usuario
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Obtiene la suscripción actual del usuario
 * @param request - Request de Next.js
 * @returns Response con la suscripción actual o null
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // TODO: Implementar lógica real de base de datos
    // Por ahora retornamos null (sin suscripción)
    return NextResponse.json(null, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo suscripción actual:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}