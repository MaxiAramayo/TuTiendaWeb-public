/**
 * Sección de pasos
 * 
 * Muestra el proceso de uso del sistema de forma clara y visual
 * 
 * @module features/landing/sections
 */

"use client";
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle, Smartphone, QrCode, Coffee } from 'lucide-react';

// Datos de los pasos
interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Crea tu tienda digital",
    description: "Regístrate y configura tu tienda en minutos. Personaliza colores, logo y agrega tus productos o servicios fácilmente.",
    icon: <Smartphone className="w-10 h-10 text-purple-600" />,
    image: "/images/landing/step-1.png"
  },
  {
    id: 2,
    title: "Genera tu código QR",
    description: "El sistema generará automáticamente un código QR único para tu tienda, listo para ser compartido con tus clientes.",
    icon: <QrCode className="w-10 h-10 text-purple-600" />,
    image: "/images/landing/Step-2.png"
  },
  {
    id: 3,
    title: "Comparte con tus clientes",
    description: "Coloca el QR en tus mesas, redes sociales o imprime tarjetas. Tus clientes escanean y acceden a tu menú digital al instante.",
    icon: <Coffee className="w-10 h-10 text-purple-600" />,
    image: "/images/landing/Step-3.png"
  },
  {
    id: 4,
    title: "Recibe pedidos y gestiona ventas",
    description: "Los clientes hacen pedidos directamente desde el menú. Tú los recibes en tiempo real y gestionas todo desde el panel de control.",
    icon: <CheckCircle className="w-10 h-10 text-purple-600" />,
    image: "/images/landing/Step-4.png"
  }
];

// Animaciones
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

/**
 * Componente de sección de pasos
 * 
 * @returns Componente React
 */
const StepsSection = () => {
  return (
    <section 
      id="como-funciona" 
      className="py-20 bg-gradient-to-b from-white to-gray-50"
      aria-labelledby="steps-heading"
    >
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-medium text-sm mb-4">
            Proceso Simple
          </span>
          <h2 
            id="steps-heading"
            className="text-4xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Un sistema pensado para la facilidad de uso
          </h2>
          <p className="text-xl text-gray-600">
            Optimiza tu negocio y mejora la experiencia de tus clientes en cuatro sencillos pasos
          </p>
        </motion.div>

        <motion.div
          className="relative max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Línea conectora - Sólo visible en pantallas más grandes */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className="relative"
                variants={itemVariants}
              >
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-full flex flex-col relative z-10">
                  {/* Número de paso */}
                  <div className="absolute -top-5 -right-5 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {step.id}
                  </div>
                  
                  {/* Contenido */}
                  <div className="mb-6 flex flex-col items-center md:items-start">
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-center md:text-left">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Imagen */}
                  <div className="mt-auto rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={500}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StepsSection; 