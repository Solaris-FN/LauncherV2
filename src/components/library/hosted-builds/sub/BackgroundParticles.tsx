import { motion } from "framer-motion";

export const BackgroundParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-white/20"
        initial={{
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          opacity: Math.random() * 0.5 + 0.3,
        }}
        animate={{
          y: [null, Math.random() * -500 - 100],
          opacity: [null, 0],
        }}
        transition={{
          duration: Math.random() * 10 + 15,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        style={{ scale: Math.random() * 0.5 + 0.5 }}
      />
    ))}
  </div>
);
