import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateStudyPlan, getSavedStudyPlan } from "../api/ai";

export function useStudyPlan(courseId) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: savedData, isFetching } = useQuery({
    queryKey: ["studyplan", courseId],
    queryFn: () =>
      getSavedStudyPlan(courseId)
        .then((r) => r.data)
        .catch((err) => {
          if (err?.response?.status === 404) return null;
          throw err;
        }),
    enabled: isOpen, // ✅ Se activa automáticamente cuando el modal abre
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: ({ days }) => generateStudyPlan(courseId, days),
    onSuccess: () => {
      // ✅ Invalida la query para que recargue el plan recién guardado
      queryClient.invalidateQueries({ queryKey: ["studyplan", courseId] });
    },
  });

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    plan: savedData?.content || null,
    isOpen,
    isLoading: mutation.isPending || isFetching,
    error: mutation.error,
    generate: (days) => mutation.mutate({ days }),
    openModal,
    closeModal,
  };
}