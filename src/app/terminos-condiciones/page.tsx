import { Footer } from "@/features/landing/components/Footer";
import Navbar from "@/features/landing/components/Navbar";
import React from "react";

const TermsAndConditions = () => {
  return (
    <div>
      <Navbar />
      <main className="flex flex-col items-center p-4 lg:p-8 min-h-screen mt-16">
        <div className="bg-white p-6 lg:p-10 rounded-lg shadow-xl max-w-4xl w-full">
          <h1 className="text-4xl font-bold mb-8 text-center text-purple-700">
            Términos y Condiciones
          </h1>
          <div className="space-y-6 text-gray-700 text-justify">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                1. Introducción
              </h2>
              <p>
                Bienvenido a TuTiendaWeb (&quot;el Sitio&quot;). Al acceder y
                utilizar nuestro Sitio, aceptas y te comprometes a cumplir con
                los siguientes Términos y Condiciones. Si no estás de acuerdo
                con estos términos, por favor, no utilices el Sitio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                2. Definiciones
              </h2>
              <p>
                <strong>Sitio:</strong> La página web ubicada en{" "}
                <a
                  href="http://www.tutiendaweb.com.ar"
                  className="text-blue-500 underline"
                >
                  www.tutiendaweb.com.ar
                </a>
                .
              </p>
              <p>
                <strong>Usuario:</strong> Cualquier persona que acceda y utilice
                el Sitio.
              </p>
              <p>
                <strong>Nosotros:</strong> TuTiendaWeb.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                3. Registro
              </h2>
              <p>
                Para acceder a ciertas funcionalidades del Sitio, es posible que
                debas registrarte proporcionando información personal verídica y
                completa. Al registrarte, aceptas mantener la confidencialidad
                de tu información de inicio de sesión y ser responsable de todas
                las actividades que ocurran bajo tu cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                4. Protección de Datos Personales
              </h2>
              <p>
                Respetamos la privacidad de nuestros usuarios y manejamos sus
                datos personales conforme a la Ley de Protección de Datos
                Personales (Ley Nº 25.326) de Argentina.
              </p>
              <ul className="list-disc list-inside">
                <li>
                  <strong>Información Recopilada:</strong> Recopilamos los
                  siguientes datos personales: Nombre de usuario, Nombre del
                  local, Dirección de correo electrónico, Número de contacto.
                </li>
                <li>
                  <strong>Uso de la Información:</strong> Utilizamos tus datos
                  personales para proporcionar y mejorar nuestros servicios,
                  comunicarnos contigo sobre actualizaciones, ofertas y
                  promociones, personalizar tu experiencia en el Sitio.
                </li>
                <li>
                  <strong>Almacenamiento y Seguridad:</strong> Tomamos medidas
                  razonables para proteger tus datos personales contra el acceso
                  no autorizado, la pérdida o la alteración.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                5. Derechos del Usuario
              </h2>
              <p>
                Tienes derecho a acceder, rectificar, actualizar y eliminar tus
                datos personales. Para ejercer estos derechos, puedes
                contactarnos a través de los medios proporcionados en el Sitio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                6. Modificaciones a los Términos y Condiciones
              </h2>
              <p>
                Nos reservamos el derecho de modificar estos Términos y
                Condiciones en cualquier momento. Las modificaciones serán
                efectivas desde el momento de su publicación en el Sitio. Te
                recomendamos revisar estos términos periódicamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                7. Ley Aplicable y Jurisdicción
              </h2>
              <p>
                Estos Términos y Condiciones se rigen por las leyes de la
                República Argentina. Cualquier disputa que surja en relación con
                estos términos estará sujeta a la jurisdicción exclusiva de los
                tribunales competentes de la Ciudad de Buenos Aires.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                8. Contacto
              </h2>
              <p>
                Si tienes alguna pregunta o inquietud sobre estos Términos y
                Condiciones, puedes contactarnos a través de nuestro correo
                electrónico:{" "}
                <a
                  href="mailto:soporte@tutiendaweb.com.ar"
                  className="text-blue-500 underline"
                >
                  tutiendaweboficial@gmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                9. Responsabilidades del Usuario
              </h2>
              <p>
                Como usuario, te comprometes a utilizar el Sitio de manera
                responsable y a no realizar ninguna acción que pueda dañar,
                sobrecargar o deteriorar el funcionamiento del Sitio o de los
                servicios proporcionados. Además, te comprometes a no utilizar
                el Sitio con fines ilegales o no autorizados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                10. Propiedad Intelectual
              </h2>
              <p>
                Todos los derechos de propiedad intelectual sobre el contenido,
                diseño y código fuente del Sitio pertenecen a TuTiendaWeb o a
                terceros que han autorizado su uso. Queda prohibida la
                reproducción, distribución o modificación del contenido sin
                autorización previa y por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                11. Limitación de Responsabilidad
              </h2>
              <p>
                En la medida permitida por la ley, TuTiendaWeb no será
                responsable por cualquier daño directo, indirecto, incidental o
                consecuente que surja del uso o la imposibilidad de uso del
                Sitio o de los servicios ofrecidos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600 text-center lg:text-left">
                12. Indemnización
              </h2>
              <p>
                Aceptas indemnizar y mantener indemne a TuTiendaWeb y sus
                afiliados, directores, empleados y agentes de cualquier reclamo,
                demanda o daño, incluyendo honorarios razonables de abogados,
                que surjan de tu uso del Sitio o de la violación de estos
                Términos y Condiciones.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
