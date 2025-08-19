/**
 * Sección de testimonios
 * 
 * Muestra los testimonios de clientes satisfechos
 * 
 * @module features/landing/sections
 */

"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

// Interfaz para los datos de testimonios
interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  image: string;
  rating: number;
  text: string;
}

// Datos de testimonios
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'María López',
    role: 'Propietaria',
    company: 'La Cocina de María',
    image: '/testimonials/maria.jpg',
    rating: 5,
    text: 'TuTienda ha transformado por completo mi negocio. Desde que implementamos su sistema de menú digital y punto de venta, nuestras ventas aumentaron un 30% y la eficiencia de los empleados mejoró notablemente.'
  },
  {
    id: 2,
    name: 'Carlos Rojas',
    role: 'Gerente',
    company: 'Tacos El Jefe',
    image: '/testimonials/carlos.jpg',
    rating: 5,
    text: 'La facilidad para actualizar nuestro menú y gestionar pedidos en línea ha sido revolucionaria. El soporte técnico es excelente y siempre están disponibles para resolver cualquier duda.'
  },
  {
    id: 3,
    name: 'Ana Ramírez',
    role: 'Chef Ejecutiva',
    company: 'Restaurante Fusión',
    image: '/testimonials/ana.jpg',
    rating: 4,
    text: 'El sistema es muy intuitivo y nos permite enfocarnos en lo que realmente importa: la comida y la experiencia del cliente. La función de análisis de datos nos ayuda a tomar mejores decisiones de negocio.'
  },
  {
    id: 4,
    name: 'Roberto Vega',
    role: 'Dueño',
    company: 'Café del Centro',
    image: '/testimonials/roberto.jpg',
    rating: 5,
    text: 'Después de probar varias soluciones, TuTienda es definitivamente la mejor. Su integración con nuestros sistemas existentes fue sencilla y el proceso de capacitación para nuestro personal fue muy rápido.'
  },
  {
    id: 5,
    name: 'Sofía Mendoza',
    role: 'Administradora',
    company: 'La Terraza Restaurant',
    image: '/testimonials/sofia.jpg',
    rating: 5,
    text: 'El sistema de códigos QR ha eliminado las largas esperas y mejorado la experiencia de nuestros clientes. La aplicación móvil es elegante y refleja perfectamente la imagen de nuestro restaurante.'
  }
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  
  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplay]);
  
  // Handlers for navigation
  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
    setAutoplay(false);
  };
  
  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % testimonials.length);
    setAutoplay(false);
  };
  
  const goToSlide = (index: number) => {
    setActiveIndex(index);
    setAutoplay(false);
  };
  
  // Get current testimonial
  const currentTestimonial = testimonials[activeIndex];
  
  return (
    <section id="testimonios" className="py-24 bg-gradient-to-br from-purple-50 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center bg-purple-100 text-purple-600 p-2 rounded-lg mb-6">
            <Star size={20} className="mr-2" />
            <span className="text-sm font-medium">Testimonios</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Lo que nuestros clientes dicen sobre nosotros
          </h2>
          <p className="text-xl text-gray-600">
            Más de 500 restaurantes y cafeterías confían en TuTienda para sus operaciones diarias
          </p>
        </motion.div>
        
        {/* Carrusel de testimonios */}
        <div className="relative max-w-5xl mx-auto">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-3xl transform rotate-1 scale-105 opacity-70"></div>
          
          {/* Contenedor principal del testimonio */}
          <motion.div 
            className="relative bg-white rounded-2xl shadow-xl p-8 md:p-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            key={currentTestimonial.id}
          >
            {/* Ícono de comillas */}
            <div className="absolute top-6 right-8 text-purple-200">
              <Quote size={60} />
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Columna de imagen y rating */}
              <div className="md:col-span-1 flex flex-col items-center md:items-start">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                  <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                    <span className="text-3xl font-semibold text-purple-700">
                      {currentTestimonial.name.charAt(0)}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900">
                  {currentTestimonial.name}
                </h3>
                <p className="text-gray-600 mb-2">
                  {currentTestimonial.role}
                </p>
                <p className="text-purple-600 font-medium mb-4">
                  {currentTestimonial.company}
                </p>
                
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={20} 
                      className={i < currentTestimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                    />
                  ))}
                </div>
              </div>
              
              {/* Columna de texto del testimonio */}
              <div className="md:col-span-2">
                <blockquote className="text-xl md:text-2xl text-gray-700 italic leading-relaxed mb-8">
                  &ldquo;{currentTestimonial.text}&rdquo;
                </blockquote>
                
                {/* Logos de clientes */}
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <p className="text-sm text-gray-500 mb-4">Empresas que confían en nosotros:</p>
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    <div className="w-20 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Controles del carrusel */}
            <div className="flex justify-between items-center mt-10">
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === activeIndex ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={goToPrevious}
                  className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={goToNext}
                  className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300"
                  aria-label="Next testimonial"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Sección de estadísticas */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {[
            { value: '500+', label: 'Restaurantes' },
            { value: '98%', label: 'Satisfacción' },
            { value: '24/7', label: 'Soporte técnico' },
            { value: '30%', label: 'Aumento en ventas' }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <p className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Sección de CTA */}
        <motion.div 
          className="mt-20 bg-purple-600 rounded-2xl p-8 md:p-12 text-center text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Únete a cientos de restaurantes satisfechos
          </h3>
          <p className="text-purple-100 text-lg max-w-2xl mx-auto mb-8">
            Comienza hoy mismo a transformar tu negocio con nuestras soluciones digitales diseñadas para restaurantes y cafeterías.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="#demo" 
              className="px-6 py-3 bg-white text-purple-600 font-medium rounded-lg shadow-sm hover:bg-gray-100 transition-colors focus:ring-4 focus:ring-white focus:ring-opacity-30"
            >
              Solicitar demo
            </a>
            <a 
              href="#pricing" 
              className="px-6 py-3 bg-purple-700 text-white font-medium rounded-lg shadow-sm hover:bg-purple-800 transition-colors focus:ring-4 focus:ring-white focus:ring-opacity-30"
            >
              Ver planes
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 