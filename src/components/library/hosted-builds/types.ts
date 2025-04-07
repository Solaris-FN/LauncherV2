export interface HostedBuild {
  id: string;
  title: string;
  version: string;
  buildId: string;
  size: string;
  imageUrl: string;
  tags: string[];
  useManifest?: boolean;
}

export interface HostedBuildsProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DownloadState {
  buildId: string | null;
  progress: number;
  status: "idle" | "downloading" | "extracting" | "success" | "error" | "selecting_location";
  speed: string;
  downloaded: string;
  total: string;
  installDir?: string;
  eta?: string;
}

export interface DownloadProgressType {
  percentage: number;
  speed: string;
  downloaded: string;
  total: string;
  eta: string;
}

export interface BuildCardProps {
  build: HostedBuild;
  downloadState: DownloadState;
  onDownload: (build: HostedBuild) => Promise<void>;
  cancelDownload: (buildId: string) => Promise<void>;
  hoveredBuild: string | null;
  setHoveredBuild: (id: string | null) => void;
}

export interface DirectorySelectorProps {
  selectedBuild: HostedBuild | null;
  downloadState: DownloadState;
  defaultInstallDir: string;
  onCancel: () => void;
  onSelectDirectory: () => Promise<void>;
  onUseDefaultDirectory: () => void;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export interface DownloadProgressProps {
  downloadState: DownloadState;
  onCancel: () => void;
}

export interface EmptyStateProps {
  searchQuery: string;
}

