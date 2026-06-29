import { motion, AnimatePresence } from "framer-motion";

export default function StudyQuiz({ 
  questions, 
  isLoading, 
  error, 
  onRegenerate, 
  isAnswerRevealed, 
  onToggleAnswer 
}) {
  // ✅ Protección crítica: Asegurar que siempre sea un array iterable
  const safeQuestions = Array.isArray(questions) ? questions : [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-emerald-400">
        <span className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium">La IA está creando tus preguntas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm mb-3">⚠️ No se pudieron generar las preguntas</p>
        <button 
          onClick={onRegenerate} 
          className="text-xs bg-[#1f1f1f] hover:bg-[#2a2a2a] px-3 py-1.5 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (safeQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm mb-3">No hay preguntas disponibles para esta nota</p>
        <button 
          onClick={onRegenerate} 
          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Generar Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {safeQuestions.length} Preguntas de estudio
        </p>
        <button 
          onClick={onRegenerate}
          disabled={isLoading}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
        >
          🔄 Regenerar
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {safeQuestions.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden"
          >
            {/* Pregunta */}
            <div className="p-3.5">
              <p className="text-sm font-medium text-white leading-snug">
                <span className="text-emerald-500 mr-2 font-bold">{i + 1}.</span>
                {q.q || q.question || q.pregunta || "Pregunta sin texto"}
              </p>
            </div>

            {/* Respuesta Colapsable */}
            <div className={`border-t border-[#2a2a2a] transition-all duration-300 ${
              isAnswerRevealed(i) ? "bg-emerald-500/5" : ""
            }`}>
              <button
                onClick={() => onToggleAnswer(i)}
                className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2 transition-colors hover:bg-white/5"
              >
                <span className={`transition-transform duration-200 ${isAnswerRevealed(i) ? "rotate-90" : ""}`}>
                  ▶
                </span>
                {isAnswerRevealed(i) ? "Ocultar respuesta" : "Ver respuesta"}
              </button>

              {isAnswerRevealed(i) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-3.5 pb-3.5 pt-1"
                >
                  <p className="text-sm text-gray-300 leading-relaxed pl-5 border-l-2 border-emerald-500/30">
                    {q.a || q.answer || q.respuesta || "Respuesta no disponible"}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}