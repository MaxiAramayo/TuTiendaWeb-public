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

  useEffect(() => {
    const target = preapprovalId
      ? `/dashboard/profile?section=subscription&preapproval_id=${encodeURIComponent(preapprovalId)}`
      : '/dashboard/profile?section=subscription';

    const countdown = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          router.replace(target);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [preapprovalId, router, seconds]);

  return (
    <p className="text-xs text-gray-400">
      Te redirigimos automáticamente en {remaining}s…
    </p>
  );
}
