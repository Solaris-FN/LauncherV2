import { motion } from "framer-motion";
import { Download } from "lucide-react";

export const EmptyBuildList = () => (
  <motion.div
    className="flex flex-col items-center justify-center h-64 text-center py-12"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}>
    <motion.div
      className="bg-[#252545] p-4 rounded-full mb-4 relative"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: 0.3,
      }}>
      <div className="absolute inset-0 rounded-full bg-[#3F3F60]/20 blur-md"></div>
      <Download className="h-12 w-12 text-gray-400 relative z-10" />
    </motion.div>
    <h3 className="text-white text-lg font-medium mb-2">No downloads</h3>
    <p className="text-gray-400 max-w-md">
      No builds match your search criteria. Try adjusting your search or browse the available
      categories.
    </p>
  </motion.div>
);
