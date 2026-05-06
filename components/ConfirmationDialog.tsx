import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1A1A1F] border border-[#2A2A2E] rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden"
          >
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-[#EAEAEA] mb-2">{title}</h3>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">{message}</p>
            </div>
            <div className="flex border-t border-[#2A2A2E]">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 text-sm font-medium text-[#9CA3AF] hover:bg-[#2A2A2E]/50 transition-colors active:bg-[#2A2A2E]"
              >
                {cancelText}
              </button>
              <div className="w-px bg-[#2A2A2E]"></div>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3.5 text-sm font-bold hover:bg-[#2A2A2E]/50 transition-colors active:bg-[#2A2A2E] ${isDestructive ? 'text-red-500' : 'text-[#3A7AFE]'}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
