import { motion } from "framer-motion";
import { Download, FileDown } from "lucide-react";
import { HostedBuild } from "../../types";

interface DownloadButtonProps {
  build: HostedBuild;
  onClick: () => void;
}

export const DownloadButton = ({ build, onClick }: DownloadButtonProps) => (
  <motion.button
    className="p-2 text-gray-400 hover:text-white bg-[#2A1E36] hover:bg-[#3a294a] rounded-md transition-colors"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}>
    {build.useManifest ? <FileDown className="h-5 w-5" /> : <Download className="h-5 w-5" />}
  </motion.button>
);
