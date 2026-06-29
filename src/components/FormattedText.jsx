export default function FormattedText({ text }) {
  if (!text) return null;

  // 1. Limpieza de prefijos y normalización
  let cleanText = text
    .replace(/^Resumen:\s*/i, "")
    .replace(/^Conclusión:\s*/i, "")
    .replace(/En resumen,\s*/gi, "")
    .trim();

  // 2. Normalizar listas inconsistentes
  // Detecta líneas que parecen items de lista (empiezan con espacio + mayúscula + dos puntos o son continuación de lista)
  const lines = cleanText.split('\n');
  const normalizedLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Línea vacía = fin de lista potencial
    if (!line) {
      inList = false;
      normalizedLines.push('');
      continue;
    }

    // Ya tiene marcador de lista explícito
    if (/^[\*\-•]\s+/.test(line)) {
      inList = true;
      normalizedLines.push(`* ${line.replace(/^[\*\-•]\s+/, '')}`);
      continue;
    }

    // Parece item de lista por contexto (anterior era lista O tiene estructura "Tema: descripción")
    const looksLikeListItem = 
      inList || 
      /^[A-ZÁ][a-zá]+(?:\s+[a-zá]+)*:\s+.+/.test(line); // "Tema: descripción"

    if (looksLikeListItem && line.length < 200) { // Evitar convertir párrafos largos
      inList = true;
      normalizedLines.push(`* ${line}`);
    } else {
      inList = false;
      normalizedLines.push(line);
    }
  }

  cleanText = normalizedLines.join('\n');

  // 3. Convertir markdown a HTML
  let html = cleanText
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\* (.+)$/gm, "<li>$1</li>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br />");

  // 4. Agrupar <li> en <ul>
  html = html.replace(
    /(<li>.*?<\/li>(?:<br \/>)?)+/g,
    (match) => `<ul class="list-disc pl-5 my-3 space-y-1.5">${match.replace(/<br \/>/g, "")}</ul>`
  );

  // 5. Envolver en párrafos si no hay etiquetas block
  if (!/<[p|ul|div]/.test(html)) {
    html = `<p>${html}</p>`;
  }

  // 6. Limpiar etiquetas vacías
  html = html.replace(/<p>\s*<\/p>/g, '').replace(/<br \/><\/p>/g, '</p>');

  return (
    <div 
      className="prose prose-invert prose-sm max-w-none 
        [&_strong]:text-emerald-400 [&_strong]:font-bold
        [&_ul]:text-gray-300 [&_li]:leading-relaxed
        [&_p]:mb-3 [&_p:last-child]:mb-0"
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}