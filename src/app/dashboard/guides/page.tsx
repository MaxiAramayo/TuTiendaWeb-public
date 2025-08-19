/**
 * Página de guías del dashboard
 * 
 * Muestra las guías de usuario disponibles usando componentes del design system
 * y patrones reutilizables para una experiencia consistente.
 * 
 * @module app/dashboard/guides
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, BookOpen, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/states/EmptyState";

/**
 * Configuración de las guías disponibles
 */
const guides = [
  {
    id: 'user-guide',
    title: 'Guía del Usuario',
    description: 'Descarga la guía completa para entender todas las funcionalidades de nuestra aplicación y maximizar tu experiencia.',
    viewLink: '/guides/Guia-uso.pdf',
    downloadLink: '/guides/Guia-uso.pdf',
    icon: BookOpen,
    category: 'General',
    size: '2.5 MB',
    pages: 24,
    color: 'bg-blue-500'
  },
  {
    id: 'whatsapp-guide',
    title: 'Guía de WhatsApp Business',
    description: 'Aprende a vincular WhatsApp Business y configurar mensajes predeterminados para acceder a la tienda de manera automática.',
    viewLink: '/guides/Guia-whatsapp.pdf',
    downloadLink: '/guides/Guia-whatsapp.pdf',
    icon: MessageCircle,
    category: 'Integración',
    size: '1.8 MB',
    pages: 16,
    color: 'bg-green-500'
  }
];

/**
 * Componente para mostrar una guía individual
 */
const GuideCard: React.FC<{ guide: typeof guides[0] }> = ({ guide }) => {
  const IconComponent = guide.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${guide.color} text-white`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                {guide.title}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {guide.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {guide.pages} páginas • {guide.size}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {guide.description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            asChild 
            variant="default" 
            className="flex-1 group/btn"
          >
            <a 
              href={guide.viewLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              Ver Guía
            </a>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="flex-1 group/btn"
          >
            <a 
              href={guide.downloadLink} 
              download
              className="flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              Descargar
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Página principal de guías
 */
const GuidesPage: React.FC = () => {
  // Si no hay guías, mostrar estado vacío
  if (guides.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          icon={<BookOpen className="w-16 h-16" />}
          title="No hay guías disponibles"
          description="Las guías de usuario estarán disponibles próximamente para ayudarte a aprovechar al máximo la plataforma."
          withCard
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Guías de Tu Tienda Web
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Encuentra toda la información que necesitas para aprovechar al máximo 
          las funcionalidades de tu tienda online.
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{guides.length}</div>
            <p className="text-xs text-muted-foreground">Guías Disponibles</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {guides.reduce((acc, guide) => acc + guide.pages, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total de Páginas</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">100%</div>
            <p className="text-xs text-muted-foreground">Gratuitas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de guías */}
      <div className="space-y-6">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>

      {/* Footer informativo */}
      <div className="mt-12 p-6 bg-muted/30 rounded-lg border border-dashed">
        <div className="text-center">
          <h3 className="font-semibold mb-2">¿Necesitas ayuda adicional?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Si tienes preguntas específicas que no están cubiertas en nuestras guías, 
            no dudes en contactarnos.
          </p>
          <Button variant="outline" size="sm">
            Contactar Soporte
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuidesPage;
