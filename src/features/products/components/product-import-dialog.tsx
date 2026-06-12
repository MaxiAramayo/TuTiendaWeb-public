"use client";

import React, { useRef, useState, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Download, AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { productImportRowSchema, MAX_IMPORT_PRODUCTS } from '../schemas/product-import.schema';
import { importProductsAction } from '../actions/product-import.actions';
import type { ParsedRowResult, ProductImportRowRaw } from '../schemas/product-import.schema';

interface ProductImportDialogProps {
    onClose: () => void;
    onSuccess: () => void;
    currentProductCount: number;
}

const TEMPLATE_COLUMNS = ['nombre', 'descripcion', 'precio', 'costo', 'categoria', 'subcategoria', 'tags', 'activo'];

const TEMPLATE_EXAMPLE = [
    ['Hamburguesa Clásica', 'Con lechuga, tomate y queso', 1500, 800, 'Hamburguesas', 'Clásicas', 'oferta, especial', 'si'],
    ['Papas Fritas', 'Porción grande', 600, 200, 'Acompañamientos', '', '', 'si'],
];

function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, ...TEMPLATE_EXAMPLE]);
    // Ancho de columnas
    ws['!cols'] = TEMPLATE_COLUMNS.map((_, i) => ({ wch: i === 1 ? 30 : 18 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
}

function parseExcelFile(file: File): Promise<ProductImportRowRaw[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const wb = XLSX.read(data, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
                // Normalizar claves a lowercase sin espacios extra
                const normalized = rows.map((row) => {
                    const normalized: Record<string, unknown> = {};
                    for (const [k, v] of Object.entries(row)) {
                        normalized[k.toLowerCase().trim()] = v;
                    }
                    return normalized as ProductImportRowRaw;
                });
                resolve(normalized);
            } catch {
                reject(new Error('No se pudo leer el archivo. Asegurate de que sea un .xlsx válido.'));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsBinaryString(file);
    });
}

type Step = 'select' | 'preview' | 'confirm-warnings' | 'importing' | 'done';

export default function ProductImportDialog({ onClose, onSuccess, currentProductCount }: ProductImportDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<Step>('select');
    const [isPending, startTransition] = useTransition();

    const [rawRows, setRawRows] = useState<ProductImportRowRaw[]>([]);
    const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
    const [importResult, setImportResult] = useState<{ created: number; categoriesCreated: number; tagsCreated: number; warnings: string[] } | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const validRows = parsedRows.filter((r): r is Extract<typeof r, { valid: true }> => r.valid);
    const invalidRows = parsedRows.filter((r): r is Extract<typeof r, { valid: false }> => !r.valid);
    const availableSlots = MAX_IMPORT_PRODUCTS - currentProductCount;

    async function handleFile(file: File) {
        setFileError(null);
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setFileError('Solo se admiten archivos .xlsx o .xls');
            return;
        }

        try {
            const rawRows = await parseExcelFile(file);

            if (rawRows.length === 0) {
                setFileError('El archivo no tiene filas de datos.');
                return;
            }

            if (rawRows.length > MAX_IMPORT_PRODUCTS) {
                setFileError(`El archivo tiene ${rawRows.length} filas. El máximo es ${MAX_IMPORT_PRODUCTS}.`);
                return;
            }

            const results: ParsedRowResult[] = rawRows.map((raw, i) => {
                const result = productImportRowSchema.safeParse(raw);
                if (result.success) {
                    return { valid: true, data: result.data, rowIndex: i + 2 };
                }
                const errors = Object.values(result.error.flatten().fieldErrors).flat();
                return { valid: false, errors, rowIndex: i + 2, rawName: String(raw.nombre ?? '') };
            });

            setRawRows(rawRows);
            setParsedRows(results);
            setStep('preview');
        } catch (err) {
            setFileError(err instanceof Error ? err.message : 'Error al procesar el archivo');
        }
    }

    function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // Reset input so the same file can be re-selected
        e.target.value = '';
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }

    function proceedToImport() {
        if (validRows.length === 0) return;

        if (validRows.length > availableSlots) {
            toast.error(`Solo tenés ${availableSlots} espacio${availableSlots !== 1 ? 's' : ''} disponibles (límite ${MAX_IMPORT_PRODUCTS}).`);
            return;
        }

        startTransition(async () => {
            setStep('importing');
            // Enviar filas crudas originales al servidor (rowIndex es i+2, i=rowIndex-2)
            const validRawRows = validRows.map((r) => rawRows[r.rowIndex - 2]);
            const result = await importProductsAction(validRawRows);

            if (result.success) {
                setImportResult(result.data);
                setStep('done');
            } else {
                const msg = result.errors._form?.[0] ?? 'Error al importar';
                toast.error(msg);
                setStep('preview');
            }
        });
    }

    function handleConfirmWithWarnings() {
        proceedToImport();
    }

    function handleImportClick() {
        if (invalidRows.length > 0) {
            setStep('confirm-warnings');
        } else {
            proceedToImport();
        }
    }

    function handleDone() {
        onSuccess();
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Importar productos desde Excel</h2>
                            <p className="text-sm text-gray-500">
                                {currentProductCount} producto{currentProductCount !== 1 ? 's' : ''} en tu tienda · máximo {MAX_IMPORT_PRODUCTS}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* STEP: select */}
                    {step === 'select' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
                                <p className="font-semibold">Columnas del archivo:</p>
                                <p><span className="font-medium">Obligatorias:</span> nombre, precio, categoria</p>
                                <p><span className="font-medium">Opcionales:</span> descripcion, costo, subcategoria, tags (separados por coma), activo (si/no)</p>
                            </div>

                            <button
                                onClick={downloadTemplate}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Descargar plantilla Excel
                            </button>

                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                            >
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700">Arrastrá tu archivo acá o hacé click para seleccionarlo</p>
                                <p className="text-xs text-gray-400 mt-1">.xlsx o .xls</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileInput}
                                />
                            </div>

                            {fileError && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{fileError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP: preview */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            {/* Resumen */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-700">{validRows.length}</p>
                                    <p className="text-xs text-green-600 font-medium">Filas válidas</p>
                                </div>
                                <div className={`border rounded-lg p-3 text-center ${invalidRows.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <p className={`text-2xl font-bold ${invalidRows.length > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{invalidRows.length}</p>
                                    <p className={`text-xs font-medium ${invalidRows.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Filas con errores</p>
                                </div>
                            </div>

                            {/* Alerta de slots */}
                            {validRows.length > availableSlots && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>
                                        Solo tenés {availableSlots} espacio{availableSlots !== 1 ? 's' : ''} disponibles. Tu tienda tiene {currentProductCount} productos y el límite es {MAX_IMPORT_PRODUCTS}.
                                    </span>
                                </div>
                            )}

                            {/* Vista previa de filas válidas */}
                            {validRows.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Vista previa de productos a importar</p>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto max-h-48">
                                            <table className="w-full text-xs">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 text-gray-600 font-semibold">Nombre</th>
                                                        <th className="text-left px-3 py-2 text-gray-600 font-semibold">Categoría</th>
                                                        <th className="text-right px-3 py-2 text-gray-600 font-semibold">Precio</th>
                                                        <th className="text-left px-3 py-2 text-gray-600 font-semibold">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {validRows.slice(0, 50).map((r) => (
                                                        <tr key={r.rowIndex} className="hover:bg-gray-50">
                                                            <td className="px-3 py-1.5 font-medium text-gray-800 max-w-[160px] truncate">{r.data.nombre}</td>
                                                            <td className="px-3 py-1.5 text-gray-600">
                                                                {r.data.categoria}{r.data.subcategoria ? ` / ${r.data.subcategoria}` : ''}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-right text-gray-800">${r.data.precio.toLocaleString('es-AR')}</td>
                                                            <td className="px-3 py-1.5">
                                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.data.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                                    {r.data.activo ? 'Activo' : 'Inactivo'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {validRows.length > 50 && (
                                                        <tr>
                                                            <td colSpan={4} className="px-3 py-2 text-center text-gray-400 italic">
                                                                …y {validRows.length - 50} más
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Filas con errores */}
                            {invalidRows.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-amber-700 mb-2">
                                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                                        Filas con errores (no se importarán)
                                    </p>
                                    <div className="border border-amber-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                                        {invalidRows.map((r) => (
                                            <div key={r.rowIndex} className="px-3 py-2 text-xs border-b border-amber-100 last:border-0 bg-amber-50">
                                                <span className="font-semibold text-amber-800">Fila {r.rowIndex}{r.rawName ? ` (${r.rawName})` : ''}:</span>{' '}
                                                <span className="text-amber-700">{r.errors.join(', ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP: confirm-warnings */}
                    {step === 'confirm-warnings' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold text-amber-800">Hay {invalidRows.length} fila{invalidRows.length !== 1 ? 's' : ''} con errores</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Esas filas no se importarán. ¿Querés continuar con las <strong>{validRows.length}</strong> filas válidas?
                                    </p>
                                </div>
                            </div>
                            <div className="border border-amber-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                {invalidRows.map((r) => (
                                    <div key={r.rowIndex} className="px-3 py-2 text-xs border-b border-amber-100 last:border-0 bg-amber-50">
                                        <span className="font-semibold text-amber-800">Fila {r.rowIndex}{r.rawName ? ` (${r.rawName})` : ''}:</span>{' '}
                                        <span className="text-amber-700">{r.errors.join(', ')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP: importing */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            <p className="text-gray-600 font-medium">Importando {validRows.length} producto{validRows.length !== 1 ? 's' : ''}…</p>
                        </div>
                    )}

                    {/* STEP: done */}
                    {step === 'done' && importResult && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center py-6 gap-3">
                                <CheckCircle2 className="w-14 h-14 text-green-500" />
                                <p className="text-xl font-bold text-gray-900">¡Importación completada!</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-700">{importResult.created}</p>
                                    <p className="text-xs text-green-600 font-medium">Productos creados</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-700">{importResult.categoriesCreated}</p>
                                    <p className="text-xs text-blue-600 font-medium">Categorías nuevas</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-purple-700">{importResult.tagsCreated}</p>
                                    <p className="text-xs text-purple-600 font-medium">Tags nuevos</p>
                                </div>
                            </div>
                            {importResult.warnings.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-sm font-semibold text-amber-700 mb-2">
                                        {importResult.warnings.length} fila{importResult.warnings.length !== 1 ? 's' : ''} omitida{importResult.warnings.length !== 1 ? 's' : ''}:
                                    </p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {importResult.warnings.map((w, i) => (
                                            <p key={i} className="text-xs text-amber-700">{w}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 flex items-center justify-between gap-3">
                    {step === 'select' && (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                Cancelar
                            </button>
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            <button onClick={() => { setStep('select'); setParsedRows([]); setRawRows([]); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                Volver
                            </button>
                            <button
                                onClick={handleImportClick}
                                disabled={validRows.length === 0 || validRows.length > availableSlots}
                                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Importar {validRows.length} producto{validRows.length !== 1 ? 's' : ''}
                            </button>
                        </>
                    )}

                    {step === 'confirm-warnings' && (
                        <>
                            <button onClick={() => setStep('preview')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmWithWarnings}
                                disabled={isPending}
                                className="px-6 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                                Sí, importar {validRows.length} válida{validRows.length !== 1 ? 's' : ''}
                            </button>
                        </>
                    )}

                    {step === 'done' && (
                        <button
                            onClick={handleDone}
                            className="ml-auto px-6 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Ver productos
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
