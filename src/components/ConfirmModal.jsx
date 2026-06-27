export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isPending }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#141414] border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-white/5 text-white text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}