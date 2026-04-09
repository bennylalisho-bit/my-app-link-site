import React, { useState, useRef, useEffect } from "react";
import { X, Trash2, Plus, Zap, ArrowDownToLine } from "lucide-react";

interface FloatingPoolProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  names: string[];
  onRemoveName: (name: string) => void;
  onClearAll: () => void;
  onDropToPool: () => void;
  color: string;
  initialPosition: { x: number; y: number };
  selectedNames: string[];
  onToggleSelect: (name: string) => void;
  isReadOnly?: boolean;
  onAddManualName: (name: string) => void;
  onAutoDistribute?: () => void;
}

export function FloatingPool({
  title,
  isOpen,
  onClose,
  names,
  onRemoveName,
  onClearAll,
  onDropToPool,
  color,
  initialPosition,
  selectedNames,
  onToggleSelect,
  isReadOnly,
  onAddManualName,
  onAutoDistribute,
}: FloatingPoolProps) {
  const [newName, setNewName] = useState("");
  
  // --- לוגיקה לגרירת החלון ---
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const poolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (poolRef.current) {
      setIsDragging(true);
      const rect = poolRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <div
      ref={poolRef}
      className="fixed z-50 flex flex-col bg-white rounded-lg shadow-2xl border border-gray-300 w-64 max-h-[400px]"
      style={{ 
        left: position.x, 
        top: position.y 
      }}
    >
      {/* כותרת - גרירה מכאן (שים לב ל-cursor-move) */}
      <div 
        onMouseDown={handleMouseDown}
        className={`p-2 rounded-t-lg flex justify-between items-center text-white font-bold cursor-move ${color}`}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <span>{title}</span>
          <span className="bg-white/20 px-1.5 rounded-full text-xs">{names.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {!isReadOnly && onAutoDistribute && (
            <button onClick={(e) => { e.stopPropagation(); onAutoDistribute(); }} className="hover:bg-white/20 p-1 rounded" title="שיבוץ אוטומטי">
              <Zap size={16} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:bg-white/20 p-1 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* רשימת שמות */}
      <div className="flex-1 overflow-y-auto p-2 bg-gray-50 min-h-[100px]">
        {names.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-4">המאגר ריק</div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {names.map((name) => {
              const isSelected = selectedNames.includes(name);
              return (
                <div
                  key={name}
                  onClick={() => !isReadOnly && onToggleSelect(name)}
                  className={`
                    relative text-center text-sm py-1 px-2 rounded cursor-pointer select-none border transition-colors
                    ${isSelected 
                      ? `${color} text-white border-transparent shadow-md` 
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"}
                  `}
                >
                  {name}
                  {!isReadOnly && !isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveName(name);
                      }}
                      className="absolute top-0 left-0 text-gray-300 hover:text-red-500 p-0.5"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* אזור פעולות תחתון */}
      {!isReadOnly && (
        <div className="p-2 border-t bg-gray-100 rounded-b-lg space-y-2">
          {/* הוספה ידנית */}
          <div className="flex gap-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onAddManualName(newName);
                  setNewName("");
                }
              }}
              placeholder="הוסף שם..."
              className="flex-1 text-sm px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                onAddManualName(newName);
                setNewName("");
              }}
              className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex justify-between gap-2">
            <button
              onClick={onDropToPool}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-blue-700 text-xs py-1 rounded hover:bg-blue-200 border border-blue-200 font-bold"
              title="הורד מסומנים לכאן"
            >
              <ArrowDownToLine size={14} /> משוך מסומנים
            </button>
            <button
              onClick={() => {
                if (confirm("לנקות את כל המאגר?")) onClearAll();
              }}
              className="px-2 bg-red-100 text-red-600 rounded hover:bg-red-200 border border-red-200"
              title="נקה הכל"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}