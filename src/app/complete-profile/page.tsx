/**
 * Página para completar el perfil después del registro con Google
 * 
 * @module app/complete-profile
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Onboarding | TuTienda',
  description: 'Completa la configuracion guiada de tu tienda',
};

/**
 * Página para completar el perfil después del registro con Google
 */
export default function CompleteProfilePage() {
  redirect('/onboarding');
}
