"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    FolderTree,
    Loader2,
} from 'lucide-react';
import type { Category } from '@/shared/types/firebase.types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
} from '../actions/category.actions';

type CategoryNode = Category & { children: Category[] };

interface DeleteTarget {
    cat: Category;
    isParent: boolean;
    /** subcategorías conocidas desde el árbol (solo para principales) */
    childrenCount: number;
}

interface CategoriesManagerProps {
    initialTree: CategoryNode[];
}

export default function CategoriesManager({ initialTree }: CategoriesManagerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [tree, setTree] = useState<CategoryNode[]>(initialTree);
    const [newParent, setNewParent] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // Edición inline (categoría o subcategoría)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Confirmación de borrado (modal)
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    // Alta de subcategoría por categoría principal
    const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
    const [newSub, setNewSub] = useState('');

    // Re-sincronizar cuando el server revalida (router.refresh)
    useEffect(() => {
        setTree(initialTree);
    }, [initialTree]);

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const run = (fn: () => Promise<void>) => {
        startTransition(async () => {
            await fn();
        });
    };

    const handleCreateParent = () => {
        const name = newParent.trim();
        if (!name) return;
        run(async () => {
            const res = await createCategoryAction({ name, parentId: null });
            if (res.success) {
                setNewParent('');
                toast.success('Categoría creada');
                router.refresh();
            } else {
                toast.error(res.errors._form?.[0] ?? 'Error al crear la categoría');
            }
        });
    };

    const handleCreateSub = (parentId: string) => {
        const name = newSub.trim();
        if (!name) return;
        run(async () => {
            const res = await createCategoryAction({ name, parentId });
            if (res.success) {
                setNewSub('');
                setAddingSubFor(null);
                setExpanded(prev => new Set(prev).add(parentId));
                toast.success('Subcategoría creada');
                router.refresh();
            } else {
                toast.error(res.errors._form?.[0] ?? 'Error al crear la subcategoría');
            }
        });
    };

    const handleStartEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditValue(cat.name);
    };

    const handleSaveEdit = (id: string) => {
        const name = editValue.trim();
        if (!name) return;
        run(async () => {
            const res = await updateCategoryAction({ id, name });
            if (res.success) {
                setEditingId(null);
                toast.success('Categoría actualizada');
                router.refresh();
            } else {
                toast.error(res.errors._form?.[0] ?? 'Error al actualizar');
            }
        });
    };

    const handleToggleActive = (cat: Category) => {
        run(async () => {
            const res = await updateCategoryAction({ id: cat.id, isActive: !cat.isActive });
            if (res.success) {
                toast.success(cat.isActive ? 'Categoría desactivada' : 'Categoría activada');
                router.refresh();
            } else {
                toast.error(res.errors._form?.[0] ?? 'Error al actualizar');
            }
        });
    };

    const requestDelete = (cat: Category, isParent: boolean, childrenCount = 0) => {
        setDeleteTarget({ cat, isParent, childrenCount });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        const { cat, isParent } = deleteTarget;
        run(async () => {
            const res = await deleteCategoryAction(cat.id);
            if (res.success) {
                toast.success(`${isParent ? 'Categoría' : 'Subcategoría'} eliminada`);
                router.refresh();
            } else {
                toast.error(res.errors._form?.[0] ?? 'No se puede eliminar', { duration: 6000 });
            }
            setDeleteTarget(null);
        });
    };

    const renderEditRow = (cat: Category) => (
        <div className="flex items-center gap-2 flex-1">
            <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(cat.id); }
                    if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
                type="button"
                onClick={() => handleSaveEdit(cat.id)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                title="Guardar"
            >
                <Check className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => setEditingId(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                title="Cancelar"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );

    const actionButtons = (cat: Category, isParent: boolean, childrenCount = 0) => (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => handleToggleActive(cat)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title={cat.isActive ? 'Desactivar' : 'Activar'}
            >
                {cat.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
                type="button"
                onClick={() => handleStartEdit(cat)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Editar"
            >
                <Pencil className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => requestDelete(cat, isParent, childrenCount)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                title="Eliminar"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );

    return (
        <>
        <div className="container mx-auto px-4 py-6 max-w-3xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FolderTree className="w-6 h-6 text-blue-600" />
                    Categorías
                </h1>
                <p className="text-gray-600 mt-1 text-sm">
                    Organizá tu catálogo en categorías principales y subcategorías (máx. 2 niveles).
                </p>
            </div>

            {/* Crear categoría principal */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-2">
                <input
                    value={newParent}
                    onChange={(e) => setNewParent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateParent(); } }}
                    placeholder="Nueva categoría principal (ej: Cargadores)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="button"
                    onClick={handleCreateParent}
                    disabled={isPending || !newParent.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Crear
                </button>
            </div>

            {/* Árbol */}
            {tree.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Todavía no tenés categorías. Creá la primera arriba.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tree.map((parent) => {
                        const isOpen = expanded.has(parent.id);
                        return (
                            <div key={parent.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Fila categoría principal */}
                                <div className="flex items-center gap-2 p-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(parent.id)}
                                        className="p-1 text-gray-400 hover:text-gray-700"
                                        title={isOpen ? 'Contraer' : 'Expandir'}
                                    >
                                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>

                                    {editingId === parent.id ? (
                                        renderEditRow(parent)
                                    ) : (
                                        <>
                                            <span className="flex-1 font-semibold text-gray-900 flex items-center gap-2">
                                                {parent.name}
                                                {parent.children.length > 0 && (
                                                    <span className="text-xs font-normal text-gray-400">
                                                        ({parent.children.length})
                                                    </span>
                                                )}
                                                {!parent.isActive && (
                                                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                                        Inactiva
                                                    </span>
                                                )}
                                            </span>
                                            {actionButtons(parent, true, parent.children.length)}
                                        </>
                                    )}
                                </div>

                                {/* Subcategorías */}
                                {isOpen && (
                                    <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-2 space-y-1">
                                        {parent.children.map((sub) => (
                                            <div key={sub.id} className="flex items-center gap-2 pl-6 py-1.5">
                                                {editingId === sub.id ? (
                                                    renderEditRow(sub)
                                                ) : (
                                                    <>
                                                        <span className="flex-1 text-sm text-gray-700 flex items-center gap-2">
                                                            {sub.name}
                                                            {!sub.isActive && (
                                                                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                    Inactiva
                                                                </span>
                                                            )}
                                                        </span>
                                                        {actionButtons(sub, false)}
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {/* Alta de subcategoría */}
                                        {addingSubFor === parent.id ? (
                                            <div className="flex items-center gap-2 pl-6 py-1.5">
                                                <input
                                                    autoFocus
                                                    value={newSub}
                                                    onChange={(e) => setNewSub(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') { e.preventDefault(); handleCreateSub(parent.id); }
                                                        if (e.key === 'Escape') { setAddingSubFor(null); setNewSub(''); }
                                                    }}
                                                    placeholder="Nombre de subcategoría"
                                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleCreateSub(parent.id)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Crear"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setAddingSubFor(null); setNewSub(''); }}
                                                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                                                    title="Cancelar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => { setAddingSubFor(parent.id); setNewSub(''); }}
                                                className="ml-6 mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Agregar subcategoría
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Modal de confirmación de borrado */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        ¿Eliminar {deleteTarget?.isParent ? 'categoría' : 'subcategoría'}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Vas a eliminar <strong>{deleteTarget?.cat.name}</strong>. Esta acción no se puede deshacer.
                        {deleteTarget?.isParent && deleteTarget.childrenCount > 0 && (
                            <>
                                {' '}Tiene <strong>{deleteTarget.childrenCount}</strong>{' '}
                                subcategoría{deleteTarget.childrenCount !== 1 ? 's' : ''}: primero tenés que
                                eliminarlas (y sus productos).
                            </>
                        )}
                        {' '}Solo se puede eliminar si no tiene productos ni subcategorías asociadas.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isPending ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
