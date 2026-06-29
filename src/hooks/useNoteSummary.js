import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { summarizeNote } from "../api/ai";

export function useNoteSummary(noteId, originalContent) {
  const [summary, setSummary] = useState(null);
  const [isSummarized, setIsSummarized] = useState(false);

  const mutation = useMutation({
    mutationFn: () => summarizeNote(noteId),
    onSuccess: (data) => {
  const extractedText = data.data?.summary || "";
  setSummary(extractedText);
  setIsSummarized(true);
},
    onError: (err) => {
      console.error("Error al resumir nota:", err);
      // Opcional: podrías mostrar un toast aquí
    },
  });

  const toggleSummary = () => {
    if (!isSummarized && !mutation.isPending) {
      mutation.mutate();
    } else {
      setIsSummarized(!isSummarized);
    }
  };

  return {
    content: isSummarized ? summary : originalContent,
    isSummarized,
    isLoading: mutation.isPending,
    error: mutation.error,
    toggleSummary,
  };
}
