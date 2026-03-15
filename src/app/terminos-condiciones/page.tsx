/**
 * Página de Términos y Condiciones
 *
 * Documento legal completo del servicio SaaS TuTiendaWeb
 *
 * @module app/terminos-condiciones
 */

import { Metadata } from "next";
import { Footer } from "@/features/landing/components/Footer";
import Navbar from "@/features/landing/components/Navbar";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Leé los términos y condiciones de uso de TuTiendaWeb. Condiciones del servicio, suscripción, pagos, privacidad y responsabilidades.",
  robots: "index, follow",
  alternates: { canonical: "https://tutiendaweb.com.ar/terminos-condiciones" },
};

const LAST_UPDATE = "15 de marzo de 2026";
const CONTACT_EMAIL = "tutiendaweboficial@gmail.com";
const SITE_URL = "https://tutiendaweb.com.ar";

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Encabezado */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12 mb-8">
            <div className="text-center mb-8">
              <span className="inline-block bg-purple-100 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                Documento legal
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Términos y Condiciones
              </h1>
              <p className="text-gray-500 text-sm">
                Última actualización:{" "}
                <strong className="text-gray-700">{LAST_UPDATE}</strong>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Importante:</strong> Al registrarte en TuTiendaWeb y
              utilizar nuestro servicio, aceptás íntegramente estos Términos y
              Condiciones. Si no estás de acuerdo con alguna de las
              disposiciones, no debés usar el servicio.
            </div>
          </div>

          {/* Contenido */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12 space-y-10">

            {/* Índice */}
            <nav aria-label="Índice de contenidos">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Contenido
              </h2>
              <ol className="list-decimal list-inside space-y-1 text-purple-600 text-sm columns-2">
                {[
                  "Identificación del prestador",
                  "Objeto del servicio",
                  "Registro y cuenta",
                  "Suscripción, tarifas y pagos",
                  "Cancelación y baja del servicio",
                  "Obligaciones del usuario",
                  "Conducta prohibida",
                  "Datos de compradores del comercio",
                  "Protección de datos personales",
                  "Propiedad intelectual",
                  "Disponibilidad del servicio",
                  "Limitación de responsabilidad",
                  "Indemnización",
                  "Modificaciones",
                  "Ley aplicable y jurisdicción",
                  "Contacto",
                ].map((item, i) => (
                  <li key={i} className="hover:underline">
                    <a href={`#seccion-${i + 1}`}>{item}</a>
                  </li>
                ))}
              </ol>
            </nav>

            <hr className="border-gray-100" />

            {/* 1 */}
            <Section id="seccion-1" number="1" title="Identificación del prestador">
              <p>
                <strong>TuTiendaWeb</strong> es una plataforma de software como
                servicio (SaaS) desarrollada y operada por Maximiliano Aramayo,
                con domicilio en la Ciudad Autónoma de Buenos Aires, República
                Argentina.
              </p>
              <p>
                Sitio web:{" "}
                <a href={SITE_URL} className="text-purple-600 underline">
                  {SITE_URL}
                </a>
                <br />
                Correo de contacto:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-purple-600 underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </Section>

            {/* 2 */}
            <Section id="seccion-2" number="2" title="Objeto del servicio">
              <p>
                TuTiendaWeb provee a comercios (restaurantes, cafeterías,
                almacenes, pymes y emprendimientos en general) una plataforma
                digital que incluye, sin limitación:
              </p>
              <ul>
                <li>
                  Creación y gestión de un catálogo de productos con código QR
                  compartible.
                </li>
                <li>
                  Recepción de pedidos de clientes finales a través de WhatsApp.
                </li>
                <li>
                  Panel de administración para gestionar ventas, productos,
                  categorías y configuración del local.
                </li>
                <li>
                  Generación de reportes de ventas y exportación de datos.
                </li>
                <li>
                  Personalización visual del catálogo (logo, banner, colores).
                </li>
              </ul>
              <p>
                TuTiendaWeb es una herramienta de gestión y visibilidad digital.
                No interviene como parte en las transacciones comerciales entre
                el comercio suscripto y sus clientes finales, ni garantiza
                ventas, facturación o resultados comerciales.
              </p>
            </Section>

            {/* 3 */}
            <Section id="seccion-3" number="3" title="Registro y cuenta">
              <Subsection title="3.1 Requisitos">
                <p>
                  Para acceder al servicio debés ser mayor de 18 años, tener
                  capacidad legal para contratar y proporcionar información veraz,
                  completa y actualizada durante el proceso de registro.
                </p>
              </Subsection>
              <Subsection title="3.2 Una tienda por cuenta">
                <p>
                  Cada cuenta de usuario está asociada a una única tienda. Si
                  necesitás gestionar más de un local, debés crear cuentas
                  separadas para cada uno.
                </p>
              </Subsection>
              <Subsection title="3.3 Seguridad de la cuenta">
                <p>
                  Sos responsable de mantener la confidencialidad de tus
                  credenciales de acceso. Debés notificarnos de inmediato ante
                  cualquier uso no autorizado de tu cuenta al correo{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-purple-600 underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  . TuTiendaWeb no será responsable por daños derivados del
                  acceso no autorizado a tu cuenta cuando este sea consecuencia
                  del incumplimiento de tus obligaciones de custodia.
                </p>
              </Subsection>
              <Subsection title="3.4 Exactitud de la información">
                <p>
                  Cualquier información falsa, imprecisa o incompleta puede
                  derivar en la suspensión o cancelación inmediata de la cuenta
                  sin derecho a reembolso.
                </p>
              </Subsection>
            </Section>

            {/* 4 */}
            <Section id="seccion-4" number="4" title="Suscripción, tarifas y pagos">
              <Subsection title="4.1 Plan único">
                <p>
                  TuTiendaWeb ofrece un único plan de suscripción mensual con
                  todas las funcionalidades incluidas. El precio vigente es de{" "}
                  <strong>$15.000 (quince mil pesos argentinos) por mes</strong>,
                  IVA incluido si correspondiera.
                </p>
              </Subsection>
              <Subsection title="4.2 Período de facturación">
                <p>
                  La suscripción se factura mensualmente de forma anticipada,
                  contándose desde la fecha de activación. El servicio se renueva
                  automáticamente cada mes a menos que sea cancelado antes del
                  vencimiento del período en curso.
                </p>
              </Subsection>
              <Subsection title="4.3 Medio de pago">
                <p>
                  Los pagos se procesan a través de{" "}
                  <strong>MercadoPago</strong>, sujetos a sus propios términos y
                  condiciones. TuTiendaWeb no almacena datos de tarjetas de
                  crédito ni débito.
                </p>
              </Subsection>
              <Subsection title="4.4 Cambios de precio">
                <p>
                  TuTiendaWeb podrá modificar las tarifas con un aviso mínimo de{" "}
                  <strong>30 días corridos</strong> antes de que el nuevo precio
                  sea aplicado. El aviso se enviará al correo registrado en tu
                  cuenta. Si no estás de acuerdo con el nuevo precio, podés
                  cancelar tu suscripción antes de la fecha de vigencia del
                  cambio.
                </p>
              </Subsection>
              <Subsection title="4.5 Impuestos">
                <p>
                  Los precios podrán estar sujetos a impuestos, tasas o
                  contribuciones nacionales, provinciales o municipales
                  aplicables según la legislación argentina vigente. Cualquier
                  tributo adicional será indicado al momento del pago.
                </p>
              </Subsection>
            </Section>

            {/* 5 */}
            <Section id="seccion-5" number="5" title="Cancelación y baja del servicio">
              <Subsection title="5.1 Cancelación por el usuario">
                <p>
                  Podés cancelar tu suscripción en cualquier momento desde el
                  panel de administración o solicitándolo por correo a{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-purple-600 underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  . La cancelación tiene efecto al finalizar el período mensual
                  ya abonado; no se realizan reembolsos proporcionales por
                  fracción de mes no utilizado.
                </p>
              </Subsection>
              <Subsection title="5.2 Garantía de satisfacción de 30 días">
                <p>
                  Si cancelás dentro de los primeros 30 días corridos desde la
                  activación de tu primer plan pago, te reintegraremos el importe
                  abonado de forma íntegra, sin necesidad de justificación. Esta
                  garantía aplica una única vez por comercio / titular de cuenta.
                </p>
              </Subsection>
              <Subsection title="5.3 Suspensión por falta de pago">
                <p>
                  Ante el vencimiento impago de un período, el acceso al panel de
                  administración podrá ser suspendido. El catálogo público
                  permanecerá visible por un período de gracia de{" "}
                  <strong>7 días corridos</strong>, transcurrido el cual el
                  acceso completo será bloqueado hasta la regularización del
                  pago.
                </p>
              </Subsection>
              <Subsection title="5.4 Eliminación de datos">
                <p>
                  Tras 60 días corridos de la cancelación o baja definitiva de la
                  cuenta sin que se haya reanudado el servicio, TuTiendaWeb podrá
                  eliminar de manera permanente todos los datos asociados a la
                  tienda (productos, imágenes, ventas, configuración). Si querés
                  exportar tus datos, debés hacerlo antes de esa fecha desde el
                  panel de administración.
                </p>
              </Subsection>
            </Section>

            {/* 6 */}
            <Section id="seccion-6" number="6" title="Obligaciones del usuario">
              <p>Al usar TuTiendaWeb te comprometés a:</p>
              <ul>
                <li>
                  Usar el servicio únicamente para fines lícitos y en conformidad
                  con la legislación argentina vigente.
                </li>
                <li>
                  Publicar únicamente productos y servicios que estés
                  legalmente habilitado para ofrecer.
                </li>
                <li>
                  Mantener actualizada la información de tu tienda (precios,
                  disponibilidad, datos de contacto).
                </li>
                <li>
                  Informar a tus clientes finales acerca de las condiciones de
                  venta, garantías, precios y métodos de pago de manera clara y
                  transparente, en cumplimiento de la Ley de Defensa del
                  Consumidor (Ley Nº 24.240).
                </li>
                <li>
                  No ceder, sublicenciar ni transferir tu cuenta a terceros sin
                  autorización expresa y por escrito de TuTiendaWeb.
                </li>
              </ul>
            </Section>

            {/* 7 */}
            <Section id="seccion-7" number="7" title="Conducta prohibida">
              <p>
                Queda expresamente prohibido, entre otras conductas:
              </p>
              <ul>
                <li>
                  Publicar contenido ilegal, falso, difamatorio, obsceno,
                  discriminatorio o que infrinja derechos de terceros.
                </li>
                <li>
                  Usar la plataforma para actividades fraudulentas, de phishing
                  o que perjudiquen a consumidores o a terceros.
                </li>
                <li>
                  Intentar acceder sin autorización a sistemas, servidores o
                  cuentas ajenas.
                </li>
                <li>
                  Introducir virus, malware o código dañino de cualquier tipo.
                </li>
                <li>
                  Realizar ingeniería inversa, descompilar o intentar extraer
                  el código fuente de la plataforma.
                </li>
                <li>
                  Usar scripts automáticos, bots o medios no autorizados para
                  interactuar con el servicio de forma masiva.
                </li>
                <li>
                  Comercializar, arrendar o explotar comercialmente la
                  plataforma o cualquier parte de ella sin autorización.
                </li>
              </ul>
              <p>
                El incumplimiento de estas prohibiciones habilita a TuTiendaWeb a
                suspender o cancelar la cuenta de forma inmediata y sin derecho a
                reembolso, sin perjuicio de las acciones legales que pudieran
                corresponder.
              </p>
            </Section>

            {/* 8 */}
            <Section id="seccion-8" number="8" title="Datos de compradores del comercio">
              <p>
                Los datos personales que los clientes finales ingresen al
                realizar un pedido en el catálogo público de tu tienda (nombre,
                dirección, teléfono, etc.) son responsabilidad exclusiva del
                comercio suscripto.
              </p>
              <p>
                TuTiendaWeb almacena dichos datos en su plataforma en carácter de{" "}
                <strong>encargado del tratamiento</strong> según lo dispuesto por
                la Ley Nº 25.326 de Protección de Datos Personales. El comercio
                actúa como <strong>responsable del tratamiento</strong> y debe:
              </p>
              <ul>
                <li>
                  Informar a sus clientes sobre el uso que se dará a sus datos.
                </li>
                <li>
                  No usar dichos datos para finalidades distintas a las
                  informadas al cliente.
                </li>
                <li>
                  Cumplir con las obligaciones de la Ley Nº 25.326 y su
                  reglamentación.
                </li>
              </ul>
              <p>
                TuTiendaWeb no venderá ni cederá a terceros los datos de clientes
                finales de los comercios suscriptos, salvo orden judicial o
                requerimiento de autoridad competente.
              </p>
            </Section>

            {/* 9 */}
            <Section id="seccion-9" number="9" title="Protección de datos personales del suscriptor">
              <Subsection title="9.1 Datos recopilados">
                <p>
                  TuTiendaWeb recopila los siguientes datos del comercio
                  suscripto: nombre y apellido del titular, nombre del comercio,
                  correo electrónico, número de WhatsApp/teléfono, e información
                  de configuración de la tienda.
                </p>
              </Subsection>
              <Subsection title="9.2 Finalidad">
                <p>
                  Los datos se utilizan para: prestar el servicio contratado,
                  enviar comunicaciones operativas y de soporte, notificar
                  cambios en el servicio o en los términos, y mejorar la
                  plataforma.
                </p>
              </Subsection>
              <Subsection title="9.3 Base legal">
                <p>
                  El tratamiento se basa en la relación contractual con el
                  suscriptor y en el cumplimiento de obligaciones legales,
                  conforme a la Ley Nº 25.326 y su Decreto Reglamentario
                  Nº 1558/2001.
                </p>
              </Subsection>
              <Subsection title="9.4 Derechos ARCO">
                <p>
                  Tenés derecho a acceder, rectificar, cancelar y oponerte al
                  tratamiento de tus datos personales (derechos ARCO). Para
                  ejercerlos, escribinos a{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-purple-600 underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  . La respuesta se proveerá dentro de los 5 días hábiles.
                </p>
              </Subsection>
              <Subsection title="9.5 Transferencia internacional">
                <p>
                  Los datos se almacenan en servidores de Google Firebase
                  (Google LLC) bajo el programa de cumplimiento de Google Cloud
                  y las cláusulas contractuales estándar aplicables. La región
                  de almacenamiento principal es Sudamérica (São Paulo, Brasil).
                </p>
              </Subsection>
            </Section>

            {/* 10 */}
            <Section id="seccion-10" number="10" title="Propiedad intelectual">
              <p>
                Todos los derechos de propiedad intelectual sobre la plataforma
                TuTiendaWeb —incluyendo, sin limitación, el código fuente, diseño,
                logotipos, marcas, textos e interfaces— son titularidad exclusiva
                de TuTiendaWeb o de sus licenciantes.
              </p>
              <p>
                El suscriptor recibe una licencia limitada, no exclusiva, no
                transferible e intransferible para usar la plataforma durante la
                vigencia de su suscripción, únicamente con las finalidades
                previstas en estos términos.
              </p>
              <p>
                El contenido cargado por el suscriptor (imágenes, textos,
                descripciones de productos) es de titularidad del suscriptor.
                TuTiendaWeb cuenta con una licencia para almacenarlo, procesarlo
                y mostrarlo únicamente a efectos de prestar el servicio
                contratado.
              </p>
            </Section>

            {/* 11 */}
            <Section id="seccion-11" number="11" title="Disponibilidad del servicio">
              <p>
                TuTiendaWeb realiza sus mejores esfuerzos para mantener la
                plataforma disponible de forma continua. Sin embargo, no
                garantiza una disponibilidad del 100% y podrá interrumpir el
                servicio temporalmente por:
              </p>
              <ul>
                <li>Tareas de mantenimiento programado (se avisará con anticipación).</li>
                <li>Fallas de infraestructura de terceros (Firebase, Vercel, etc.).</li>
                <li>Causas de fuerza mayor o casos fortuitos.</li>
                <li>
                  Actualizaciones de seguridad urgentes que requieran acción
                  inmediata.
                </li>
              </ul>
              <p>
                Las interrupciones no programadas de carácter excepcional no
                generan derecho a reembolso, salvo que superen las{" "}
                <strong>72 horas consecutivas</strong> dentro de un mismo mes
                calendario, en cuyo caso se analizará cada caso en particular.
              </p>
            </Section>

            {/* 12 */}
            <Section id="seccion-12" number="12" title="Limitación de responsabilidad">
              <p>
                En la máxima medida permitida por la legislación argentina
                aplicable, TuTiendaWeb no será responsable por:
              </p>
              <ul>
                <li>
                  Daños directos, indirectos, incidentales, especiales o
                  consecuentes derivados del uso o imposibilidad de uso del
                  servicio.
                </li>
                <li>
                  Pérdida de datos, ganancias, clientela o reputación comercial.
                </li>
                <li>
                  Conflictos entre el comercio suscripto y sus clientes finales.
                </li>
                <li>
                  Fallas o indisponibilidades de servicios de terceros
                  (WhatsApp, MercadoPago, Firebase, etc.) utilizados por la
                  plataforma.
                </li>
                <li>
                  Accesos no autorizados resultantes de vulneraciones de
                  seguridad imputables al suscriptor.
                </li>
              </ul>
              <p>
                La responsabilidad total de TuTiendaWeb, en cualquier
                circunstancia, no excederá el importe de las mensualidades
                efectivamente abonadas por el suscriptor durante los{" "}
                <strong>3 meses anteriores</strong> al hecho generador del daño.
              </p>
            </Section>

            {/* 13 */}
            <Section id="seccion-13" number="13" title="Indemnización">
              <p>
                El suscriptor acepta indemnizar y mantener indemne a
                TuTiendaWeb, sus directores, empleados y colaboradores, de
                cualquier reclamo, demanda, daño, pérdida o gasto (incluyendo
                honorarios profesionales razonables) que surja de:
              </p>
              <ul>
                <li>El uso del servicio en violación de estos términos.</li>
                <li>
                  La infracción de derechos de terceros (propiedad intelectual,
                  datos personales, etc.) por parte del suscriptor.
                </li>
                <li>
                  Cualquier incumplimiento del suscriptor respecto de las
                  obligaciones previstas en la Ley de Defensa del Consumidor u
                  otras normas aplicables a su actividad comercial.
                </li>
              </ul>
            </Section>

            {/* 14 */}
            <Section id="seccion-14" number="14" title="Modificaciones">
              <Subsection title="14.1 Modificaciones al servicio">
                <p>
                  TuTiendaWeb podrá agregar, modificar o discontinuar
                  funcionalidades del servicio en cualquier momento. Los cambios
                  sustanciales serán comunicados con un mínimo de{" "}
                  <strong>15 días de anticipación</strong> por correo electrónico.
                </p>
              </Subsection>
              <Subsection title="14.2 Modificaciones a los términos">
                <p>
                  TuTiendaWeb podrá actualizar estos Términos y Condiciones.
                  La versión vigente siempre estará disponible en{" "}
                  <a
                    href={`${SITE_URL}/terminos-condiciones`}
                    className="text-purple-600 underline"
                  >
                    {SITE_URL}/terminos-condiciones
                  </a>
                  . Los cambios se notificarán por correo con al menos{" "}
                  <strong>15 días de anticipación</strong>. El uso continuado del
                  servicio tras esa fecha implica aceptación de la nueva versión.
                </p>
              </Subsection>
            </Section>

            {/* 15 */}
            <Section id="seccion-15" number="15" title="Ley aplicable y jurisdicción">
              <p>
                Estos Términos y Condiciones se rigen e interpretan de conformidad
                con las leyes de la{" "}
                <strong>República Argentina</strong>, en particular:
              </p>
              <ul>
                <li>Código Civil y Comercial de la Nación (Ley Nº 26.994)</li>
                <li>Ley de Defensa del Consumidor (Ley Nº 24.240 y modificatorias)</li>
                <li>Ley de Protección de Datos Personales (Ley Nº 25.326)</li>
                <li>Ley de Comercio Electrónico y normativa AFIP aplicable</li>
              </ul>
              <p>
                En caso de controversia, las partes se someten a la jurisdicción
                exclusiva de los{" "}
                <strong>
                  Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires
                </strong>
                , con renuncia expresa a cualquier otro fuero que pudiera
                corresponder.
              </p>
            </Section>

            {/* 16 */}
            <Section id="seccion-16" number="16" title="Contacto">
              <p>
                Para consultas, reclamos o ejercicio de derechos sobre estos
                Términos y Condiciones:
              </p>
              <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                <p>
                  <strong>Correo electrónico:</strong>{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-purple-600 underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p>
                  <strong>Sitio web:</strong>{" "}
                  <a href={SITE_URL} className="text-purple-600 underline">
                    {SITE_URL}
                  </a>
                </p>
                <p>
                  <strong>Horario de atención:</strong> Lunes a viernes de 9:00 a
                  18:00 hs (UTC-3, Argentina)
                </p>
              </div>
            </Section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─── Componentes auxiliares de layout ────────────────────────────────────────

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-bold flex items-center justify-center">
          {number}
        </span>
        {title}
      </h2>
      <div className="pl-10 space-y-3 text-gray-700 leading-relaxed text-[15px]">
        {children}
      </div>
    </section>
  );
}

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
