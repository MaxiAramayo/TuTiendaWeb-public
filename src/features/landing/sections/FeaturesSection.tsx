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
    id: "menu-digital",
    title: "Menú Digital Interactivo",
    description: "Crea un menú digital elegante con fotos, descripciones detalladas y precios actualizados en tiempo real.",
    icon: <Smartphone size={24} className="text-purple-600" />
  },
  {
    id: "analytics",
    title: "Analytics Avanzados",
    description: "Obtén datos sobre los platos más vistos, horarios de mayor demanda y comportamiento de tus clientes.",
    icon: <BarChart size={24} className="text-purple-600" />
  },
  {
    id: "orders",
    title: "Pedidos Online",
    description: "Permite a tus clientes realizar pedidos directamente desde el menú digital a través de su smartphone.",
    icon: <ShoppingCart size={24} className="text-purple-600" />
  },
  {
    id: "customization",
    title: "Personalización Total",
    description: "Adapta colores, fuentes y estilos para que coincidan perfectamente con la identidad de tu marca.",
    icon: <Pen size={24} className="text-purple-600" />
  },
  {
    id: "multi-language",
    title: "Soporte Multiidioma",
    description: "Ofrece tu menú en varios idiomas para atender a clientes internacionales sin complicaciones.",
    icon: <Globe size={24} className="text-purple-600" />
  },
  {
    id: "real-time",
    title: "Actualizaciones en Tiempo Real",
    description: "Actualiza precios, disponibilidad y promociones al instante, sin necesidad de reimprimir menús.",
    icon: <Clock size={24} className="text-purple-600" />
  },
  {
    id: "integration",
    title: "Integración con POS",
    description: "Conecta con tu sistema de punto de venta existente para mantener inventario y precios sincronizados.",
    icon: <Settings size={24} className="text-purple-600" />
  },
  {
    id: "security",
    title: "Seguridad Avanzada",
    description: "Protección de datos y cumplimiento con normativas de privacidad para tu tranquilidad.",
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
              Potencia tu negocio con herramientas avanzadas
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
            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-xl">
              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 p-6 flex items-center justify-center">
                <div className="bg-white p-4 rounded-lg shadow-md w-5/6">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                      <BarChart size={20} className="text-purple-600" />
                    </div>
                    <h4 className="text-gray-800 font-semibold">Estadísticas de Ventas</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded-full w-full mb-1"></div>
                    <div className="flex justify-between gap-2">
                      <div className="bg-purple-100 h-16 rounded-md w-1/4"></div>
                      <div className="bg-blue-100 h-24 rounded-md w-1/4"></div>
                      <div className="bg-green-100 h-20 rounded-md w-1/4"></div>
                      <div className="bg-yellow-100 h-12 rounded-md w-1/4"></div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full w-3/4 mt-3"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Elemento decorativo */}
            <div className="absolute -bottom-6 -left-6 bg-purple-600 text-white p-4 rounded-lg shadow-lg">
              <p className="font-semibold">Analytics en tiempo real</p>
              <p className="text-sm">Toma decisiones basadas en datos</p>
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
            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-xl">
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 p-6 flex items-center justify-center">
                <div className="flex gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-md">
                    <div className="w-16 h-24 bg-gray-100 rounded-lg mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1 w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-md">
                    <div className="w-16 h-24 bg-gray-100 rounded-lg mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1 w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-md">
                    <div className="w-16 h-24 bg-gray-100 rounded-lg mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1 w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Elemento decorativo */}
            <div className="absolute -top-6 -right-6 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
              <p className="font-semibold">Integración total</p>
              <p className="text-sm">Compatible con tus sistemas</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Integración y seguridad de primer nivel
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