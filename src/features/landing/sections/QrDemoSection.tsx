/**
 * Sección de demostración de códigos QR
 * 
 * Muestra cómo funciona el proceso de escaneo de códigos QR para acceder a los menús digitales
 * 
 * @module features/landing/sections
 */

"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const steps = [
  {
    id: 1,
    title: "Crea tu catálogo QR",
    description: "Configura tu catálogo digital con fotos atractivas y descripciones detalladas de cada producto en cuestión de minutos.",
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    id: 2,
    title: "Personaliza tu QR",
    description: "Personaliza tu código QR con los colores y el logo de tu negocio para una presentación profesional.",
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    )
  },
  {
    id: 3,
    title: "Comparte tu QR",
    description: "Comparte tu código QR en redes sociales, WhatsApp, o inclúyelo en tus materiales promocionales digitales.",
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    )
  },
  {
    id: 4,
    title: "Tus clientes escanean",
    description: "Los clientes solo necesitan usar la cámara de su smartphone para acceder a tu catálogo digital al instante.",
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
];

const QrDemoSection = () => {
  return (
    <section id="como-funciona" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Cómo Funciona TuTiendaWeb QR
          </h2>
          <p className="text-xl text-gray-600">
            Digitaliza tu catálogo en 4 sencillos pasos y comienza a ofrecer una experiencia moderna a tus clientes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            className="space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {steps.map((step) => (
              <motion.div 
                key={step.id}
                variants={fadeInUp}
                className="flex items-start"
              >
                <div className="flex-shrink-0 mr-4">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/landing/QR-steps.webp"
                alt="Proceso de escaneo QR - Cómo funciona TuTiendaWeb"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
            
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center shadow-lg transform rotate-12">
              <span className="text-white font-bold text-xl">¡Fácil!</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default QrDemoSection;