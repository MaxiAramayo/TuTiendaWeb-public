/**
 * Barra de navegación principal
 * 
 * Componente de navegación responsivo con soporte para modo móvil
 * 
 * @module features/landing/components
 */

"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import CtaButton from './CtaButton';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';

/**
 * Enlaces principales de navegación
 */
const navLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#caracteristicas", label: "Características" },
  { href: "#qr-demo", label: "Menú QR" },
  { href: "#precios", label: "Precios" },
];

/**
 * Componente principal de navegación
 * 
 * @returns Componente React
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { user, isLoading } = useAuthClient();

  // Manejador para detectar scroll
  useEffect(() => {
    if (!isHomePage) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  // Función para cerrar el menú al hacer clic en un enlace
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Efecto para bloquear el scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white shadow-md py-2'
        : 'bg-transparent py-4'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center font-bold text-2xl text-gray-900"
          >
            <span className="text-purple-600">Tu</span>Tienda
          </Link>

          {/* Navegación - Escritorio */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${scrolled
                  ? 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                  : 'text-gray-800 hover:text-purple-700'
                  }`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Botones de acción - Escritorio */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              // Skeleton mientras carga
              <div className="flex items-center space-x-4">
                <div className="w-24 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-28 h-9 bg-purple-200 rounded-lg animate-pulse"></div>
              </div>
            ) : user ? (
              <CtaButton
                href="/dashboard"
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <User size={16} />
                Panel de control
              </CtaButton>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className={`text-sm font-medium ${scrolled ? 'text-gray-700 hover:text-purple-600' : 'text-gray-800 hover:text-purple-700'
                    }`}
                >
                  Iniciar sesión
                </Link>

                <CtaButton
                  href="/sign-up"
                  variant="primary"
                  size="sm"
                >
                  Crear cuenta
                </CtaButton>
              </>
            )}
          </div>

          {/* Botón de menú - Móvil */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 top-16 bg-white z-40 md:hidden overflow-y-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto px-4 py-6 flex flex-col min-h-full">
              <nav className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-4 text-lg font-medium border-b border-gray-100 text-gray-800 hover:text-purple-600"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto mb-8 flex flex-col space-y-4">
                {isLoading ? (
                  // Skeleton mientras carga
                  <div className="flex flex-col space-y-4">
                    <div className="w-full h-12 bg-gray-100 border border-gray-200 rounded-md animate-pulse"></div>
                    <div className="w-full h-12 bg-purple-200 rounded-md animate-pulse"></div>
                  </div>
                ) : user ? (
                  <Link
                    href="/dashboard"
                    className="w-full py-3 text-center text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2"
                    onClick={closeMenu}
                  >
                    <User size={16} />
                    Panel de control
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="w-full py-3 text-center text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                      onClick={closeMenu}
                    >
                      Iniciar sesión
                    </Link>

                    <Link
                      href="/sign-up"
                      className="w-full py-3 text-center text-white bg-purple-600 rounded-md hover:bg-purple-700"
                      onClick={closeMenu}
                    >
                      Crear cuenta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;