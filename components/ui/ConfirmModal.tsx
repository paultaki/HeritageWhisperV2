"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center"
      style={{ padding: '16px' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          maxWidth: 'min(400px, calc(100vw - 32px))',
        }}
      >
        {/* Content */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            {title}
          </h2>

          {/* Message */}
          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="bg-gray-50 px-6 sm:px-8 py-4 sm:py-5 rounded-b-2xl flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl border-2 border-gray-300 text-base sm:text-lg transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 font-semibold px-6 py-3 rounded-xl text-base sm:text-lg transition-all shadow-md hover:shadow-lg ${
              variant === 'danger'
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
