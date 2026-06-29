import { useState } from "react";
import FormattedText from "./FormattedText"; // Reutilizamos el mismo formateador

export default function StudyPlanModal({
  courseName,
  isOpen,
  onClose,
  onGenerate,
  plan,
  isLoading,
  error,
}) {
  const [days, setDays] = useState(7);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#141414] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-start">
          <div>
            <h3 className="text-white font-bold text-lg">Plan de Estudio</h3>
            <p className="text-gray-400 text-sm mt-1">{courseName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {!plan && !isLoading && (
            <div className="space-y-4">
              <label className="block text-gray-300 text-sm font-medium">
                ¿Cuántos días tienes para estudiar?
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-gray-500 text-xs">
                La IA usará tus notas y archivos de esta materia para crear un
                cronograma personalizado.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-emerald-400">
              <span className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium">
                Diseñando tu ruta de estudio...
              </p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
              ⚠️ Error al generar el plan: {error.message}
            </p>
          )}

          {plan && (
            <div className="prose prose-invert prose-sm max-w-none [&_strong]:text-emerald-400">
              <FormattedText text={plan} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-[#111] flex gap-3">
          {plan ? (
            <>
              <button onClick={() => mutation.mutate({ days })} className="...">
                🔄 Regenerar
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-3 rounded-xl transition-colors"
              >
                Entendido
              </button>
            </>
          ) : (
            <button
              onClick={() => onGenerate(days)}
              disabled={isLoading || days < 1}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              ✨ Generar Plan con IA
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
