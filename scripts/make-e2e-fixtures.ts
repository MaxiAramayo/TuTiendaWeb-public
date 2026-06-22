/**
 * Genera los fixtures .xlsx usados por el spec E2E de import (05-import.spec.ts).
 *
 * Uso: npm run make:e2e-fixtures
 *
 * Los .xlsx generados se commitean en e2e/fixtures/ para que CI no dependa de
 * este script. Re-ejecutar solo si cambian las columnas que espera
 * `productImportRowSchema` (nombre, precio, categoria obligatorias).
 */
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';

const COLUMNS = ['nombre', 'descripcion', 'precio', 'costo', 'categoria', 'subcategoria', 'tags', 'activo', 'extras'];

const FIXTURES_DIR = path.join(__dirname, '..', 'e2e', 'fixtures');

function writeWorkbook(fileName: string, rows: (string | number)[][]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([COLUMNS, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, path.join(FIXTURES_DIR, fileName));
  console.log(`✅ ${fileName} (${rows.length} filas)`);
}

function main() {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  // Todas las filas válidas → import completo.
  writeWorkbook('productos-validos.xlsx', [
    ['Te Verde E2E', 'Infusion natural', 2500, 1000, 'Infusiones', '', 'nuevo', 'si', ''],
    ['Cafe E2E', 'Molido premium', 3500, 1500, 'Infusiones', 'Calientes', 'oferta', 'si', 'Leche:300'],
  ]);

  // Mezcla: 1 fila válida + 1 inválida (sin nombre ni precio).
  writeWorkbook('productos-invalidos.xlsx', [
    ['Valido E2E', 'fila correcta', 1500, 500, 'Varios', '', '', 'si', ''],
    ['', 'fila sin nombre ni precio', '', '', '', '', '', '', ''],
  ]);

  console.log('\n🎉 Fixtures E2E generados en e2e/fixtures/');
}

main();
