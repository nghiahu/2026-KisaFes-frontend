import { useState, useEffect } from 'react';

export function useProjectColumns(projectId: string) {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem(`project_list_columns_${projectId || 'default'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse columns from localStorage", e);
      }
    }
    return [
      { id: 'checkbox', label: '', width: 48, minWidth: 48, unmovable: true },
      { id: 'work', label: 'Work', width: 350, minWidth: 150, unmovable: true },
      { id: 'assignee', label: 'Assignee', width: 192, minWidth: 70 },
      { id: 'reporter', label: 'Reporter', width: 192, minWidth: 70 },
      { id: 'priority', label: 'Priority', width: 144, minWidth: 70 },
      { id: 'status', label: 'Status', width: 144, minWidth: 70 },
      { id: 'resolution', label: 'Resolution', width: 128, minWidth: 70 },
      { id: 'created', label: 'Created', width: 176, minWidth: 70 },
      { id: 'updated', label: 'Updated', width: 176, minWidth: 70 },
      { id: 'dueDate', label: 'Due date', width: 144, minWidth: 70 },
      { id: 'actions', label: '', width: 48, minWidth: 48, unmovable: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem(`project_list_columns_${projectId || 'default'}`, JSON.stringify(columns));
  }, [columns, projectId]);

  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (colId !== dragOverColId) {
      setDragOverColId(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggedColId || draggedColId === targetColId) return;

    setColumns(prev => {
      const oldIndex = prev.findIndex(c => c.id === draggedColId);
      const newIndex = prev.findIndex(c => c.id === targetColId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const newCols = [...prev];
      const [removed] = newCols.splice(oldIndex, 1);
      newCols.splice(newIndex, 0, removed);
      return newCols;
    });
    setDraggedColId(null);
  };

  const handleResizeStart = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColId(colId);
    setStartX(e.clientX);
    setStartWidth(currentWidth);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColId) return;
      const dx = e.clientX - startX;
      setColumns(prev => prev.map(col => {
        if (col.id === resizingColId) {
          const newWidth = Math.max(col.minWidth || 100, startWidth + dx);
          return { ...col, width: newWidth };
        }
        return col;
      }));
    };

    const handleMouseUp = () => {
      if (resizingColId) {
        setResizingColId(null);
      }
    };

    if (resizingColId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColId, startX, startWidth]);

  return {
    columns,
    setColumns,
    resizingColId,
    draggedColId,
    dragOverColId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleResizeStart
  };
}
