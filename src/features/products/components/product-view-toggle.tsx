"use client";

import React from 'react';
import { Grid3X3, List } from 'lucide-react';

export type ProductViewType = 'grid' | 'list';

interface ProductViewToggleProps {
    currentView: ProductViewType;
    onViewChange: (view: ProductViewType) => void;
    className?: string;
}

const ProductViewToggle: React.FC<ProductViewToggleProps> = ({
    currentView,
    onViewChange,
    className = ''
}) => {
    return (
        <div className={`flex items-center bg-gray-100 rounded-lg sm:rounded-xl p-1 sm:p-1.5 shadow-sm ${className}`}>
            <button
                onClick={() => onViewChange('grid')}
                className={`flex items-center justify-center px-2 py-1.5 sm:px-4 sm:py-3 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${currentView === 'grid'
                        ? 'bg-white text-blue-600 shadow-md transform scale-105'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                title="Vista de cuadrícula"
            >
                <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Cuadrícula</span>
            </button>

            <button
                onClick={() => onViewChange('list')}
                className={`flex items-center justify-center px-2 py-1.5 sm:px-4 sm:py-3 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${currentView === 'list'
                        ? 'bg-white text-blue-600 shadow-md transform scale-105'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                title="Vista de lista"
            >
                <List className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Lista</span>
            </button>
        </div>
    );
};

export default ProductViewToggle;
