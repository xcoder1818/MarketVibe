import React, { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';

interface EditableTitleProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
}

const EditableTitle: React.FC<EditableTitleProps> = ({ value, onChange, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    if (editValue.trim() !== '') {
      onChange(editValue);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        className={`${className} bg-white border-b-2 border-blue-500 outline-none px-1`}
      />
    );
  }

  return (
    <div 
      className={`group cursor-pointer flex items-center gap-2 hover:text-blue-600 transition-colors ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <h1>{value}</h1>
      <Pencil 
        size={16} 
        className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500"
      />
    </div>
  );
};

export default EditableTitle;