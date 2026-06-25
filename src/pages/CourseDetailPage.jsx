import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourses } from "../api/courses";
import { getTasksByCourse, createTask, deleteTask } from "../api/tasks";
import { getNotesByCourse, createNote, deleteNote } from "../api/notes";
import {
  getEventsByCourse,
  createEvent,
  deleteEvent,
  updateEvent,
} from "../api/events";
import Layout from "../components/Layout";

import TaskCard from "../components/TaskCard";
import NoteCard from "../components/NoteCard";

const TABS = ["Tareas", "Notas", "Eventos", "Archivos"];

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Tareas");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "pendiente",
    dueDate: "",
  });
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    type: "clase",
    startDate: "",
    endDate: "",
  });

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

  // Eventos - SOLO UNA DECLARACIÓN
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["events", id],
    queryFn: () => {
      console.log("🔍 Obteniendo eventos para curso:", id);
      return getEventsByCourse(id).then((r) => {
        console.log("✅ Eventos obtenidos:", r.data);
        console.log("📊 Cantidad de eventos:", r.data?.length);
        return r.data;
      });
    },
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

  // Mutations eventos
  const createEventMutation = useMutation({
    mutationFn: (data) => {
      console.log("📝 Creando evento:", data);
      return createEvent(data);
    },
    onSuccess: (response) => {
      console.log("✅ Evento creado exitosamente");
      console.log("🔄 Invalidando queries...");

      // Invalidar y hacer refetch
      queryClient.invalidateQueries(["events", id]);
      queryClient.refetchQueries(["events", id]);

      setShowModal(false);
      setEventForm({
        title: "",
        description: "",
        type: "clase",
        startDate: "",
        endDate: "",
      });
    },
    onError: (error) => {
      console.error("❌ Error creando evento:", error);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      console.log("🗑️ Evento eliminado");
      queryClient.invalidateQueries(["events", id]);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["events", id]);
      setShowModal(false);
      setEditingEvent(null); // Resetear modo edición
      setEventForm({
        title: "",
        description: "",
        type: "clase",
        startDate: "",
        endDate: "",
      });
    },
  });
  const handleEditClick = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || "",
      type: event.type,
      // Convertir fecha ISO a formato YYYY-MM-DD para el input date
      startDate: event.startDate
        ? new Date(event.startDate).toISOString().split("T")[0]
        : "",
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().split("T")[0]
        : "",
    });
    setShowModal(true);
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeTab === "Tareas") {
      createTaskMutation.mutate({
        ...taskForm,
        dueDate: new Date(taskForm.dueDate).toISOString(),
      });
    } else if (activeTab === "Notas") {
      createNoteMutation.mutate(noteForm);
    } else if (activeTab === "Eventos") {
      // Preparamos los datos base igual que antes
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        type: eventForm.type,
        startDate: new Date(eventForm.startDate + "T12:00:00").toISOString(),
        endDate: eventForm.endDate
          ? new Date(eventForm.endDate + "T12:00:00").toISOString()
          : null,
        courseID: id,
      };

      console.log(" Procesando evento:", eventData);

      // ✅ LÓGICA CONDICIONAL: ¿Estamos editando o creando?
      if (editingEvent) {
        console.log("️ Modo EDICIÓN para ID:", editingEvent.id);
        updateEventMutation.mutate({
          id: editingEvent.id,
          data: eventData,
        });
      } else {
        console.log("➕ Modo CREACIÓN");
        createEventMutation.mutate(eventData);
      }
    }
  };
  // Log para debuggear el renderizado
  console.log("🎨 Renderizando - activeTab:", activeTab);
  console.log("🎨 Renderizando - events:", events);
  console.log("🎨 Renderizando - loadingEvents:", loadingEvents);

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
            {activeTab === "Eventos" && `${events?.length || 0} eventos`}
          </p>
          {(activeTab === "Tareas" ||
            activeTab === "Notas" ||
            activeTab === "Eventos") && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Agregar{" "}
              {activeTab === "Tareas"
                ? "tarea"
                : activeTab === "Notas"
                  ? "nota"
                  : "evento"}
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

        {/* Tab: Eventos */}
        {activeTab === "Eventos" && (
          <div className="flex flex-col gap-2 max-w-2xl">
            {loadingEvents ? (
              <p className="text-gray-500">Cargando...</p>
            ) : !events || events.length === 0 ? (
              <p className="text-gray-600 py-12 text-center">
                No hay eventos aún
              </p>
            ) : (
              events.map((event) => {
                const TYPE_COLORS = {
                  examen: {
                    color: "#ef4444",
                    bg: "#ef444415",
                    label: "Examen",
                  },
                  quiz: { color: "#f59e0b", bg: "#f59e0b15", label: "Quiz" },
                  proyecto: {
                    color: "#8b5cf6",
                    bg: "#8b5cf615",
                    label: "Proyecto",
                  },
                  laboratorio: {
                    color: "#06b6d4",
                    bg: "#06b6d415",
                    label: "Laboratorio",
                  },
                  clase: { color: "#10b981", bg: "#10b98115", label: "Clase" },
                };
                const t = TYPE_COLORS[event.type] || TYPE_COLORS.clase;
                return (
                  <div
                    key={event.id}
                    className="group flex items-center gap-4 bg-[#141414] border border-[#1f1f1f] rounded-2xl px-5 py-4 hover:border-[#2a2a2a] transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{ backgroundColor: t.bg, color: t.color }}
                    >
                      {new Date(event.startDate).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: t.bg, color: t.color }}
                        >
                          {t.label}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {new Date(event.startDate).toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditClick(event)}
                      className="text-gray-600 hover:text-blue-400 text-xs"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-5">
              {activeTab === "Eventos"
                ? editingEvent
                  ? "Editar evento"
                  : "Nuevo evento"
                : activeTab === "Tareas"
                  ? "Nueva tarea"
                  : "Nueva nota"}
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

              {activeTab === "Eventos" && (
                <>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Título
                    </label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Tipo
                    </label>
                    <select
                      value={eventForm.type}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, type: e.target.value })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="clase">Clase</option>
                      <option value="examen">Examen</option>
                      <option value="quiz">Quiz</option>
                      <option value="proyecto">Proyecto</option>
                      <option value="laboratorio">Laboratorio</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">
                      Fecha fin (opcional)
                    </label>
                    <input
                      type="date"
                      value={eventForm.endDate}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, endDate: e.target.value })
                      }
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
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
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
