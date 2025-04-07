import { motion } from "framer-motion";
import Image from "next/image";
import { BuildProgressIndicator } from "./BuildProgressIndicator";
import { DownloadButton } from "./download/DownloadButton";
import { DownloadInfoPopover } from "./download/DownloadInfoPopover";
import { DownloadState, HostedBuild } from "../types";

interface BuildCardProps {
  build: HostedBuild;
  index: number;
  downloadState: DownloadState;
  isHovered: boolean;
  onHover: (buildId: string) => void;
  onLeaveHover: () => void;
  onDownloadClick: (build: HostedBuild) => void;
  onCancelDownload: (buildId: string) => void;
}

export const BuildCard = ({
  build,
  index,
  downloadState,
  isHovered,
  onHover,
  onLeaveHover,
  onDownloadClick,
  onCancelDownload,
}: BuildCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="relative"
    onHoverStart={() => onHover(build.id)}
    onHoverEnd={() => onLeaveHover()}>
    <motion.div
      className="flex items-center bg-[#2A1E36] hover:bg-[#3a294a] rounded-md p-3 transition-colors group relative overflow-hidden"
      whileHover={{
        y: -2,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3F3F60]/10 to-transparent"
        initial={{ opacity: 0, x: -100 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 300 : -100,
        }}
        transition={{
          duration: 1,
          repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
        }}
      />

      <div className="h-12 w-12 bg-[#2A1E36] rounded-md overflow-hidden flex-shrink-0 relative z-10">
        <Image
          src={build.imageUrl || "/placeholder.svg"}
          alt={build.title}
          width={48}
          height={48}
          className="object-cover"
        />
      </div>

      <div className="ml-3 flex-1 relative z-10">
        <div className="flex items-center">
          <h3 className="font-medium text-white">{build.title}</h3>
          <span className="ml-2 text-gray-400 text-sm font-mono">{build.buildId}</span>
        </div>

        <div className="flex items-center mt-1">
          {build.tags.map((tag, index) => (
            <motion.span
              key={index}
              className="mr-2 text-xs bg-[#2A1E36] text-gray-300 px-2 py-0.5 rounded-sm"
              whileHover={{ scale: 1.05 }}>
              {tag}
            </motion.span>
          ))}
          <span className="text-xs text-gray-400 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {build.size}
          </span>
        </div>
      </div>

      <div className="relative z-10">
        {downloadState.buildId === build.id ? (
          <div className="relative">
            <BuildProgressIndicator
              status={downloadState.status}
              progress={downloadState.progress}
            />
          </div>
        ) : (
          <DownloadButton build={build} onClick={() => onDownloadClick(build)} />
        )}
      </div>
    </motion.div>

    {downloadState.buildId === build.id && downloadState.status === "downloading" && (
      <DownloadInfoPopover
        downloadState={downloadState}
        buildId={build.id}
        onCancel={onCancelDownload}
      />
    )}
  </motion.div>
);
