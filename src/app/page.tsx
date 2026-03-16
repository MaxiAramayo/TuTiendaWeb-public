/**
 * Página principal del sitio (Landing Page)
 * 
 * Muestra todas las secciones de la landing page
 * 
 * @module app
 */

import { Metadata } from "next";
import { generateSEOMetadata } from "@/features/landing/seo/metadata";

// Componentes de la landing page
import Navbar from "@/features/landing/components/Navbar";
import HeroSection from "@/features/landing/sections/HeroSection";
import FeaturesSection from "@/features/landing/sections/FeaturesSection";
import StepsSection from "@/features/landing/sections/StepsSection";
import PricingSection from "@/features/landing/sections/PricingSection";

import { Footer } from "@/features/landing/components/Footer";

/**
 * Metadatos para la página principal (SEO)
 */
export const metadata: Metadata = generateSEOMetadata();

/**
 * Página de inicio del sitio
 * 
 * @returns Página React
 */
export default function Page() {
  return (
    <>
      <Navbar />
      
      <main className="flex flex-col overflow-x-hidden">
        <HeroSection />
        <StepsSection />
        <FeaturesSection />
        <PricingSection />

      </main>
      
      <Footer />
    </>
  );
}
