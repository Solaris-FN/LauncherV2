import { motion } from "framer-motion";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export const SearchBar = ({ value, onChange, onClear }: SearchBarProps) => (
  <div className="relative flex items-center">
    <input
      type="text"
      placeholder="Search builds..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#1A1A2E] border border-[#3F3F60] rounded-md py-1.5 pl-8 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#3F3F60] transition-all"
    />
    <Search className="absolute left-2.5 text-gray-500 h-3.5 w-3.5" />
    {value && (
      <motion.button
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="absolute right-2.5 text-gray-500 hover:text-white"
        onClick={onClear}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}>
        <X className="h-3.5 w-3.5" />
      </motion.button>
    )}
  </div>
);
