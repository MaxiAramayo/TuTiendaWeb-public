'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AutoRedirectToSubscriptionProps {
  preapprovalId?: string;
  seconds?: number;
}

export default function AutoRedirectToSubscription({
  preapprovalId,
  seconds = 6,
}: AutoRedirectToSubscriptionProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  // Countdown visual: solo decrementa el contador (updater puro, sin efectos).
  useEffect(() => {
    const countdown = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  // Redirección: se dispara una sola vez al cumplir el tiempo, fuera del render.
  useEffect(() => {
    const target = preapprovalId
      ? `/dashboard/subscription?preapproval_id=${encodeURIComponent(preapprovalId)}`
      : '/dashboard/subscription';

    const timeout = setTimeout(() => {
      router.replace(target);
    }, seconds * 1000);

    return () => clearTimeout(timeout);
  }, [preapprovalId, router, seconds]);

  return (
    <p className="text-xs text-gray-400">
      Te redirigimos automáticamente en {remaining}s…
    </p>
  );
}
