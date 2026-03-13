import { MapPin, Eye, Target } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Encabezado */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Acerca de Nosotros</h1>
        <p className="text-gray-500 mt-2">Escuela de Educación Básica Particular José de Villamil</p>
      </div>

      {/* Misión */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Misión</h2>
          <p className="text-gray-600 leading-relaxed">
            Entregar al País estudiantes con formación de talento humano, que proporcionen valores,
            criterios de vida, que tengan horizontes claros, emprendedores y que puedan desenvolverse
            eficazmente en el futuro.
          </p>
        </div>
      </div>

      {/* Visión */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        >
          <Eye className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Visión</h2>
          <p className="text-gray-600 leading-relaxed">
            Nuestro fin fue constituirnos en una institución innovadora, con un eminente espíritu de
            amor, solidaridad y responsabilidad, basado en el lema "promover educación intercultural
            e inclusiva y fortalecer el desarrollo de líderes que resuelven sus conflictos de manera
            pacífica y que vivan en la armonía con la naturaleza". El significado de nuestro fiel
            compromiso es proporcionar a los estudiantes una educación de calidad, que se mantiene a
            la vanguardia de los adelantos pedagógicos y tecnológicos, pioneros en el cumplimiento de
            los estándares educativos para que se desenvuelvan como personas honestas y capaces en la
            sociedad.
          </p>
        </div>
      </div>

      {/* Dirección y Mapa */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Dirección</h2>
            <p className="text-gray-600 text-sm">
              Guasmo sur Coop. Mariuxi Febres Cordero Mz 1678 Sl.8-10, Guayaquil
            </p>
          </div>
        </div>

        {/* Google Maps embed */}
        <div className="rounded-xl overflow-hidden border border-gray-200 h-80">
          <iframe
            title="Ubicación Escuela José de Villamil"
            src="https://maps.google.com/maps?q=Escuela+de+Educacion+Basica+Particular+Jose+de+Villamil,+Guayaquil,+Ecuador&output=embed&hl=es&z=17"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Si el mapa no carga correctamente, puedes buscar "Escuela de Educación Básica Particular José de Villamil" en Google Maps.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
