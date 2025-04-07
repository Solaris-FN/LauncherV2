import { motion } from "framer-motion";

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const Tab = ({ label, isActive, onClick }: TabProps) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-sm font-medium transition-colors relative ${
      isActive ? "text-white" : "text-gray-400 hover:text-white"
    }`}>
    {label}
    {isActive && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#3F3F60] to-[#5F5F80]"
        layoutId="activeTab"
      />
    )}
  </button>
);
