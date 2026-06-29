import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourses, createCourse, deleteCourse } from "../api/courses";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ConfirmModal from "../components/ConfirmModal";
import StudyPlanModal from "../components/StudyPlanModal";
import { useStudyPlan } from "../hooks/useStudyPlan";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

// ✅ Componente separado para que useStudyPlan no esté dentro de un loop
function CourseCard({ course, onDelete }) {
  const navigate = useNavigate();
  const { plan, isOpen, isLoading: isPlanLoading, error: planError, generate, openModal, closeModal } = useStudyPlan(course.id);

  return (
    <div>
      <div
        onClick={() => navigate(`/courses/${course.id}`)}
        className="relative bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group overflow-hidden cursor-pointer"
      >
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: course.color || "#10b981" }} />
        <div className="absolute top-0 left-0 right-0 h-24 opacity-5 rounded-t-2xl" style={{ background: `linear-gradient(to bottom, ${course.color || "#10b981"}, transparent)` }} />

        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-lg" style={{ backgroundColor: `${course.color || "#10b981"}20` }}>
            <span style={{ color: course.color || "#10b981" }}>📚</span>
          </div>
          <h3 className="text-white font-semibold text-base leading-tight">{course.name}</h3>
          {course.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course.description}</p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); openModal(); }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-gray-400 hover:text-emerald-400 text-xs font-bold transition-all"
          >
            🗓️ Crear Plan de Estudio
          </button>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#1f1f1f]">
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${course.color || "#10b981"}15`, color: course.color || "#10b981" }}>
              Activa
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <StudyPlanModal
        courseName={course.name}
        isOpen={isOpen}
        onClose={closeModal}
        onGenerate={generate}
        plan={plan}
        isLoading={isPlanLoading}
        error={planError}
      />
    </div>
  );
}

export default function CoursePage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [deleteCourseId, setDeleteCourseId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0] });

  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      setShowModal(false);
      setForm({ name: "", description: "", color: COLORS[0] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(["courses"]);
      setDeleteCourseId(null);
    },
  });

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Materias</h1>
            <p className="text-gray-400 mt-1 text-sm">Gestiona tus cursos del semestre</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          >
            + Nueva materia
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-500 text-lg">No tienes materias aún</p>
            <p className="text-gray-600 text-sm mt-1">Crea tu primera materia para empezar</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {data?.map((course) => (
              <CourseCard key={course.id} course={course} onDelete={setDeleteCourseId} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-semibold text-lg mb-5">Nueva materia</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nombre</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Bases de Datos"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Descripción</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                      className="w-7 h-7 rounded-full transition-transform duration-150 hover:scale-110"
                      style={{ backgroundColor: color, outline: form.color === color ? `2px solid ${color}` : "none", outlineOffset: "2px" }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-gray-400 text-sm py-2 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
                  {createMutation.isPending ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div> 
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteCourseId}
        title="¿Eliminar esta materia?"
        message="Se eliminarán también todas las tareas, notas y eventos asociados. Esta acción no se puede deshacer."
        onConfirm={() => deleteMutation.mutate(deleteCourseId)}
        onCancel={() => setDeleteCourseId(null)}
        isPending={deleteMutation.isPending}
      />
    </Layout>
  );
}