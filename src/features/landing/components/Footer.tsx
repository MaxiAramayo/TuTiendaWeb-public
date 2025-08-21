/**
 * Footer para la landing page
 * 
 * Pie de página con enlaces, información de contacto y redes sociales
 * 
 * @module features/landing/components
 */

"use client";
import Link from 'next/link';
import { 
  FacebookIcon, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin
} from 'lucide-react';


/**
 * Grupos de enlaces para el footer
 */
const footerLinks = [
  {
    title: "Producto",
    links: [
      { label: "Características", href: "#caracteristicas" },
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Menú QR", href: "#qr-menu" },
      { label: "Precios", href: "#precios" },
    ]
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "/nosotros" },
      { label: "Clientes", href: "#testimonios" },
      { label: "Blog", href: "/blog" },
      { label: "Contacto", href: "/contacto" },
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "/terminos" },
      { label: "Política de privacidad", href: "/privacidad" },
      { label: "Política de cookies", href: "/cookies" },
    ]
  }
];

/**
 * Redes sociales
 */
const socialLinks = [
  { 
    icon: <FacebookIcon size={20} />, 
    href: "https://facebook.com/tutienda", 
    label: "Facebook" 
  },
  { 
    icon: <Twitter size={20} />, 
    href: "https://twitter.com/tutienda", 
    label: "Twitter" 
  },
  { 
    icon: <Instagram size={20} />, 
    href: "https://instagram.com/tutienda", 
    label: "Instagram" 
  },
  { 
    icon: <Linkedin size={20} />, 
    href: "https://linkedin.com/company/tutienda", 
    label: "LinkedIn" 
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Columna de información de contacto */}
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
                <Mail size={18} className="mr-3 text-purple-500" />
                <a href="mailto:info@tutiendaweb.com" className="hover:text-white transition-colors">
                  info@tutiendaweb.com
                </a>
              </div>
              
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <a href="https://github.com/MaxiAramayo/TuTiendaWeb-public" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Ver en GitHub
                </a>
              </div>
              
              <div className="flex items-start">
                <MapPin size={18} className="mr-3 text-purple-500 mt-1" />
                <span>
                  Buenos Aires<br />
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

        {/* Barra inferior con copyright y redes sociales */}
        <div className="border-t border-gray-800 py-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>© {currentYear} TuTienda. Todos los derechos reservados.</p>
          </div>
          
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