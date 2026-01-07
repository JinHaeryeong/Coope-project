
import React, { FC, ReactNode } from 'react';
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
  }
const Modal: FC<ModalProps> =  ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-60">
      <div className="bg-white p-6 rounded-lg w-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-neutral-700">{title}</h2>
        <div className="mb-4 overflow-y-auto text-neutral-700">{children}</div>
        <button
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default Modal;
