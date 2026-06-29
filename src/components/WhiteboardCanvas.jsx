import { useState, useCallback, useEffect, useRef } from "react";
import { Tldraw, useEditor } from "tldraw";
import "tldraw/tldraw.css";
import { updateWhiteboard } from "../api/whiteboards";

// Hook personalizado para debounce (evita guardar en cada pixel que mueves)
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function AutoSaveWrapper({ whiteboardId }) {
  const editor = useEditor();
  const elementsRef = useRef("");

  // Escuchar cambios en el store de Tldraw
  useEffect(() => {
    const handleChange = () => {
      // ✅ CORRECCIÓN: Usar serialize() en lugar de getSnapshot()
      const snapshot = JSON.stringify(editor.store.serialize());

      // Solo actualizar si hay cambios reales
      if (snapshot !== elementsRef.current) {
        elementsRef.current = snapshot;
      }
    };

    // Suscribirse a cambios en documentos y metadatos
    const unsubscribe = editor.store.listen(handleChange, {
      source: "user",
      scope: "document",
    });

    return () => unsubscribe();
  }, [editor]);

  // Guardar en backend con debounce (cada 1 segundo de inactividad)
  const debouncedElements = useDebounce(elementsRef.current, 1000);

  useEffect(() => {
    if (!whiteboardId || !debouncedElements || debouncedElements === "{}")
      return;

    const saveToBackend = async () => {
      try {
        await updateWhiteboard(whiteboardId, { elements: debouncedElements });
        console.log("✅ Pizarra guardada automáticamente");
      } catch (err) {
        console.error("❌ Error guardando pizarra:", err);
      }
    };

    saveToBackend();
  }, [debouncedElements, whiteboardId]);

  return null;
}

export default function WhiteboardCanvas({ initialElements, whiteboardId }) {
  const [snapshot, setSnapshot] = useState(undefined);

  // Cargar elementos iniciales solo una vez al montar o cambiar de pizarra
  useEffect(() => {
    if (initialElements) {
      try {
        const parsed =
          typeof initialElements === "string"
            ? JSON.parse(initialElements)
            : initialElements;

        // ✅ CORRECCIÓN: Pasar undefined si está vacío para evitar errores
        setSnapshot(Object.keys(parsed).length > 0 ? parsed : undefined);
      } catch (e) {
        console.error("Error parsing whiteboard:", e);
        setSnapshot(undefined);
      }
    } else {
      setSnapshot(undefined);
    }
  }, [whiteboardId, initialElements]); // ← Dependencia clave para cambiar de pizarra

  return (
    <div className="w-full h-full bg-[#f8f9fa] rounded-2xl overflow-hidden">
      <Tldraw
        licenseKey="tldraw-2026-07-13/WyJGdkxFY3ZkLSIsWyIqIl0sMTYsIjIwMjYtMDctMTMiXQ.kJW/yB2ARNrnNeSSkti04G/THuiOoImGCwE2q1TMI0i8FOq2QQclifKN3b2g/EWQzfa7hutA2q4Ib79Kf7c2Jg"
        snapshot={snapshot}
        autoFocus
        persistenceKey={whiteboardId}
      >
        <AutoSaveWrapper whiteboardId={whiteboardId} />
      </Tldraw>
    </div>
  );
}
