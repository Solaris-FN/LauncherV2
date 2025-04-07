import { motion } from "framer-motion";
import { Download, FileDown } from "lucide-react";
import { HostedBuild } from "../../types";

interface DownloadButtonProps {
  build: HostedBuild;
  onClick: () => void;
}

export const DownloadButton = ({ build, onClick }: DownloadButtonProps) => (
  <motion.button
    className="p-2 text-gray-400 hover:text-white bg-[#1A1A2E] hover:bg-[#3F3F60] rounded-md transition-colors"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}>
    {build.useManifest ? <FileDown className="h-5 w-5" /> : <Download className="h-5 w-5" />}
  </motion.button>
);
