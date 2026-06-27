import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getCourseWhiteboards, 
  createWhiteboard, 
  deleteWhiteboard 
} from "../api/whiteboards";
import Layout from "../components/Layout";
import WhiteboardCanvas from "../components/WhiteboardCanvas";

export default function CourseWhiteboardsPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [newBoardTitle, setNewBoardTitle] = useState("");

  const { data: boards, isLoading } = useQuery({
    queryKey: ["course-whiteboards", courseId],
    queryFn: () => getCourseWhiteboards(courseId).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (title) => createWhiteboard({ 
      title, 
      courseID: courseId,
      elements: JSON.stringify({}) // Iniciar vacía
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["course-whiteboards", courseId]);
      setNewBoardTitle("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWhiteboard,
    onSuccess: () => {
      queryClient.invalidateQueries(["course-whiteboards", courseId]);
      if (activeBoardId === deleteMutation.variables) setActiveBoardId(null);
    },
  });

  const activeBoard = boards?.find(b => b.id === activeBoardId);

  if (isLoading) return <Layout><div className="p-8 text-white">Cargando pizarras...</div></Layout>;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar de Pizarras */}
        <div className="w-72 bg-[#111] border-r border-[#1f1f1f] flex flex-col">
          <div className="p-6 border-b border-[#1f1f1f]">
            <h2 className="text-white font-bold text-lg mb-4">Pizarras</h2>
            
            {/* Crear Nueva Pizarra */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nueva pizarra..."
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newBoardTitle.trim() && createMutation.mutate(newBoardTitle)}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => newBoardTitle.trim() && createMutation.mutate(newBoardTitle)}
                disabled={!newBoardTitle.trim() || createMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded-lg disabled:opacity-50"
              >+</button>
            </div>
          </div>

          {/* Lista de Pizarras */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {boards?.map(board => (
              <div 
                key={board.id}
                onClick={() => setActiveBoardId(board.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  activeBoardId === board.id 
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                    : "bg-[#1a1a1a] border border-transparent hover:border-[#2a2a2a] text-gray-300"
                }`}
              >
                <span className="text-sm font-medium truncate">{board.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(board.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                >🗑️</button>
              </div>
            ))}
            
            {boards?.length === 0 && (
              <p className="text-gray-600 text-xs text-center py-8">No hay pizarras aún</p>
            )}
          </div>
        </div>

        {/* Área de Canvas */}
        <div className="flex-1 bg-[#0a0a0a] p-6">
          {activeBoard ? (
            <WhiteboardCanvas 
              whiteboardId={activeBoard.id}
              initialElements={activeBoard.elements}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <span className="text-4xl mb-4 opacity-30">🎨</span>
              <p className="text-lg font-medium">Selecciona o crea una pizarra</p>
              <p className="text-sm mt-2 opacity-60">Colabora en tiempo real con tus compañeros</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}