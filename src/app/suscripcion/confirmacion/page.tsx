/**
 * Página pública de confirmación de suscripción
 *
 * MercadoPago redirige aquí luego de que el usuario completa (o abandona) el
 * flujo de pago. No requiere autenticación — el usuario puede venir desde una
 * pestaña diferente o sin cookie de sesión activa.
 *
 * El estado real de la suscripción se actualiza via webhook en forma asíncrona.
 * Esta página solo muestra un mensaje genérico de confirmación.
 *
 * Query params que puede enviar MP:
 *   ?preapproval_id=<id>   — ID del PreApproval creado
 *   ?status=<status>       — estado reportado por MP (no confiable, usar webhook)
 */

import Link from 'next/link';
import { CheckCircle2, Clock, ArrowRight, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PageProps {
  searchParams: Promise<{ preapproval_id?: string; status?: string }>;
}

export const metadata = {
  title: 'Confirmación de suscripción — TuTiendaWeb',
  description: 'Tu suscripción al plan Profesional fue procesada.',
};

export default async function SubscriptionConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { preapproval_id: preapprovalId, status } = params;

  // Si MP reporta "authorized" directamente podemos mostrar un mensaje más específico,
  // pero igualmente el estado real viene del webhook — no confiar ciegamente.
  const likelyApproved = status === 'authorized';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / marca */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-purple-600" />
            <span className="text-lg font-bold text-gray-900">TuTiendaWeb</span>
          </div>
        </div>

        {/* Card principal */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-8 pb-8 px-6 text-center space-y-5">
            {likelyApproved ? (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    ¡Suscripción activada!
                  </h1>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                    Tu plan Profesional fue aprobado. En unos instantes verás tu
                    estado actualizado en el panel.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Pago en proceso
                  </h1>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                    Tu suscripción al plan Profesional está siendo confirmada por
                    MercadoPago. Esto puede demorar unos minutos.
                  </p>
                </div>
              </>
            )}

            {preapprovalId && (
              <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded px-3 py-1.5 break-all">
                Ref: {preapprovalId}
              </p>
            )}

            <div className="pt-2 space-y-3">
              <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                <Link href="/dashboard/profile?section=subscription">
                  Ver estado de mi suscripción
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full text-gray-500">
                <Link href="/dashboard">
                  Ir al panel
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Si tenés dudas sobre tu suscripción, contactanos por WhatsApp.
        </p>
      </div>
    </div>
  );
}
