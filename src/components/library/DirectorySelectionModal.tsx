import { motion } from "framer-motion";
import { FolderOpen, Download, Folder } from "lucide-react";
import { DownloadState, HostedBuild } from "./hosted-builds/types";

interface DirectorySelectionModalProps {
  selectedBuild: HostedBuild | null;
  downloadState: DownloadState;
  defaultInstallDir: string;
  onSelectDirectory: () => void;
  onUseDefaultDirectory: () => void;
  onCancel: () => void;
}

export const DirectorySelectionModal = ({
  selectedBuild,
  downloadState,
  defaultInstallDir,
  onSelectDirectory,
  onUseDefaultDirectory,
  onCancel,
}: DirectorySelectionModalProps) => (
  <motion.div
    className="fixed inset-0 z-[60] flex items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}>
    <motion.div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    />

    <motion.div
      className="relative bg-[#1A1A2E] border border-[#3F3F60] rounded-lg p-6 w-full max-w-md shadow-xl"
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}>
      <h3 className="text-xl font-semibold text-white mb-4">Select Installation Location</h3>

      <div className="mb-6">
        <p className="text-gray-300 mb-2">
          Where would you like to install{" "}
          <span className="font-semibold">
            {selectedBuild != null ? selectedBuild.title : "unknown"}
          </span>
          ?
        </p>
        <div className="flex items-center bg-[#252545] rounded-md p-3 border border-[#3F3F60]">
          <FolderOpen className="text-gray-400 mr-2 flex-shrink-0" size={18} />
          <p className="text-gray-300 text-sm truncate">
            {downloadState.installDir || defaultInstallDir || "Loading..."}
          </p>
        </div>
      </div>

      <div className="flex flex-col space-y-3">
        <motion.button
          className="flex items-center justify-center gap-2 bg-[#3F3F60] hover:bg-[#4F4F70] text-white py-2 px-4 rounded-md transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectDirectory}>
          <Folder size={18} />
          Choose Different Location
        </motion.button>

        <motion.button
          className="flex items-center justify-center gap-2 bg-[#252545] hover:bg-[#2A2A50] text-white py-2 px-4 rounded-md transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUseDefaultDirectory}
          disabled={!defaultInstallDir}>
          <Download size={18} />
          Use Default Location
        </motion.button>

        <motion.button
          className="text-gray-400 hover:text-white py-2 px-4 rounded-md transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}>
          Cancel
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);
