import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../../../../../assets/icons';
import { useProjectList } from './ProjectListContext';
import { useLanguage } from '../../../../../contexts/LanguageContext';

export function ProjectListPagination() {
  const {
    tasksState: {
      currentPage,
      setCurrentPage,
      itemsPerPage,
      setItemsPerPage,
      totalElements,
      totalPages,
      startIndex
    },
    filtersState: { filteredTasks }
  } = useProjectList();

  const { t } = useLanguage();

  const [isItemsPerPageOpen, setIsItemsPerPageOpen] = useState(false);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemsPerPageRef.current && !itemsPerPageRef.current.contains(event.target as Node)) {
        setIsItemsPerPageOpen(false);
      }
    };
    if (isItemsPerPageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isItemsPerPageOpen]);

  const endIndex = Math.min(startIndex + filteredTasks.length, totalElements);
  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t('list.showing_pagination')
            .replace('{start}', String(totalElements === 0 ? 0 : startIndex + 1))
            .replace('{end}', String(endIndex))
            .replace('{total}', String(totalElements))}
        </span>
        <div className="relative" ref={itemsPerPageRef}>
          <button
            onClick={() => setIsItemsPerPageOpen(!isItemsPerPageOpen)}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-muted-foreground border border-border rounded-md hover:bg-background transition-colors"
          >
            {itemsPerPage}{t('list.per_page')}
            <Icons.chevronDown size={12} className="text-muted-foreground" />
          </button>
          {isItemsPerPageOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-24 bg-card border border-border shadow-lg rounded-md py-1 z-50">
              {[10, 20, 50, 100].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                    setIsItemsPerPageOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                    itemsPerPage === size ? 'bg-blue-50 text-blue-600 font-bold' : 'text-muted-foreground hover:bg-background font-medium'
                  }`}
                >
                  {size}{t('list.per_page')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={validCurrentPage === 1}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <Icons.chevronLeft size={16} />
        </button>
        <span className="text-[11px] font-bold text-muted-foreground min-w-[32px] text-center">
          {validCurrentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={validCurrentPage === totalPages}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <Icons.chevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
