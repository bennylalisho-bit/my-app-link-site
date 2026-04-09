import { X, AlertTriangle, Trash2 } from "lucide-react";
import React from "react";

interface BusColumnProps {
  id: string;
  uniquePrefix: string;
  assignments: Record<string, string>;
  notes: Record<string, string>;
  onAssign: (key: string, name: string) => void;
  onNoteChange: (value: string) => void;
  onTitleChange?: (value: string) => void;
  checkDuplicate: (name: string) => boolean;
  onClear: () => void;
  onDeleteColumn?: () => void;
  allEmployees: string[];
  selectedNames: string[];
  onToggleSelect: (name: string) => void;
  onDropNames: (targetPrefix: string, startIndex: number) => void;
  isReadOnly?: boolean;
  searchQuery?: string;
  highlightedNames?: string[];
  onToggleHighlight?: (name: string) => void;
  baseColor?: string; // הוספנו אפשרות לקבל צבע רקע
}

export function BusColumn({
  id, uniquePrefix, assignments, notes, onAssign, onNoteChange, onTitleChange,
  checkDuplicate, onClear, onDeleteColumn, allEmployees, selectedNames,
  onToggleSelect, onDropNames, isReadOnly, searchQuery,
  highlightedNames = [], onToggleHighlight, baseColor = "bg-white"
}: BusColumnProps) {
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);
  const note = notes[uniquePrefix] || "";

  // בדיקה אם יש מנוחה
  const hasMenucha = rows.some(rowNum => assignments[`${uniquePrefix}-${rowNum}`]?.trim() === "מנוחה");
  
  // אם יש מנוחה נשים אפור כהה, אחרת נשתמש בצבע הבסיס שקיבלנו מ-App.tsx
  const columnBgClass = hasMenucha ? "bg-gray-300" : baseColor;

  const focusNextRow = (currentIndex: number) => {
    const nextId = `input-${uniquePrefix}-${currentIndex + 1}`;
    const nextEl = document.getElementById(nextId);
    if (nextEl) nextEl.focus();
  };

  return (
    <div className={`${columnBgClass} border border-gray-300 w-[80px] flex-shrink-0 flex flex-col h-[380px] transition-colors duration-300`}>
      
      {/* --- כותרת העמודה --- */}
      <div className={`p-1 text-center border-b border-gray-400 flex justify-between items-center ${selectedNames.length > 0 ? "bg-green-600 text-white" : hasMenucha ? "bg-gray-600 text-white" : "bg-blue-800 text-white"}`}>
        {!isReadOnly && onDeleteColumn ? (
          <button onClick={(e) => { e.stopPropagation(); onDeleteColumn(); }} className="text-red-300 hover:text-red-100">
            <Trash2 size={10} />
          </button>
        ) : <div className="w-3"></div>}
        
        <div className="w-full text-center">
          {onTitleChange && !isReadOnly ? (
            <input 
              type="text" 
              value={id} 
              onChange={(e) => onTitleChange(e.target.value)} 
              className="bg-transparent text-white font-black text-lg text-center w-full focus:outline-none" 
            />
          ) : (
            <span className="text-lg font-black">{id}</span>
          )}
        </div>
        
        {!isReadOnly && <button onClick={onClear} className="hover:text-gray-300"><X size={10} /></button>}
      </div>

      {/* --- גוף הטבלה (שורות נוסעים) --- */}
      <div className={`flex-1 flex flex-col`}>
        {rows.map((rowNum) => {
          const key = `${uniquePrefix}-${rowNum}`;
          const name = assignments[key] || "";
          
          const isMenucha = name.trim() === "מנוחה";
          const isDup = !isMenucha && checkDuplicate(name);
          
          const isSelected = selectedNames.includes(name) && name !== "";
          const isHighlighted = highlightedNames.includes(name) && name !== "";
          
          const isExactMatch = allEmployees.includes(name);
          const shouldShowList = name.length >= 1 && !isExactMatch;

          let bgColorClass = "";
          if (searchQuery && name.includes(searchQuery)) {
            bgColorClass = "bg-yellow-200"; // חיפוש
          } else if (isSelected) {
            bgColorClass = "bg-blue-100";   // העברה
          } else if (isHighlighted) {
            bgColorClass = "bg-orange-300"; // לחיצה ימנית
          }

          return (
            <div 
              key={key} 
              className={`flex-1 flex items-center border-b ${hasMenucha ? 'border-gray-400' : 'border-gray-200'} relative ${bgColorClass}`}
            >
              <input
                id={`input-${uniquePrefix}-${rowNum}`}
                type="text" 
                value={name} 
                onChange={(e) => onAssign(key, e.target.value)}
                list={shouldShowList ? "employee-list" : ""}
                disabled={isReadOnly}
                title=""
                autoComplete="off"
                spellCheck={false}
                className={`w-full h-full bg-transparent border-none text-center font-black text-xl focus:ring-0 p-0 ${(isDup || isMenucha) ? "text-red-600" : "text-gray-900"}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTimeout(() => focusNextRow(rowNum), 50);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation(); 
                  if (isReadOnly) return;

                  if (!name) {
                    onDropNames(uniquePrefix, rowNum);
                  } else {
                    onToggleSelect(name);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault(); 
                  e.stopPropagation();
                  (e.target as HTMLInputElement).blur(); 
                  if (isReadOnly || !name || !onToggleHighlight) return;
                  onToggleHighlight(name);
                }}
              />
              {isDup && <AlertTriangle size={10} className="text-red-500 absolute left-0 pointer-events-none" />}
            </div>
          );
        })}
      </div>

      {/* --- שורת הערה תחתונה --- */}
      <div className={`h-8 border-t border-gray-400 ${hasMenucha ? "bg-gray-400" : "bg-yellow-50"}`}>
        <input 
          type="text" 
          value={note} 
          onChange={(e) => onNoteChange(e.target.value)} 
          className="w-full h-full text-lg font-bold text-center bg-transparent focus:outline-none" 
          disabled={isReadOnly} 
        />
      </div>
    </div>
  );
}