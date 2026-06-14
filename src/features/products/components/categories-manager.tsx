"use client";

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
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
    GripVertical,
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
    reorderCategoriesAction,
} from '../actions/category.actions';

type CategoryNode = Category & { children: Category[] };

/** Props del handle que dnd-kit conecta al elemento que inicia el arrastre. */
type HandleProps = {
    attributes: React.HTMLAttributes<HTMLButtonElement>;
    listeners: Record<string, Function> | undefined;
};

/**
 * Handle de arrastre (ícono). Recibe los `attributes`/`listeners` de useSortable;
 * solo este botón inicia el drag, el resto de la fila queda clickeable.
 */
function DragHandle({ attributes, listeners }: HandleProps) {
    return (
        <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-grab active:cursor-grabbing touch-none"
            title="Arrastrar para reordenar"
            aria-label="Reordenar"
            {...attributes}
            {...listeners}
        >
            <GripVertical className="w-4 h-4" />
        </button>
    );
}

/**
 * Fila ordenable con dnd-kit. Expone los props del handle vía render-prop para
 * ubicarlo dentro de la fila; el contenedor aplica el transform durante el drag.
 */
function SortableRow({
    id,
    children,
}: {
    id: string;
    children: (handle: HandleProps) => React.ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        position: 'relative',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? 'rounded-xl shadow-xl ring-2 ring-blue-400 opacity-95' : ''}
        >
            {children({ attributes: attributes as React.HTMLAttributes<HTMLButtonElement>, listeners })}
        </div>
    );
}

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

    // Orden: cambios locales sin guardar (se persisten con el botón "Guardar orden")
    const [orderDirty, setOrderDirty] = useState(false);
    const [moveCount, setMoveCount] = useState(0);
    // Último árbol persistido, para poder "Descartar" y volver atrás.
    const lastSavedRef = useRef(initialTree);

    // Espejo del árbol para leer el orden actual en callbacks de drag (evita closures viejas)
    const treeRef = useRef(tree);
    useEffect(() => {
        treeRef.current = tree;
    }, [tree]);

    // Re-sincronizar cuando el server revalida (router.refresh tras crear/editar/borrar)
    useEffect(() => {
        setTree(initialTree);
        lastSavedRef.current = initialTree;
        setOrderDirty(false);
        setMoveCount(0);
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

    // --- Reordenamiento (drag & drop con dnd-kit) ---

    // distance:5 evita que un click en la fila dispare un arrastre accidental.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    /** Marca un movimiento: incrementa el contador y refresca el aviso (toast único). */
    const markMoved = (nextCount: number) => {
        setOrderDirty(true);
        setMoveCount(nextCount);
        toast(`Orden modificado (${nextCount}) · guardá para aplicar`, {
            id: 'reorder-dirty',
            icon: <GripVertical className="w-4 h-4" />,
            duration: 2500,
        });
    };

    /** Soltó una categoría principal: reordena el árbol en local (sin guardar). */
    const handleParentsDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const current = treeRef.current;
        const oldIndex = current.findIndex((p) => p.id === active.id);
        const newIndex = current.findIndex((p) => p.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        setTree(arrayMove(current, oldIndex, newIndex));
        markMoved(moveCount + 1);
    };

    /** Soltó una subcategoría dentro de un padre: reordena sus hijos en local. */
    const handleChildrenDragEnd = (parentId: string, event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const parent = treeRef.current.find((p) => p.id === parentId);
        if (!parent) return;
        const oldIndex = parent.children.findIndex((c) => c.id === active.id);
        const newIndex = parent.children.findIndex((c) => c.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        const nextChildren = arrayMove(parent.children, oldIndex, newIndex);
        setTree((prev) =>
            prev.map((p) => (p.id === parentId ? { ...p, children: nextChildren } : p))
        );
        markMoved(moveCount + 1);
    };

    /** Aplana el árbol a pares { id, order } (índice por nivel) para una sola escritura. */
    const buildOrderItems = (t: CategoryNode[]) => {
        const items: { id: string; order: number }[] = [];
        t.forEach((parent, i) => {
            items.push({ id: parent.id, order: i });
            parent.children.forEach((child, j) => items.push({ id: child.id, order: j }));
        });
        return items;
    };

    /** Guarda todo el orden (principales + subcategorías) en una sola operación batch. */
    const handleSaveOrder = () => {
        const snapshot = treeRef.current;
        const items = buildOrderItems(snapshot);
        if (items.length === 0) return;
        run(async () => {
            const res = await reorderCategoriesAction(items);
            if (res.success) {
                lastSavedRef.current = snapshot;
                setOrderDirty(false);
                setMoveCount(0);
                toast.success('Orden guardado', { id: 'reorder-dirty' });
            } else {
                toast.error(res.errors._form?.[0] ?? 'Error al guardar el orden', { id: 'reorder-dirty' });
            }
        });
    };

    /** Descarta los cambios de orden y vuelve al último guardado. */
    const handleDiscardOrder = () => {
        setTree(lastSavedRef.current);
        setOrderDirty(false);
        setMoveCount(0);
        toast('Cambios de orden descartados', { id: 'reorder-dirty' });
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
                <>
                {/* Tip de reordenamiento */}
                <div className="mb-3 flex items-center gap-2 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <GripVertical className="w-4 h-4 shrink-0 text-blue-500" />
                    <span>
                        Arrastrá desde el ícono <strong>⠿</strong> para ordenar cómo se ven las
                        categorías en tu tienda. Después tocá <strong>Guardar orden</strong>.
                    </span>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    onDragEnd={handleParentsDragEnd}
                >
                    <SortableContext items={tree.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                    {tree.map((parent) => {
                        const isOpen = expanded.has(parent.id);
                        return (
                            <SortableRow key={parent.id} id={parent.id}>
                                {(handle) => (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Fila categoría principal */}
                                <div className="flex items-center gap-2 p-3">
                                    <DragHandle {...handle} />
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
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                                            onDragEnd={(e) => handleChildrenDragEnd(parent.id, e)}
                                        >
                                            <SortableContext
                                                items={parent.children.map((c) => c.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                            <div className="space-y-1">
                                            {parent.children.map((sub) => (
                                                <SortableRow key={sub.id} id={sub.id}>
                                                    {(subHandle) => (
                                                        <div className="flex items-center gap-2 pl-3 py-1.5">
                                                            <DragHandle {...subHandle} />
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
                                                    )}
                                                </SortableRow>
                                            ))}
                                            </div>
                                            </SortableContext>
                                        </DndContext>

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
                                )}
                            </SortableRow>
                        );
                    })}
                    </div>
                    </SortableContext>
                </DndContext>
                </>
            )}

            {/* Espacio para que la barra fija no tape la última fila */}
            {orderDirty && <div className="h-20" />}
        </div>

        {/* Barra fija: guardar / descartar el nuevo orden */}
        {orderDirty && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
                <div className="container mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-700">
                        Tenés <strong>{moveCount}</strong> cambio{moveCount !== 1 ? 's' : ''} de orden sin guardar.
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDiscardOrder}
                            disabled={isPending}
                            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                        >
                            Descartar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveOrder}
                            disabled={isPending}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Guardar orden
                        </button>
                    </div>
                </div>
            </div>
        )}

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
