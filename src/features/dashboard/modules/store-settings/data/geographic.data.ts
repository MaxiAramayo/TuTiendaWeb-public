/**
 * Datos geográficos de Argentina y países vecinos
 * 
 * Contiene provincias, ciudades y códigos de país
 * para ser utilizados en formularios de dirección
 */

/**
 * Provincias de Argentina
 */
export const PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
  'Ciudad Autónoma de Buenos Aires'
] as const;

/**
 * Ciudades principales por provincia
 */
export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'Buenos Aires': [
    'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría', 
    'Pergamino', 'Junín', 'Azul', 'Necochea', 'San Nicolás', 'Campana',
    'Quilmes', 'Lanús', 'San Isidro', 'Vicente López', 'Tigre', 'Morón'
  ],
  'Córdoba': [
    'Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 
    'San Francisco', 'Alta Gracia', 'Jesús María', 'Bell Ville'
  ],
  'Santa Fe': [
    'Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto', 'Reconquista',
    'Villa Gobernador Gálvez', 'Esperanza', 'Santo Tomé'
  ],
  'Mendoza': [
    'Mendoza', 'San Rafael', 'Godoy Cruz', 'Maipú', 'Luján de Cuyo',
    'Rivadavia', 'Las Heras', 'San Martín'
  ],
  'Tucumán': [
    'San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Banda del Río Salí',
    'Concepción', 'Aguilares', 'Monteros'
  ],
  'Salta': [
    'Salta', 'San Ramón de la Nueva Orán', 'Tartagal', 'Metán',
    'Cafayate', 'General Güemes', 'Rosario de Lerma'
  ],
  'Misiones': [
    'Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apostoles',
    'Montecarlo', 'Leandro N. Alem'
  ],
  'Chaco': [
    'Resistencia', 'Barranqueras', 'Fontana', 'Puerto Vilelas',
    'Presidencia Roque Sáenz Peña', 'Villa Ángela'
  ],
  'Corrientes': [
    'Corrientes', 'Goya', 'Mercedes', 'Paso de los Libres',
    'Monte Caseros', 'Bella Vista', 'Esquina'
  ],
  'Entre Ríos': [
    'Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay',
    'Victoria', 'Villaguay', 'Crespo'
  ],
  'Formosa': [
    'Formosa', 'Clorinda', 'Pirané', 'El Colorado',
    'Ingeniero Juárez', 'Las Lomitas'
  ],
  'Jujuy': [
    'San Salvador de Jujuy', 'Palpalá', 'San Pedro', 'Libertador General San Martín',
    'Perico', 'El Carmen', 'Monterrico'
  ],
  'La Pampa': [
    'Santa Rosa', 'General Pico', 'Toay', 'Realicó',
    'Eduardo Castex', 'Ingeniero Luiggi'
  ],
  'La Rioja': [
    'La Rioja', 'Chilecito', 'Aimogasta', 'Chepes',
    'Chamical', 'Villa Unión'
  ],
  'Neuquén': [
    'Neuquén', 'San Martín de los Andes', 'Villa La Angostura', 'Zapala',
    'Cutral Có', 'Plaza Huincul', 'Centenario'
  ],
  'Río Negro': [
    'Viedma', 'San Carlos de Bariloche', 'General Roca', 'Cipolletti',
    'Villa Regina', 'Río Colorado', 'Catriel'
  ],
  'San Juan': [
    'San Juan', 'Chimbas', 'Rivadavia', 'Santa Lucía',
    'Pocito', 'Rawson', 'Caucete'
  ],
  'San Luis': [
    'San Luis', 'Villa Mercedes', 'Merlo', 'La Punta',
    'Justo Daract', 'Concarán'
  ],
  'Santa Cruz': [
    'Río Gallegos', 'Caleta Olivia', 'Pico Truncado', 'Puerto Deseado',
    'El Calafate', 'Río Turbio', 'Puerto San Julián'
  ],
  'Santiago del Estero': [
    'Santiago del Estero', 'La Banda', 'Termas de Río Hondo', 'Fernández',
    'Frías', 'Monte Quemado', 'Añatuya'
  ],
  'Tierra del Fuego': [
    'Ushuaia', 'Río Grande', 'Tolhuin'
  ],
  'Catamarca': [
    'San Fernando del Valle de Catamarca', 'Andalgalá', 'Belén', 'Santa María',
    'Tinogasta', 'Recreo'
  ],
  'Chubut': [
    'Rawson', 'Comodoro Rivadavia', 'Puerto Madryn', 'Trelew',
    'Esquel', 'Puerto Deseado'
  ],
  'Ciudad Autónoma de Buenos Aires': [
    'CABA'
  ]
};

/**
 * Países disponibles con códigos y banderas
 */
export const COUNTRIES = [
  { value: "Argentina", label: "🇦🇷 Argentina", code: "AR" },
  { value: "Chile", label: "🇨🇱 Chile", code: "CL" },
  { value: "Uruguay", label: "🇺🇾 Uruguay", code: "UY" },
  { value: "Paraguay", label: "🇵🇾 Paraguay", code: "PY" },
  { value: "Bolivia", label: "🇧🇴 Bolivia", code: "BO" },
  { value: "Brasil", label: "🇧🇷 Brasil", code: "BR" },
  { value: "Colombia", label: "🇨🇴 Colombia", code: "CO" },
  { value: "Perú", label: "🇵🇪 Perú", code: "PE" },
] as const;

/**
 * Códigos de país para WhatsApp
 */
export const COUNTRY_CODES = [
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
] as const;

/**
 * Tipos derivados
 */
export type Province = typeof PROVINCES[number];
export type Country = typeof COUNTRIES[number]['value'];
export type CountryCode = typeof COUNTRY_CODES[number]['code'];

/**
 * Funciones utilitarias
 */

/**
 * Obtiene las ciudades de una provincia
 */
export const getCitiesByProvince = (province: string): string[] => {
  return CITIES_BY_PROVINCE[province] || [];
};

/**
 * Verifica si una provincia existe
 */
export const isValidProvince = (province: string): boolean => {
  return PROVINCES.includes(province as Province);
};

/**
 * Verifica si una ciudad existe en una provincia
 */
export const isValidCity = (city: string, province: string): boolean => {
  const cities = getCitiesByProvince(province);
  return cities.includes(city);
};

/**
 * Obtiene información de un país por su código
 */
export const getCountryByCode = (code: string) => {
  return COUNTRIES.find(country => country.code === code);
};

/**
 * Obtiene información de código de país por código
 */
export const getCountryCodeInfo = (code: string) => {
  return COUNTRY_CODES.find(country => country.code === code);
};