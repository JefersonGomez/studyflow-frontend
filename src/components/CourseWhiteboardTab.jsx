import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourseWhiteboards,
  createWhiteboard,
  deleteWhiteboard,
} from "../api/whiteboards";
import WhiteboardCanvas from "./WhiteboardCanvas";

export default function CourseWhiteboardTab({ courseId }) {
  const queryClient = useQueryClient();
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [newBoardTitle, setNewBoardTitle] = useState("");

 

  const { data: boards, isLoading } = useQuery({
    queryKey: ["course-whiteboards", courseId],
    queryFn: () => getCourseWhiteboards(courseId).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (title) =>
      createWhiteboard({
        title,
        courseID: courseId,
        elements: JSON.stringify({}),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries(["course-whiteboards", courseId]),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWhiteboard,
    onSuccess: () => {
      queryClient.invalidateQueries(["course-whiteboards", courseId]);
      if (activeBoardId === deleteMutation.variables) setActiveBoardId(null);
    },
  });

  const activeBoard = boards?.find((b) => b.id === activeBoardId);

  if (isLoading)
    return <div className="p-8 text-gray-400">Cargando pizarras...</div>;

  return (
    <div className="flex h-[600px] border border-[#1f1f1f] rounded-2xl overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar Mini */}
      <div className="w-56 bg-[#111] border-r border-[#1f1f1f] flex flex-col">
        <div className="p-4 border-b border-[#1f1f1f]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nueva..."
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                newBoardTitle.trim() &&
                createMutation.mutate(newBoardTitle)
              }
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-white text-xs outline-none focus:border-emerald-500"
            />
            <button
              onClick={() =>
                newBoardTitle.trim() && createMutation.mutate(newBoardTitle)
              }
              className="bg-emerald-600 text-white w-7 rounded text-sm"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {boards?.map((board) => (
            <div
              key={board.id}
              onClick={() => setActiveBoardId(board.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                activeBoardId === board.id
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-gray-400 hover:bg-[#1a1a1a]"
              }`}
            >
              <span className="truncate">{board.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(board.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        {activeBoard ? (
          <WhiteboardCanvas
            key={activeBoard.id}
            whiteboardId={activeBoard.id}
            initialElements={activeBoard.elements}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
            <span className="text-3xl mb-2 opacity-30">🎨</span>
            <p className="text-sm">Selecciona o crea una pizarra</p>
          </div>
        )}
      </div>
    </div>
  );
}
