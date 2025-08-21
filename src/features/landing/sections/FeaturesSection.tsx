/**
 * Sección de características
 * 
 * Muestra las principales características y beneficios del sistema
 * 
 * @module features/landing/sections
 */

"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Smartphone, 
  BarChart, 
  ShoppingCart, 
  Pen, 
  Globe, 
  Clock,
  Settings,
  Shield
} from 'lucide-react';

// Animaciones
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

// Interfaz para características
interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const features: Feature[] = [
  {
    id: "catalog-digital",
    title: "Catálogo Digital Completo",
    description: "Crea un catálogo digital elegante con fotos, descripciones detalladas y precios actualizados para cualquier tipo de negocio.",
    icon: <Smartphone size={24} className="text-purple-600" />
  },
  {
    id: "analytics",
    title: "Analytics y Reportes",
    description: "Obtén datos sobre productos más vistos, ventas por período y comportamiento de tus clientes para tomar mejores decisiones.",
    icon: <BarChart size={24} className="text-purple-600" />
  },
  {
    id: "whatsapp-orders",
    title: "Pedidos por WhatsApp",
    description: "Integración directa con WhatsApp para que tus clientes puedan realizar pedidos de forma rápida y familiar.",
    icon: <ShoppingCart size={24} className="text-purple-600" />
  },
  {
    id: "customization",
    title: "Personalización Total",
    description: "Adapta colores, fuentes y estilos para que coincidan perfectamente con la identidad de tu marca argentina.",
    icon: <Pen size={24} className="text-purple-600" />
  },
  {
    id: "no-physical-store",
    title: "100% Digital",
    description: "Perfecto para emprendedores sin local físico. Vende desde casa, redes sociales o cualquier canal digital.",
    icon: <Globe size={24} className="text-purple-600" />
  },
  {
    id: "real-time",
    title: "Actualizaciones Instantáneas",
    description: "Actualiza precios, stock y promociones al instante desde cualquier dispositivo, sin complicaciones técnicas.",
    icon: <Clock size={24} className="text-purple-600" />
  },
  {
    id: "easy-management",
    title: "Gestión Simplificada",
    description: "Panel de control intuitivo diseñado para emprendedores argentinos, sin necesidad de conocimientos técnicos.",
    icon: <Settings size={24} className="text-purple-600" />
  },
  {
    id: "security",
    title: "Seguridad Garantizada",
    description: "Protección de datos y cumplimiento con normativas argentinas de privacidad para tu tranquilidad total.",
    icon: <Shield size={24} className="text-purple-600" />
  }
];

const FeaturesSection = () => {
  return (
    <section id="caracteristicas" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Características que transforman la experiencia
          </h2>
          <p className="text-xl text-gray-600">
            Todo lo que necesitas para digitalizar y optimizar tu restaurante 
            en una plataforma simple e intuitiva
          </p>
        </motion.div>
        
        {/* Características principales con ilustración central */}
        <div className="relative mb-24">
          <motion.div 
            className="absolute inset-0 flex items-center justify-center opacity-10 -z-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div className="w-[500px] h-[500px] rounded-full bg-purple-600/20 flex items-center justify-center">
              <div className="w-[300px] h-[300px] rounded-full bg-purple-600/40"></div>
            </div>
          </motion.div>
          
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.slice(0, 4).map((feature) => (
              <motion.div
                key={feature.id}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
                variants={itemVariants}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Características con imagen */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            className="order-2 md:order-1"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Catálogo digital completo para tu negocio
            </h3>
            
            <div className="space-y-6">
              {features.slice(4, 6).map((feature) => (
                <div key={feature.id} className="flex">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            className="order-1 md:order-2 relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-xl max-w-sm mx-auto">
              <Image
                src="/images/landing/Cell-Products.webp"
                alt="Catálogo digital de productos - TuTiendaWeb"
                width={500}
                height={375}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Elemento decorativo */}
            <div className="absolute -bottom-6 -left-6 bg-purple-600 text-white p-4 rounded-lg shadow-lg">
              <p className="font-semibold">Catálogo profesional</p>
              <p className="text-sm">Productos organizados y atractivos</p>
            </div>
          </motion.div>
        </div>
        
        {/* Últimas características con imagen */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-xl max-w-sm mx-auto">
              <Image
                src="/images/landing/cell-whatsapp.webp"
                alt="Integración con WhatsApp - Pedidos fáciles"
                width={500}
                height={375}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Elemento decorativo */}
            <div className="absolute -top-6 -right-6 bg-green-600 text-white p-4 rounded-lg shadow-lg">
              <p className="font-semibold">WhatsApp Business</p>
              <p className="text-sm">Pedidos directos y automáticos</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Integración perfecta con WhatsApp
            </h3>
            
            <div className="space-y-6">
              {features.slice(6, 8).map((feature) => (
                <div key={feature.id} className="flex">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;