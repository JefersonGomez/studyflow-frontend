import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserEvents, deleteEvent, updateEvent } from "../api/events";
import Layout from "../components/Layout";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "es-ES": es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EVENT_STYLES = {
  examen: { bg: "rgba(239, 68, 68, 0.2)", border: "#ef4444", text: "#fca5a5", label: "Examen" },
  quiz: { bg: "rgba(245, 158, 11, 0.2)", border: "#f59e0b", text: "#fcd34d", label: "Quiz" },
  proyecto: { bg: "rgba(139, 92, 246, 0.2)", border: "#8b5cf6", text: "#c4b5fd", label: "Proyecto" },
  laboratorio: { bg: "rgba(6, 182, 212, 0.2)", border: "#06b6d4", text: "#67e8f9", label: "Laboratorio" },
  clase: { bg: "rgba(16, 185, 129, 0.2)", border: "#10b981", text: "#6ee7b7", label: "Clase" },
  default: { bg: "rgba(100, 116, 139, 0.2)", border: "#64748b", text: "#cbd5e1", label: "Otro" },
};

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const [editForm, setEditForm] = useState({
    title: "", description: "", type: "clase", startDate: "", endDate: "",
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["user-events"],
    queryFn: () => getUserEvents().then((r) => r.data),
  });

  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    return events
      .filter(e => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 4);
  }, [events]);

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries(["user-events"]);
      setSelectedEvent(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["user-events"]);
      setIsEditing(false);
    },
  });

  const calendarEvents = events?.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startDate),
    end: new Date(event.endDate || event.startDate),
    type: event.type,
    description: event.description,
    courseName: event.courseName || "Sin Materia",
    resource: event,
  })) || [];

  const eventStyleGetter = (event) => {
    const style = EVENT_STYLES[event.type] || EVENT_STYLES.default;
    return {
      style: {
        backgroundColor: style.bg,
        borderLeft: `3px solid ${style.border}`,
        borderRadius: "4px",
        color: "#fff",
        fontSize: "11px",
        fontWeight: "600",
        padding: "4px 6px",
        boxShadow: `0 2px 4px rgba(0,0,0,0.3)`,
      },
    };
  };

  const handleEditClick = () => {
    if (!selectedEvent) return;
    setEditForm({
      title: selectedEvent.title,
      description: selectedEvent.description || "",
      type: selectedEvent.type,
      startDate: selectedEvent.start ? new Date(selectedEvent.start).toISOString().split("T")[0] : "",
      endDate: selectedEvent.end && selectedEvent.end !== selectedEvent.start 
        ? new Date(selectedEvent.end).toISOString().split("T")[0] 
        : "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: selectedEvent.id,
      data: {
        ...editForm,
        startDate: new Date(editForm.startDate + "T12:00:00").toISOString(),
        endDate: editForm.endDate ? new Date(editForm.endDate + "T12:00:00").toISOString() : null,
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Sin fecha";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  if (isLoading) {
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
      {/* Contenedor Principal con altura fija */}
      <div className="max-w-[1600px] mx-auto p-6 h-[calc(100vh-80px)] flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 border-b border-emerald-500/20">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Calendario <span className="text-emerald-500 text-5xl">.</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">Organiza tu semestre, domina tus fechas.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0 bg-[#111] p-1.5 rounded-xl border border-[#222]">
            {Object.entries(EVENT_STYLES).slice(0, 5).map(([type, style]) => (
              <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors cursor-default border border-transparent hover:border-[#333]">
                <span className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: style.border, color: style.border }}></span>
                <span className="text-xs text-gray-300 capitalize font-bold">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget Próximos Eventos */}
        {upcomingEvents.length > 0 && (
          <div className="bg-[#141414] border border-emerald-500/30 rounded-2xl p-1 shadow-[0_0_20px_rgba(16,185,129,0.05)] shrink-0">
            <div className="flex items-center gap-4 p-3 overflow-x-auto custom-scrollbar">
              <div className="shrink-0 flex items-center gap-2 pr-4 border-r border-[#2a2a2a] min-w-[100px]">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400"></div>
                <span className="text-white text-sm font-bold whitespace-nowrap">Próximos</span>
              </div>
              
              <div className="flex gap-3 min-w-0 w-full">
                {upcomingEvents.map(event => {
                  const style = EVENT_STYLES[event.type] || EVENT_STYLES.default;
                  const daysLeft = Math.ceil((new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div 
                      key={event.id}
                      className="shrink-0 flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 hover:border-emerald-500/50 hover:bg-[#222] transition-all cursor-pointer group min-w-[180px]"
                      onClick={() => {
                        setDate(new Date(event.startDate));
                        setSelectedEvent({
                          id: event.id, title: event.title, start: new Date(event.startDate),
                          end: new Date(event.endDate || event.startDate), type: event.type,
                          description: event.description, courseName: event.courseName,
                        });
                      }}
                    >
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: style.border }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-bold truncate group-hover:text-emerald-400 transition-colors">{event.title}</p>
                        <p className="text-gray-500 text-[10px] truncate font-medium">{event.courseName}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${
                        daysLeft === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                        daysLeft <= 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {daysLeft === 0 ? 'HOY' : `${daysLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Contenedor del Calendario - FLEX-1 PARA OCUPAR ESPACIO RESTANTE */}
        <div className="flex-1 bg-[#0f0f0f] border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl relative min-h-0 flex flex-col">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view="month"
            date={date}
            onNavigate={setDate}
            onView={() => {}}
            onSelectEvent={(event) => {
              setSelectedEvent(event);
              setIsEditing(false);
            }}
            eventPropGetter={eventStyleGetter}
            components={{
              event: ({ event }) => (
                <div className="flex flex-col w-full overflow-hidden leading-tight px-1">
                  <span className="font-bold truncate text-white text-[11px] drop-shadow-md">
                    {event.title}
                  </span>
                  <span className="text-[9px] opacity-80 truncate font-medium text-gray-200 mt-0.5">
                     {event.courseName}
                  </span>
                </div>
              ),
            }}
            messages={{
              next: "→", previous: "←", today: "Hoy", month: "Mes",
              noEventsInRange: "No hay eventos este mes",
            }}
            className="neo-green-calendar"
          />
        </div>
      </div>

      {/* Modal Unificado */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => { setSelectedEvent(null); setIsEditing(false); }}
        >
          <div 
            className="bg-[#141414] border border-emerald-500/30 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
            
            <div className="p-6">
              {!isEditing ? (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span 
                        className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 border border-white/10"
                        style={{ backgroundColor: EVENT_STYLES[selectedEvent.type]?.bg, color: EVENT_STYLES[selectedEvent.type]?.text }}
                      >
                        {EVENT_STYLES[selectedEvent.type]?.label || selectedEvent.type}
                      </span>
                      <h2 className="text-2xl font-black text-white leading-tight">{selectedEvent.title}</h2>
                      <p className="text-emerald-400/80 text-sm mt-1 font-medium flex items-center gap-2">
                        <span>📚</span> {selectedEvent.courseName}
                      </p>
                    </div>
                    <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"></button>
                  </div>

                  <div className="space-y-4 mb-6 bg-[#111] p-4 rounded-xl border border-[#222]">
                    <div className="flex items-center gap-3 text-gray-300 text-sm font-medium">
                      <span className="text-emerald-500"></span>
                      <span>{formatDate(selectedEvent.start)}</span>
                    </div>
                    {selectedEvent.description ? (
                      <div className="pt-3 border-t border-[#222]">
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Descripción</p>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm italic pt-3 border-t border-[#222]">Sin descripción adicional.</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleEditClick} className="flex-1 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-white text-sm font-bold py-3 rounded-xl transition-all hover:border-emerald-500/50">
                      ✏️ Editar
                    </button>
                    <button onClick={() => deleteMutation.mutate(selectedEvent.id)} disabled={deleteMutation.isPending}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                      {deleteMutation.isPending ? "..." : "️ Eliminar"}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveEdit}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-white">Editar Evento</h2>
                    <button type="button" onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white text-sm font-medium">Cancelar</button>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-emerald-500/80 text-[10px] uppercase font-black mb-1.5 block tracking-wider">Título</label>
                      <input type="text" required value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-emerald-500/80 text-[10px] uppercase font-black mb-1.5 block tracking-wider">Fecha Inicio</label>
                        <input type="date" required value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})}
                          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-500 transition-all [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="text-emerald-500/80 text-[10px] uppercase font-black mb-1.5 block tracking-wider">Fecha Fin</label>
                        <input type="date" value={editForm.endDate} onChange={e => setEditForm({...editForm, endDate: e.target.value})}
                          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-500 transition-all [color-scheme:dark]" />
                      </div>
                    </div>
                    <div>
                      <label className="text-emerald-500/80 text-[10px] uppercase font-black mb-1.5 block tracking-wider">Tipo</label>
                      <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-500 transition-all">
                        {Object.keys(EVENT_STYLES).map(t => (
                          <option key={t} value={t}>{EVENT_STYLES[t].label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-emerald-500/80 text-[10px] uppercase font-black mb-1.5 block tracking-wider">Descripción</label>
                      <textarea rows={3} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-500 transition-all resize-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={updateMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black py-3 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                    {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS CSS CORREGIDOS Y OPTIMIZADOS */}
      <style>{`
        .neo-green-calendar { 
          height: 100% !important; 
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Toolbar */
        .rbc-toolbar { 
          display: flex !important; 
          justify-content: space-between !important; 
          align-items: center !important; 
          padding: 1rem 1.5rem !important; 
          margin-bottom: 0 !important; 
          background: #0f0f0f;
          border-bottom: 1px solid #1a1a1a;
          flex-shrink: 0; /* Evita que la toolbar se aplaste */
        }
        .rbc-toolbar-label { 
          font-size: 1.25rem !important; 
          font-weight: 800 !important; 
          color: #fff !important; 
          text-transform: capitalize; 
          letter-spacing: -0.02em;
        }

        /* Botones Cápsula */
        .rbc-btn-group { 
          display: inline-flex !important; 
          background: #111 !important; 
          border-radius: 12px !important; 
          overflow: hidden !important;
          border: 1px solid #222;
        }
        .rbc-btn-group button { 
          background: transparent !important; 
          border: none !important; 
          color: #666 !important; 
          font-size: 0.8rem !important; 
          font-weight: 600 !important;
          padding: 6px 14px !important; 
          transition: all 0.2s; 
        }
        .rbc-btn-group button:hover { color: #fff !important; background: #1a1a1a !important; }
        .rbc-btn-group button.rbc-active { 
          background: #10b981 !important; 
          color: #000 !important; 
          box-shadow: 0 0 10px rgba(16,185,129,0.3);
        }
        .rbc-btn-group:nth-child(3) { display: none !important; }

        /* Grid y Celdas - SOLUCIÓN DEFINITIVA */
        .rbc-month-view { 
          border: none !important; 
          background: #0f0f0f !important; 
          flex: 1 !important;
          display: flex !important; 
          flex-direction: column !important;
          min-height: 0 !important; /* Crucial para flex containers anidados */
        }
        
        .rbc-header { 
          padding: 1rem 0 !important; 
          font-size: 0.7rem !important; 
          font-weight: 700 !important; 
          text-transform: uppercase !important; 
          letter-spacing: 0.1em !important; 
          color: #10b981 !important; 
          border-bottom: 1px solid #1a1a1a !important; 
          background: #0f0f0f !important; 
          flex-shrink: 0;
        }
        
        /* FORZAR ALTURA EN FILAS */
        .rbc-month-row {
          display: flex !important;
          flex: 1 !important; /* Ocupa espacio equitativo */
          min-height: 0 !important; /* Permite que flex funcione correctamente */
        }
        
        .rbc-row-content {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          min-height: 0 !important;
        }

        .rbc-row-segment {
          flex: 1 !important; /* Cada segmento (día) ocupa su parte justa */
          min-height: 100px !important; /* Altura mínima absoluta por día */
        }
        
        .rbc-day-bg { 
          background: #0f0f0f !important; 
          border-right: 1px solid #1a1a1a !important; 
          border-bottom: 1px solid #1a1a1a !important; 
          transition: background 0.2s; 
          height: 100% !important; /* Asegura que el fondo cubra toda la celda */
        }
        .rbc-day-bg:hover { background: #141414 !important; }
        .rbc-off-range-bg { background: #0a0a0a !important; opacity: 0.5; }
        
        /* Números de día */
        .rbc-date-cell { 
          padding: 8px !important; 
          text-align: right !important; 
          height: 100% !important;
        }
        .rbc-date-cell > a { 
          color: #444 !important; 
          font-weight: 500 !important; 
          font-size: 0.85rem !important; 
        }

        /* DÍA ACTUAL RESALTADO */
        .rbc-today { 
          background: rgba(16, 185, 129, 0.08) !important; 
          box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.3) !important;
        }
        .rbc-today .rbc-date-cell > a { 
          color: #10b981 !important; 
          font-weight: 900 !important; 
          background: rgba(16, 185, 129, 0.15); 
          padding: 4px 10px; 
          border-radius: 8px; 
          border: 1px solid rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
        }

        /* Eventos */
        .rbc-event { 
          margin: 2px 4px !important; 
          border: none !important; 
          cursor: pointer; 
          transition: transform 0.1s;
        }
        .rbc-event:hover { 
          filter: brightness(1.2); 
          z-index: 10; 
          transform: scale(1.02);
        }

        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </Layout>
  );
}