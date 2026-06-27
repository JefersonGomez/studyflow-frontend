import { motion } from "framer-motion";

// ✅ Nueva variante sin "golpes" ni rebotes
const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 6 // Reducido de 8px a 6px para ser más sutil
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    // Curva "easeOutQuart": empieza suave, acelera un poco y frena MUY gradualmente
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  },
  exit: { 
    opacity: 0, 
    y: -4, 
    transition: { 
      duration: 0.25, 
      ease: [0.55, 0.085, 0.68, 0.53] // EaseInCubic: salida natural hacia arriba
    } 
  }
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}