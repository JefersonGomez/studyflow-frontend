import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTasks, deleteTask, updateTask } from "../api/tasks";
import { getCourses } from "../api/courses";
import Layout from "../components/Layout";
import TaskCard from "../components/TaskCard";
import ConfirmModal from "../components/ConfirmModal"; // ✅ Importar correctamente

const FILTERS = ["Todas", "Pendientes", "En progreso", "Completadas"];

export default function TasksPage() {
  const [filter, setFilter] = useState("Todas");
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: () => getAllTasks().then((r) => r.data),
  });

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses().then((r) => r.data),
  });

  // ✅ MUTACIÓN LIMPIA: Solo invalida queries, NO cierra modales aquí
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries(["all-tasks"]);
      // Los modales ya se cerraron ANTES de llamar a mutate()
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-tasks"]);
      setEditingTaskId(null);
    },
  });

  // ✅ Función segura para eliminar: CIERRA MODALES PRIMERO
  const handleDeleteTask = (taskId) => {
    setExpandedTaskId(null);   // 1. Cierra modal de enfoque (quita blur/fondo)
    setEditingTaskId(null);    // 2. Sale de modo edición
    setDeleteTaskId(null);     // 3. Cierra confirmación (por seguridad)
    
    // Pequeño delay para asegurar que React procesó los cierres antes de eliminar
    setTimeout(() => {
      deleteMutation.mutate(taskId);
    }, 50);
  };

  // Bloquear scroll cuando hay modales abiertos
  useEffect(() => {
    const hasModalOpen = expandedTaskId || deleteTaskId;
    document.body.style.overflow = hasModalOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [expandedTaskId, deleteTaskId]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (filter === "Todas") return tasks;
    const statusMap = {
      Pendientes: "pendiente",
      "En progreso": "en_progreso",
      Completadas: "completada",
    };
    return tasks.filter((t) => t.status === statusMap[filter]);
  }, [tasks, filter]);

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, pending: 0, progress: 0, done: 0 };
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pendiente").length,
      progress: tasks.filter((t) => t.status === "en_progreso").length,
      done: tasks.filter((t) => t.status === "completada").length,
    };
  }, [tasks]);

  const activeTask = tasks?.find(t => t.id === expandedTaskId);
  const activeCourse = courses?.find(c => c.id === activeTask?.courseId);

  if (loadingTasks) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .animate-row-enter { animation: fadeSlideUp 0.4s ease-out forwards; opacity:0; }
        @keyframes zoomInModal { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .animate-modal-task { animation: zoomInModal 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Header y Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Mis Tareas</h1>
          <p className="text-gray-400 text-sm mb-6">Gestiona tus pendientes de todas las materias.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total" value={stats.total} color="bg-gray-800" textColor="text-gray-300" />
            <StatCard label="Pendientes" value={stats.pending} color="bg-yellow-500/10" textColor="text-yellow-400" borderColor="border-yellow-500/20" />
            <StatCard label="En Progreso" value={stats.progress} color="bg-blue-500/10" textColor="text-blue-400" borderColor="border-blue-500/20" />
            <StatCard label="Completadas" value={stats.done} color="bg-emerald-500/10" textColor="text-emerald-400" borderColor="border-emerald-500/20" />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6 bg-[#141414] p-1.5 rounded-xl border border-[#1f1f1f] w-fit">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === f ? "bg-[#1f1f1f] text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]"
              }`}
            >{f}</button>
          ))}
        </div>

        {/* Tabla de Tareas */}
        <div className={`transition-all duration-300 ${expandedTaskId ? "opacity-20 blur-[2px] pointer-events-none" : "opacity-100"}`}>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#141414] border border-dashed border-[#2a2a2a] rounded-2xl">
              <span className="text-4xl mb-4 opacity-50">📋</span>
              <p className="text-gray-400 font-medium">No hay tareas {filter.toLowerCase()}</p>
            </div>
          ) : (
            <div className="w-full bg-[#141414] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-xl">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1f1f1f] bg-[#111]">
                <div className="col-span-1" />
                <div className="col-span-4 text-gray-500 text-xs font-bold uppercase tracking-wider">Tarea</div>
                <div className="col-span-2 text-gray-500 text-xs font-bold uppercase tracking-wider">Materia</div>
                <div className="col-span-2 text-gray-500 text-xs font-bold uppercase tracking-wider">Estado</div>
                <div className="col-span-2 text-gray-500 text-xs font-bold uppercase tracking-wider">Fecha límite</div>
                <div className="col-span-1" />
              </div>

              {filteredTasks.map((task, index) => {
                const course = courses?.find(c => c.id === task.courseId);
                return (
                  <div key={`task-${task.id}`} className="animate-row-enter" style={{ animationDelay: `${index * 40}ms` }}>
                    <div onClick={() => setExpandedTaskId(task.id)}
                      className="group grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1f1f1f] hover:bg-[#1a1a1a] cursor-pointer transition-colors items-center">
                      <div className="col-span-1 flex justify-center">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === 'completada' ? 'bg-emerald-500' : 
                          task.status === 'en_progreso' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                      <div className="col-span-4 text-white text-sm font-medium truncate">{task.title}</div>
                      <div className="col-span-2 text-gray-400 text-xs truncate">{course?.name || "Sin Materia"}</div>
                      <div className="col-span-2">
                        <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${
                          task.status === 'completada' ? 'bg-emerald-500/10 text-emerald-400' :
                          task.status === 'en_progreso' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-500 text-xs">
                        {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-gray-600 group-hover:text-emerald-400 transition-colors">→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE TAREA (Focus Mode) - Solo se muestra si activeTask existe */}
      {expandedTaskId && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => { setExpandedTaskId(null); setEditingTaskId(null); }}>
          <div className="bg-[#141414] border border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl shadow-black/50 animate-modal-task relative"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setExpandedTaskId(null); setEditingTaskId(null); }}
              className="absolute top-4 right-4 w-8 h-8 bg-[#1f1f1f] hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-full flex items-center justify-center transition-colors z-10">✕</button>

            <div className="p-8">
              <TaskCard 
                task={activeTask}
                courseId={activeTask.courseId}
                courseName={activeTask.courseName || activeCourse?.name}
                isExpanded={true}
                isEditing={editingTaskId === activeTask.id}
                onEdit={() => setEditingTaskId(activeTask.id)}
                onCancelEdit={() => setEditingTaskId(null)}
                onSaved={() => { setEditingTaskId(null); queryClient.invalidateQueries(["all-tasks"]); }}
                // ✅ CAMBIO CLAVE: Solo establece el ID para confirmar, NO elimina directamente
                onDelete={() => setDeleteTaskId(activeTask.id)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN - Siempre renderizado, controlado por deleteTaskId */}
      <ConfirmModal
        isOpen={!!deleteTaskId}
        title="¿Eliminar esta tarea?"
        message="Esta acción no se puede deshacer. La tarea desaparecerá permanentemente."
        onConfirm={() => handleDeleteTask(deleteTaskId)}
        onCancel={() => setDeleteTaskId(null)}
        isPending={deleteMutation.isPending}
      />
    </Layout>
  );
}

function StatCard({ label, value, color, textColor, borderColor = "border-transparent" }) {
  return (
    <div className={`p-4 rounded-xl border ${borderColor} ${color} backdrop-blur-sm`}>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${textColor}`}>{value}</p>
    </div>
  );
}