import React, { Fragment, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  title: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  // title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Add overflow hidden to body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Fragment>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={handleBackdropClick}
      >
        <div 
          ref={modalRef}
          className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} z-50 max-h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <X size={18} />
            </Button>
          </div>
          
          <div className="px-6 py-4 overflow-y-auto">
            {children}
          </div>
          
          {footer && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default Modal;