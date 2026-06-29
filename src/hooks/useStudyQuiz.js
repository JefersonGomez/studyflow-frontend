import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateQuestions } from "../api/ai";

export function useStudyQuiz(noteId, noteContent) {
  const [questions, setQuestions] = useState([]);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [hasGenerated, setHasGenerated] = useState(false);

  const mutation = useMutation({
    mutationFn: () => generateQuestions(noteId),
  onSuccess: (data) => {
  let parsed = [];

  try {
    const raw = data.data;
    const questionsRaw = raw.questions;

    if (Array.isArray(questionsRaw)) {
      parsed = questionsRaw;
    } else if (typeof questionsRaw === "string") {
      // Dividir por número + punto al inicio de línea: "1. ", "2. ", etc.
      const blocks = questionsRaw
        .split(/\n(?=\d+\.\s+)/)
        .map(b => b.trim())
        .filter(Boolean);

      parsed = blocks.map((block) => {
        // Pregunta: texto entre ** **
        const questionMatch = block.match(/\*\*(.+?)\*\*/);
        const question = questionMatch
          ? questionMatch[1].trim()
          : block.split("\n")[0].replace(/^\d+\.\s+/, "").trim();

        // Respuesta correcta: línea que empieza con "Respuesta:"
        const answerMatch = block.match(/Respuesta:\s*[A-D]\)\s*(.+)/);
        const answer = answerMatch ? answerMatch[1].trim() : "No disponible";

        return { question, answer };
      });
    }
  } catch (e) {
    console.error("Error parsing quiz questions:", e);
    parsed = [];
  }

  setQuestions(parsed);
  setHasGenerated(true);
  setRevealedAnswers({});
},
    onError: () => {
      setQuestions([]); // Asegurar array vacío en caso de error de red
    },
  });

  const toggleAnswer = (index) => {
    setRevealedAnswers((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const regenerate = () => {
    if (!mutation.isPending) mutation.mutate();
  };

  return {
    questions, // ✅ Siempre será [] o un array válido
    isLoading: mutation.isPending,
    error: mutation.error,
    hasGenerated,
    revealAnswer: toggleAnswer,
    isAnswerRevealed: (i) => !!revealedAnswers[i],
    regenerate,
  };
}
