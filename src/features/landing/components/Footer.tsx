/**
 * Footer para la landing page
 *
 * Pie de página con enlaces, información de contacto y redes sociales.
 * Solo se incluyen enlaces a páginas que existen.
 *
 * @module features/landing/components
 */

"use client";
import Link from "next/link";
import { FacebookIcon, Instagram, Mail, MapPin } from "lucide-react";

/**
 * Grupos de enlaces — solo rutas y anclas que existen realmente
 */
const footerLinks = [
  {
    title: "Producto",
    links: [
      { label: "Características", href: "#caracteristicas" },
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Menú QR", href: "#qr-menu" },
      { label: "Precios", href: "#precios" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "/terminos-condiciones" },
    ],
  },
];

/**
 * Redes sociales
 */
const socialLinks = [
  {
    icon: <FacebookIcon size={20} />,
    href: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://facebook.com/tutiendaweb",
    label: "Facebook",
  },
  {
    icon: <Instagram size={20} />,
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/tutiendaweb",
    label: "Instagram",
  },
];

/**
 * Componente principal del footer
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 relative">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
          {/* Columna de información */}
          <div>
            <div className="flex items-center mb-5">
              <Link href="/" className="text-white font-bold text-2xl">
                <span className="text-purple-500">Tu</span>TiendaWeb
              </Link>
            </div>

            <p className="mb-6">
              Plataforma 100% digital desarrollada en Argentina para
              emprendedores que quieren digitalizar su negocio.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <Mail size={18} className="mr-3 text-purple-500 flex-shrink-0" />
                <a
                  href="mailto:tutiendaweboficial@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  tutiendaweboficial@gmail.com
                </a>
              </div>

              <div className="flex items-start">
                <MapPin size={18} className="mr-3 text-purple-500 mt-1 flex-shrink-0" />
                <span>
                  Buenos Aires
                  <br />
                  Argentina 🇦🇷
                </span>
              </div>
            </div>
          </div>

          {/* Columnas de enlaces */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-semibold text-white mb-6">
                {group.title}
              </h3>
              <ul className="space-y-4">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Barra inferior */}
        <div className="border-t border-gray-800 py-8 flex flex-col md:flex-row justify-between items-center">
          <p className="mb-4 md:mb-0">
            © {currentYear} TuTiendaWeb. Todos los derechos reservados.
          </p>

          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
