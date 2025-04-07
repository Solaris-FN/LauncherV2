import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { DownloadState } from "../types";

interface BuildProgressIndicatorProps {
  status: DownloadState["status"];
  progress: number;
}

export const BuildProgressIndicator = ({ status, progress }: BuildProgressIndicatorProps) => {
  if (status === "downloading") {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#1A1A2E" strokeWidth="2" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#3F3F60"
              strokeWidth="2"
              strokeDasharray="100"
              strokeDashoffset={100 - progress}
              transform="rotate(-90 18 18)"
            />
          </svg>
        </div>
        <span className="text-xs font-medium text-white">{progress}%</span>
      </div>
    );
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-10 h-10 flex items-center justify-center bg-green-500/20 rounded-md">
        <CheckCircle className="h-6 w-6 text-green-500" />
      </motion.div>
    );
  }

  if (status === "error") {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-10 h-10 flex items-center justify-center bg-red-500/20 rounded-md">
        <XCircle className="h-6 w-6 text-red-500" />
      </motion.div>
    );
  }

  return null;
};
