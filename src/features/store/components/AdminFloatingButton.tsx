'use client';

import { Settings, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function AdminFloatingButton() {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-6 right-6 z-50 flex items-center"
    >
      <Link href="/dashboard" className="group flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-slate-800 transition-all hover:bg-slate-800 hover:scale-105 active:scale-95">
        <LayoutDashboard className="h-5 w-5" />
        <span>Ir al Panel</span>
      </Link>
    </motion.div>
  );
}
