/**
 * NotificationBell — Campana de notificaciones del dashboard
 *
 * Escucha en tiempo real la subcolección /stores/{storeId}/notifications
 * y muestra un contador de no leídas. Al hacer click despliega un popover
 * con las últimas notificaciones y permite marcarlas como leídas.
 *
 * @module features/dashboard/components
 */

'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useProfileStore } from '@/features/dashboard/modules/store-settings/stores/profile.store';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCheck, CreditCard, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

type NotificationType =
  | 'payment_failed'
  | 'payment_success'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'subscription_reactivated'
  | 'trial_expired'
  | 'trial_started';

interface StoreNotification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'payment_success':
    case 'trial_started':
      return <CreditCard className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />;
    case 'payment_failed':
    case 'subscription_expired':
    case 'trial_expired':
      return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />;
    case 'subscription_cancelled':
    case 'subscription_reactivated':
      return <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />;
    default:
      return <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />;
  }
}

function formatRelativeTime(ts: Timestamp | null): string {
  if (!ts) return '';
  const diffMs = Date.now() - ts.toMillis();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD} d`;
}

// ─── Componente ────────────────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 20;

export function NotificationBell() {
  const storeId = useProfileStore((state) => state.profile?.id);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Escucha en tiempo real
  useEffect(() => {
    if (!storeId) return;

    const q = query(
      collection(db, 'stores', storeId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(MAX_NOTIFICATIONS)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: StoreNotification[] = snap.docs.map((d) => ({
          id: d.id,
          type: d.data().type as NotificationType,
          message: d.data().message as string,
          read: d.data().read as boolean,
          createdAt: d.data().createdAt as Timestamp | null,
        }));
        setNotifications(items);
      },
      (error) => {
        console.warn('[NotificationBell] Error escuchando notificaciones:', error);
      }
    );

    return () => unsub();
  }, [storeId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /** Marca todas las notificaciones no leídas como leídas */
  const handleMarkAllRead = useCallback(() => {
    if (!storeId) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    startTransition(async () => {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, 'stores', storeId, 'notifications', n.id), {
          read: true,
        });
      });
      await batch.commit();
    });
  }, [storeId, notifications]);

  // Marcar como leídas al abrir el popover
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      handleMarkAllRead();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative w-8 h-8 p-0"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas leídas
            </button>
          )}
        </div>

        {/* Lista */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <ul className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 text-sm transition-colors',
                    !n.read && 'bg-blue-50/50'
                  )}
                >
                  {getNotificationIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-gray-800 leading-snug', !n.read && 'font-medium')}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
