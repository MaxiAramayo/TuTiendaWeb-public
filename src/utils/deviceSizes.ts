/**
 * Verifica si el dispositivo actual es desktop
 * @returns {boolean} true si el ancho de pantalla es mayor a 720px
 */
export const isDesktop = (): boolean => {
  if (window.innerWidth > 720) return true;
  return false;
};
