import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourses } from "../api/courses";
import { getTasksByCourse, createTask, deleteTask } from "../api/tasks";
import { getNotesByCourse, createNote, deleteNote } from "../api/notes";
import Layout from "../components/Layout";

import TaskCard from "../components/TaskCard";
import NoteCard from "../components/NoteCard";
const TABS = ["Tareas", "Notas", "Eventos", "Archivos"];

const STATUS_COLORS = {
  pendiente: { bg: "#f59e0b15", text: "#f59e0b", label: "Pendiente" },
  en_progreso: { bg: "#3b82f615", text: "#3b82f6", label: "En progreso" },
  completada: { bg: "#10b98115", text: "#10b981", label: "Completada" },
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Tareas");
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "pendiente",
    dueDate: "",
  });
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });

  // Obtener curso actual
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses().then((r) => r.data),
  });
  const course = courses?.find((c) => c.id === id);

  // Tareas
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => getTasksByCourse(id).then((r) => r.data),
  });

  // Notas
  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ["notes", id],
    queryFn: () => getNotesByCourse(id).then((r) => r.data),
  });

  // Mutations tareas
  const createTaskMutation = useMutation({
    mutationFn: (data) => createTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", id]);
      setShowModal(false);
      setTaskForm({
        title: "",
        description: "",
        status: "pendiente",
        dueDate: "",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries(["tasks", id]),
  });

  // Mutations notas
  const createNoteMutation = useMutation({
    mutationFn: (data) => createNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["notes", id]);
      setShowModal(false);
      setNoteForm({ title: "", content: "" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries(["notes", id]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "Tareas") {
      createTaskMutation.mutate({
        ...taskForm,
        dueDate: new Date(taskForm.dueDate).toISOString(),
      });
    } else if (activeTab === "Notas") {
      createNoteMutation.mutate(noteForm);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/courses")}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Materias
          </button>
          <span className="text-gray-700">/</span>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: course?.color || "#10b981" }}
            />
            <h1 className="text-white font-bold text-xl">
              {course?.name || "Materia"}
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#141414] border border-[#1f1f1f] rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                activeTab === tab
                  ? "bg-[#1f1f1f] text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Contenido del tab + botón agregar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-500 text-sm">
            {activeTab === "Tareas" && `${tasks?.length || 0} tareas`}
            {activeTab === "Notas" && `${notes?.length || 0} notas`}
          </p>
          {(activeTab === "Tareas" || activeTab === "Notas") && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Agregar {activeTab === "Tareas" ? "tarea" : "nota"}
            </button>
          )}
        </div>

        {/* Tab: Tareas */}
        {activeTab === "Tareas" && (
          <div className="flex flex-col gap-2 max-w-2xl">
            {loadingTasks ? (
              <p className="text-gray-500">Cargando...</p>
            ) : tasks?.length === 0 ? (
              <p className="text-gray-600 py-12 text-center">
                No hay tareas aún
              </p>
            ) : (
              tasks?.map((task) => (
                <TaskCard key={task.id} task={task} courseId={id} />
              ))
            )}
          </div>
        )}

        {/* Tab: Notas */}
        {activeTab === "Notas" && (
          <div className="flex flex-col gap-2 max-w-2xl">
            {loadingNotes ? (
              <p className="text-gray-500">Cargando...</p>
            ) : notes?.length === 0 ? (
              <p className="text-gray-600 py-12 text-center col-span-3">
                No hay notas aún
              </p>
            ) : (
              notes?.map((note) => (
                <NoteCard key={note.id} note={note} courseId={id} />
              ))
            )}
          </div>
        )}

        {/* Tab: Eventos y Archivos — próximamente */}
        {activeTab === "Eventos" && (
          <p className="text-gray-600 py-12 text-center">Próximamente</p>
        )}
        {activeTab === "Archivos" && (
          <p className="text-gray-600 py-12 text-center">Próximamente</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-5">
              {activeTab === "Tareas" ? "Nueva tarea" : "Nueva nota"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {activeTab === "Tareas" && (
                <>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Título
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, title: e.target.value })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={taskForm.description}
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Estado
                    </label>
                    <select
                      value={taskForm.status}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, status: e.target.value })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_progreso">En progreso</option>
                      <option value="completada">Completada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Fecha límite
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, dueDate: e.target.value })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === "Notas" && (
                <>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Título
                    </label>
                    <input
                      type="text"
                      value={noteForm.title}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, title: e.target.value })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Contenido
                    </label>
                    <textarea
                      value={noteForm.content}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, content: e.target.value })
                      }
                      rows={4}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-gray-400 text-sm py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
