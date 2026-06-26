import { useState, useRef } from "react";

// Constante de colores fuera del componente para no recrearla en cada render
const FILE_TYPE_COLORS = {
  examen: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", label: "Examen" },
  quiz: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", label: "Quiz" },
  proyecto: { color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)", label: "Proyecto" },
  laboratorio: { color: "#06b6d4", bg: "rgba(6, 182, 212, 0.1)", label: "Laboratorio" },
  clase: { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", label: "Clase" },
};

export default function FileTab({
  files,
  loadingFiles,
  courseId,
  onUpload,
  onDelete,
  isUploading,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [studyDays, setStudyDays] = useState(7);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      alert("Solo se permiten archivos PDF");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    onUpload(formData);
  };

  const handleAI = async (action, fileId) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      let res;
      // Simulación de importación, asegúrate de tener tus imports reales
      if (action === "analyze") res = await analyzePDF(fileId);
      if (action === "studyplan") res = await generateStudyPlan(fileId, studyDays);
      setAiResult(res.data);
    } catch (err) {
      setAiResult({ error: "Error al procesar con IA. Intenta nuevamente." });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* ================= COLUMNA IZQUIERDA: ARCHIVOS ================= */}
      <div className="flex-1 min-w-0">
        
        {/* Área de Upload Mejorada */}
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            relative group border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 mb-8
            ${isUploading 
              ? "border-emerald-500/30 bg-emerald-500/5 cursor-wait" 
              : "border-[#2a2a2a] hover:border-emerald-500/50 hover:bg-[#1a1a1a]/50"
            }
          `}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={isUploading} />
          
          <div className="flex flex-col items-center justify-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300 ${isUploading ? 'animate-pulse bg-emerald-500/10' : 'bg-[#1f1f1f] group-hover:scale-110 group-hover:bg-emerald-500/10'}`}>
              {isUploading ? "⏳" : ""}
            </div>
            <div>
              <p className="text-white font-medium text-lg group-hover:text-emerald-400 transition-colors">
                {isUploading ? "Procesando archivo..." : "Subir nuevo PDF"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Arrastra o haz clic para subir. La IA extraerá el contenido automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Archivos */}
        <div className="space-y-3">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider ml-1 mb-2">
            Archivos subidos ({files?.length || 0})
          </h3>

          {loadingFiles ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !files || files.length === 0 ? (
            <div className="text-center py-12 bg-[#141414] rounded-2xl border border-[#1f1f1f]">
              <p className="text-gray-600">No hay archivos en este curso aún.</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(selectedFile?.id === file.id ? null : file)}
                className={`
                  group relative flex items-center gap-4 rounded-2xl px-5 py-4 cursor-pointer transition-all duration-200 border
                  ${selectedFile?.id === file.id
                    ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                    : "border-[#1f1f1f] bg-[#141414] hover:border-[#333] hover:bg-[#1a1a1a]"
                  }
                `}
              >
                {/* Icono Archivo */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selectedFile?.id === file.id ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1f1f1f] text-gray-400'}`}>
                  <span className="text-xl">📄</span>
                </div>

                {/* Info Archivo */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate pr-4">{file.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${file.aiProcessed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {file.aiProcessed ? "IA Listo" : "Pendiente"}
                    </span>
                    <span className="text-gray-600 text-xs">•</span>
                    <p className="text-gray-500 text-xs">
                      {new Date(file.createAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {selectedFile?.id === file.id && (
                    <span className="text-emerald-400 text-xs font-bold hidden sm:block">Seleccionado</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                  >
                    ️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= COLUMNA DERECHA: PANEL IA ================= */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="sticky top-8 bg-[#141414] border border-[#1f1f1f] rounded-3xl p-6 shadow-xl">
          
          {/* Header Panel IA */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-lg"></span>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Asistente IA</h3>
                <p className="text-emerald-400 text-[10px] font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">Ollama</p>
              </div>
            </div>
          </div>

          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-50">
              <div className="w-16 h-16 rounded-full bg-[#1f1f1f] flex items-center justify-center text-2xl">👈</div>
              <p className="text-gray-400 text-sm">Selecciona un archivo<br/>para activar la IA</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              
              {/* Info Archivo Seleccionado */}
              <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Archivo Activo</p>
                <p className="text-white text-sm font-medium truncate" title={selectedFile.fileName}>
                  📄 {selectedFile.fileName}
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="grid gap-3">
                <button
                  onClick={() => handleAI("analyze", selectedFile.id)}
                  disabled={aiLoading}
                  className="group relative overflow-hidden text-left bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-emerald-500/30 rounded-xl px-4 py-3.5 transition-all duration-200 disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">📅</div>
                    <div>
                      <p className="text-white text-sm font-medium">Analizar Syllabus</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Extrae fechas de exámenes, quizzes y entregas automáticamente.</p>
                    </div>
                  </div>
                </button>

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">📖</div>
                    <p className="text-white text-sm font-medium">Generar Plan de Estudio</p>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3 bg-[#111] rounded-lg p-2 border border-[#2a2a2a]">
                    <input
                      type="number"
                      value={studyDays}
                      onChange={(e) => setStudyDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                      className="w-12 bg-transparent text-white text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-gray-500 text-xs border-l border-[#2a2a2a] pl-3 flex-1">días de preparación</span>
                  </div>

                  <button
                    onClick={() => handleAI("studyplan", selectedFile.id)}
                    disabled={aiLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:shadow-none active:scale-95"
                  >
                    ✨ Crear Plan Personalizado
                  </button>
                </div>
              </div>

              {/* Resultados IA */}
              {(aiLoading || aiResult) && (
                <div className="mt-6 pt-6 border-t border-[#1f1f1f] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {aiLoading ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-emerald-400 text-xs font-medium animate-pulse">La IA está analizando tu PDF...</p>
                    </div>
                  ) : aiResult?.error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                      <p className="text-red-400 text-xs font-medium">⚠️ {aiResult.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Resultado</p>
                        <button onClick={() => setAiResult(null)} className="text-gray-600 hover:text-white text-xs">Limpiar</button>
                      </div>
                      
                      {/* Renderizado condicional de resultados */}
                      {aiResult?.creados !== undefined ? (
                        <div className="space-y-2">
                          <p className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-md inline-block">
                            ✅ {aiResult.message}
                          </p>
                          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {aiResult.eventos?.map((e, i) => (
                              <div key={i} className="flex items-center justify-between bg-[#111] border border-[#1f1f1f] rounded-lg px-3 py-2.5 hover:border-[#333] transition-colors">
                                <div className="min-w-0 flex-1 mr-2">
                                  <p className="text-gray-200 text-xs font-medium truncate">{e.titulo}</p>
                                  <p className="text-gray-600 text-[10px] mt-0.5">{e.fecha}</p>
                                </div>
                                <span
                                  className="text-[10px] px-2 py-1 rounded-md font-bold whitespace-nowrap"
                                  style={{ backgroundColor: FILE_TYPE_COLORS[e.tipo]?.bg || "#333", color: FILE_TYPE_COLORS[e.tipo]?.color || "#fff" }}
                                >
                                  {FILE_TYPE_COLORS[e.tipo]?.label || e.tipo}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 max-h-80 overflow-y-auto custom-scrollbar">
                          <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-light">
                            {aiResult?.analysis || aiResult?.studyPlan || aiResult?.summary || JSON.stringify(aiResult)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}