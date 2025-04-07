"use client";

import { motion } from "framer-motion";
import { Clock, Download, FolderOpen, StopCircle, Zap } from "lucide-react";
import type { DownloadState } from "../../types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "app/components/ui/tooltip";
import { cn } from "app/utils";

interface DownloadInfoPopoverProps {
  downloadState: DownloadState;
  buildId: string;
  onCancel: (buildId: string) => void;
}

export const DownloadInfoPopover = ({
  downloadState,
  buildId,
  onCancel,
}: DownloadInfoPopoverProps) => {
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-full mt-2 bg-[#1A1A2E] border border-[#3F3F60] rounded-lg p-4 shadow-lg z-20 w-72 text-sm text-zinc-100">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Downloading...</span>
              <span className="text-zinc-400 text-xs">{downloadState.progress}%</span>
            </div>

            <div className="h-1.5 w-full bg-[#252545] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${downloadState.progress}%` }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Zap className="h-3.5 w-3.5" />
              <span>Speed</span>
            </div>
            <div className="font-mono text-right">{downloadState.speed}</div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <Download className="h-3.5 w-3.5" />
              <span>Progress</span>
            </div>
            <div className="font-mono text-right">
              {downloadState.downloaded} / {downloadState.total}
            </div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              <span>ETA</span>
            </div>
            <div className="font-mono text-right">{downloadState.eta}</div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Location</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-mono text-right truncate">{downloadState.installDir}</div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-xs bg-[#1A1A2E] border-[#3F3F60] text-zinc-100">
                <p className="font-mono text-xs">{downloadState.installDir}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <motion.button
            className={cn(
              "w-full flex items-center justify-center gap-1.5 rounded-md py-2 px-3 text-sm font-medium",
              "bg-[#252545] text-red-400 hover:bg-[#2F2F5A] transition-colors"
            )}
            onClick={() => onCancel(buildId)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}>
            <StopCircle className="h-4 w-4" />
            <span>Cancel Download</span>
          </motion.button>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};
