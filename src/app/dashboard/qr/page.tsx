/**
 * Página principal del módulo QR
 * 
 * Esta página simplemente importa y renderiza el QRModule
 * siguiendo los principios de Feature-Sliced Design.
 * 
 * @module app/dashboard/qr
 */

import QRModule from '@/features/dashboard/modules/qr/components/QRModule';

/**
 * Página del dashboard para generar códigos QR
 */
const QRPage = () => {
  return <QRModule />;
};

export default QRPage;
