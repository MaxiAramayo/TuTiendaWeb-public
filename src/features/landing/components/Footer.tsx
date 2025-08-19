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
                <span className="text-purple-500">Tu</span>Tienda
              </Link>
            </div>
            
            <p className="mb-6">
              Digitaliza tu negocio con soluciones modernas y
              accesibles que mejoran la experiencia de tus clientes.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail size={18} className="mr-3 text-purple-500" />
                <a href="mailto:info@tutienda.com" className="hover:text-white transition-colors">
                  info@tutienda.com
                </a>
              </div>
              
              <div className="flex items-center">
                <Phone size={18} className="mr-3 text-purple-500" />
                <a href="tel:+12345678" className="hover:text-white transition-colors">
                  (123) 456-7890
                </a>
              </div>
              
              <div className="flex items-start">
                <MapPin size={18} className="mr-3 text-purple-500 mt-1" />
                <span>
                  Av. Principal 123<br />
                  Ciudad de México, CDMX
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