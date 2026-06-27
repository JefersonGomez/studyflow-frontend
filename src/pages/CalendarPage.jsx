import { useState, useMemo, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserEvents, deleteEvent, updateEvent } from "../api/events";
import Layout from "../components/Layout";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "es-ES": es };
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales,
});

// Paleta vibrante estilo "One Dashboard"
const EVENT_TYPES = {
  examen:      { color: "#ef4444", bg: "#ef4444", label: "Examen", shadow: "rgba(239,68,68,0.4)" },
  quiz:        { color: "#f59e0b", bg: "#f59e0b", label: "Quiz",   shadow: "rgba(245,158,11,0.4)" },
  proyecto:    { color: "#8b5cf6", bg: "#8b5cf6", label: "Proyecto", shadow: "rgba(139,92,246,0.4)" },
  laboratorio: { color: "#06b6d4", bg: "#06b6d4", label: "Lab",    shadow: "rgba(6,182,212,0.4)" },
  clase:       { color: "#10b981", bg: "#10b981", label: "Clase",  shadow: "rgba(16,185,129,0.4)" },
};

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (d < 0) return { label: "Vencido", urgent: true };
  if (d === 0) return { label: "Hoy", urgent: true };
  if (d === 1) return { label: "Mañana", urgent: true };
  return { label: `${d}d`, urgent: false };
}

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", type: "clase", startDate: "", endDate: "" });
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["user-events"],
    queryFn: () => getUserEvents().then((r) => r.data),
  });

  const currentMonthLabel = format(date, "MMMM yyyy", { locale: es });

  const upcoming = useMemo(() => {
    if (!events) return [];
    const now = new Date(); now.setHours(0,0,0,0);
    return events.filter(e => new Date(e.startDate) >= now)
                 .sort((a,b) => new Date(a.startDate) - new Date(b.startDate))
                 .slice(0, 5);
  }, [events]);

  const deleteMutation = useMutation({ mutationFn: deleteEvent, onSuccess: () => { queryClient.invalidateQueries(["user-events"]); setSelectedEvent(null); }});
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateEvent(id, data), onSuccess: () => { queryClient.invalidateQueries(["user-events"]); setIsEditing(false); }});

  const calendarEvents = events?.map(e => ({
    id: e.id, title: e.title, 
    start: new Date(e.startDate), end: new Date(e.endDate || e.startDate),
    type: e.type, description: e.description, courseName: e.courseName
  })) || [];

  // Estilo de evento tipo "Píldora Vibrante"
  const eventStyleGetter = (event) => {
    const t = EVENT_TYPES[event.type] || EVENT_TYPES.clase;
    return {
      style: {
        backgroundColor: t.bg,
        border: "none",
        borderRadius: "20px", // Forma de píldora completa
        color: "#fff",
        fontSize: "10px",
        fontWeight: "700",
        padding: "3px 8px",
        boxShadow: `0 4px 12px ${t.shadow}`,
        opacity: 0.95,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }
    };
  };

  const openEvent = (event) => { setSelectedEvent(event); setIsEditing(false); };
  
  const startEdit = () => {
    setEditForm({
      title: selectedEvent.title, description: selectedEvent.description || "",
      type: selectedEvent.type,
      startDate: new Date(selectedEvent.start).toISOString().split("T")[0],
      endDate: selectedEvent.end ? new Date(selectedEvent.end).toISOString().split("T")[0] : "",
    });
    setIsEditing(true);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: selectedEvent.id,
      data: { ...editForm, startDate: new Date(editForm.startDate+"T12:00:00").toISOString(), endDate: editForm.endDate ? new Date(editForm.endDate+"T12:00:00").toISOString() : null }
    });
  };

  // Bloquear scroll cuando modal está abierto
  useEffect(() => {
    document.body.style.overflow = selectedEvent ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [selectedEvent]);

  if (isLoading) return <Layout><div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/></div></Layout>;

  return (
    <Layout>
      {/* Animaciones Globales */}
      <style>{`
        @keyframes slideUpFade { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
        .animate-cell { animation: slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
        
        /* Sidebar Flotante 3D (IZQUIERDA) */
        .sidebar-float-left {
          background: #111;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        /* Calendario Base */
        .sf-calendar { height:100%; background:transparent; font-family:'Inter',sans-serif; }
        .rbc-month-view { border:none; background:transparent; flex:1; }
        .rbc-header { padding:1rem 0; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#555; border-bottom:1px solid rgba(255,255,255,0.05); background:transparent; }
        .rbc-day-bg { background: rgba(255,255,255,0.02); border-right:1px solid rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.03); transition: all 0.2s; }
        .rbc-day-bg:hover { background: rgba(255,255,255,0.04); }
        .rbc-off-range-bg { background: rgba(0,0,0,0.3); opacity:0.5; }
        .rbc-today { background: rgba(16,185,129,0.05); box-shadow: inset 0 0 0 1px rgba(16,185,129,0.2); }
        .rbc-date-cell { padding:8px; text-align:right; }
        .rbc-date-cell > a { color:#444; font-size:0.8rem; font-weight:500; text-decoration:none; }
        .rbc-today .rbc-date-cell > a { color:#10b981; font-weight:800; background:rgba(16,185,129,0.1); padding:4px 8px; border-radius:8px; display:inline-block; }
        .rbc-event { margin:2px 4px; border:none; cursor:pointer; transition:transform 0.15s; }
        .rbc-event:hover { transform:scale(1.05); z-index:10; filter:brightness(1.1); }
        .rbc-toolbar { display:none; } /* Ocultamos toolbar nativo para usar el custom */
        ::-webkit-scrollbar { width:0; }
      `}</style>

      <div className="flex min-h-screen bg-[#050505] p-6 gap-6 overflow-y-auto">
        
        {/* SIDEBAR IZQUIERDO FLOTANTE (Como antes) */}
        <div className="w-72 shrink-0 sidebar-float-left flex flex-col overflow-hidden relative z-20 h-fit max-h-[calc(100vh-48px)] sticky top-6">
          {/* Header con mes dinámico */}
          <div className="px-6 py-6 border-b border-white/5">
            <h1 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
              Calendario <span className="text-emerald-500 text-lg">.</span>
            </h1>
            <p className="text-gray-500 text-xs mt-1 font-medium uppercase tracking-widest">
              {currentMonthLabel}
            </p>
          </div>

          {/* Leyenda de Tipos */}
          <div className="px-6 py-5 border-b border-white/5">
            <p className="text-gray-600 text-[10px] font-bold mb-4 uppercase tracking-widest">
              Categorías
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {Object.entries(EVENT_TYPES).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 group cursor-default">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor] transition-transform group-hover:scale-125"
                    style={{ backgroundColor: val.color, color: val.color }}
                  />
                  <span className="text-gray-400 text-xs font-medium group-hover:text-white transition-colors">
                    {val.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos eventos - Lista Interactiva */}
          <div className="px-6 py-5 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                Próximos
              </p>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            </div>

            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                <span className="text-4xl mb-3 grayscale">🌙</span>
                <p className="text-gray-500 text-xs font-medium">
                  Todo tranquilo por ahora
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((ev) => {
                  const t = EVENT_TYPES[ev.type] || EVENT_TYPES.clase;
                  const { label, urgent } = daysUntil(ev.startDate);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setDate(new Date(ev.startDate));
                        openEvent({
                          id: ev.id,
                          title: ev.title,
                          start: new Date(ev.startDate),
                          end: new Date(ev.endDate || ev.startDate),
                          type: ev.type,
                          description: ev.description,
                        });
                      }}
                      className="group relative flex items-center gap-3 p-3 rounded-2xl bg-[#1a1a1a] border border-white/5 hover:border-white/10 hover:bg-[#222] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                    >
                      {/* Barra lateral de color neón */}
                      <div
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{
                          backgroundColor: t.color,
                          boxShadow: `0 0 10px ${t.color}`,
                        }}
                      />
                      
                      <div className="flex-1 min-w-0 pl-2">
                        <p className="text-white text-xs font-bold truncate group-hover:text-emerald-400 transition-colors">
                          {ev.title}
                        </p>
                        <p className="text-gray-500 text-[10px] mt-0.5 font-medium">
                          {new Date(ev.startDate).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>

                      {/* Badge de urgencia */}
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 transition-all ${
                          urgent
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                            : "bg-white/5 text-gray-500 border border-white/5"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats Footer - Estilo Dashboard Compacto */}
          <div className="p-6 bg-[#0d0d0d] border-t border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-3 text-center hover:border-white/10 transition-colors">
                <p className="text-white font-black text-xl">{events?.length || 0}</p>
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-wider mt-1">Total</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3 text-center hover:bg-emerald-500/10 transition-colors">
                <p className="text-emerald-400 font-black text-xl">{upcoming.length}</p>
                <p className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-wider mt-1">Urgentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* CALENDARIO PRINCIPAL (DERECHA) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar Personalizado Estilo One Dashboard */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Calendario</h1>
              <p className="text-gray-500 text-sm mt-1 font-medium uppercase tracking-widest">{currentMonthLabel}</p>
            </div>
            <div className="flex items-center gap-3 bg-[#111] p-1 rounded-xl border border-white/5">
              <button onClick={() => setDate(new Date())} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">HOY</button>
              <div className="w-px h-4 bg-white/10"></div>
              <button onClick={() => setDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-white/5">←</button>
              <button onClick={() => setDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-white/5">→</button>
            </div>
          </div>

          {/* Grid del Calendario */}
          <div className="flex-1 bg-[#0a0a0a] rounded-3xl border border-white/5 p-4 shadow-2xl relative overflow-hidden">
             {/* Efecto de luz ambiental superior */}
             <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none rounded-t-3xl" />
             
             <Calendar
                localizer={localizer} events={calendarEvents} startAccessor="start" endAccessor="end"
                date={date} onNavigate={setDate} view="month" onView={()=>{}} onSelectEvent={openEvent}
                eventPropGetter={eventStyleGetter}
                components={{
                  event: ({ event }) => {
                    const t = EVENT_TYPES[event.type] || EVENT_TYPES.clase;
                    return (
                      <div className="flex flex-col w-full h-full justify-center px-2">
                        <span className="truncate text-[10px] font-bold leading-tight drop-shadow-md">{event.title}</span>
                        {event.courseName && event.courseName !== "Sin Materia" && (
                          <span className="truncate text-[8px] leading-tight opacity-80 font-medium">{event.courseName}</span>
                        )}
                      </div>
                    );
                  },
                  // Inyectamos animación en cada celda/día
                  month: { dateHeader: ({ label, date }) => (
                    <span className="animate-cell" style={{ animationDelay: `${(date.getDate() % 7) * 30}ms` }}>{label}</span>
                  )}
                }}
                messages={{ next:"→", previous:"←", today:"Hoy", month:"Mes", noEventsInRange:"Sin eventos" }}
                className="sf-calendar"
             />
          </div>
        </div>

      </div>

      {/* MODAL DE DETALLES ESTILO GLASS */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => { setSelectedEvent(null); setIsEditing(false); }}>
          <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e=>e.stopPropagation()}>
            <div className="h-2 w-full" style={{ backgroundColor: (EVENT_TYPES[selectedEvent.type]||EVENT_TYPES.clase).color }} />
            
            <div className="p-6">
              {!isEditing ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 border border-white/10" style={{ backgroundColor: (EVENT_TYPES[selectedEvent.type]||EVENT_TYPES.clase).bg+'20', color: (EVENT_TYPES[selectedEvent.type]||EVENT_TYPES.clase).color }}>
                        {(EVENT_TYPES[selectedEvent.type]||EVENT_TYPES.clase).label}
                      </span>
                      <h2 className="text-2xl font-black text-white leading-tight">{selectedEvent.title}</h2>
                      {selectedEvent.courseName && <p className="text-emerald-400/80 text-sm mt-1 font-medium">📚 {selectedEvent.courseName}</p>}
                    </div>
                    <button onClick={()=>setSelectedEvent(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">✕</button>
                  </div>

                  <div className="space-y-4 mb-8 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 text-gray-300 text-sm font-medium">
                      <span className="text-emerald-500">📅</span>
                      <span>{new Date(selectedEvent.start).toLocaleDateString("es-ES",{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
                    </div>
                    {selectedEvent.description && (
                      <div className="pt-3 border-t border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Descripción</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{selectedEvent.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={startEdit} className="bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-white/5 text-white text-sm font-bold py-3 rounded-xl transition-all">✏️ Editar</button>
                    <button onClick={()=>deleteMutation.mutate(selectedEvent.id)} disabled={deleteMutation.isPending} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-50">🗑️ Eliminar</button>
                  </div>
                </>
              ) : (
                <form onSubmit={saveEdit}>
                  <h2 className="text-lg font-black text-white mb-4">Editar Evento</h2>
                  <div className="space-y-3 mb-6">
                    <input type="text" required value={editForm.title} onChange={e=>setEditForm({...editForm,title:e.target.value})} placeholder="Título" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" required value={editForm.startDate} onChange={e=>setEditForm({...editForm,startDate:e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 [color-scheme:dark]" />
                      <input type="date" value={editForm.endDate} onChange={e=>setEditForm({...editForm,endDate:e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 [color-scheme:dark]" />
                    </div>
                    <select value={editForm.type} onChange={e=>setEditForm({...editForm,type:e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500">
                      {Object.entries(EVENT_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <textarea rows={3} value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} placeholder="Descripción..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 resize-none" />
                  </div>
                  <button type="submit" disabled={updateMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20">Guardar Cambios</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}