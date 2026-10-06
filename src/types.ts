export interface PaletteColor {
  hex: string;
  rgb: string;
  hsl: string;
  cmyk: string;
  name: string;
  locked?: boolean;
}

export interface Creator {
  id: string;
  name: string;
  avatar: string;
}

export interface Palette {
  id: string;
  name: string;
  colors: PaletteColor[];
  tags: string[];
  styles: string[];
  topics: string[];
  creator: Creator;
  likes: number;
  views: number;
  createdAt: string;
  isPublic: boolean;
  isFavorite?: boolean;
}

export interface FilterState {
  searchQuery: string;
  tags: string[];
  selectedColors: string[];
  customHex?: string;
  selectedStyles: string[];
  selectedTopics: string[];
  sortOrder: 'trending' | 'latest' | 'popular';
  advanced: {
    hueRange: [number, number];
    saturationMin: number;
    brightnessMin: number;
    temperature: 'all' | 'warm' | 'cool';
    numColors: number | null;
    wcagAA: boolean;
    wcagAAA: boolean;
    colorBlindFriendly: boolean;
    simulationMode: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  };
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  paletteIds: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  paletteIds: string[];
  createdAt: string;
}

export interface VideoColorRole {
  id: string;
  label: string;
  colorHex: string;
  usage: string;
}

export type VideoBriefStatus = 'draft' | 'in-review' | 'changes-requested' | 'approved';

export interface VideoBriefExportSections {
  briefDetails: boolean;
  paletteDirection: boolean;
  visualizerPreview: boolean;
  referenceFrame: boolean;
  colorRoles: boolean;
  notes: boolean;
  editorHandoff: boolean;
  approvalDetails: boolean;
}

export interface VideoColorBrief {
  id: string;
  title: string;
  clientName: string;
  projectName: string;
  revision: number;
  status: VideoBriefStatus;
  palette: Palette;
  visualizerImageDataUrl?: string;
  exportSections?: Partial<VideoBriefExportSections>;
  roles: VideoColorRole[];
  notes: string;
  referenceFrameUrl: string;
  deliveryFormat: 'rec709' | 'rec2020-hlg' | 'rec2020-pq' | 'not-specified';
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActiveView = 'explore' | 'generator' | 'completer' | 'visualizer' | 'script-splitter' | 'contrast' | 'image-picker' | 'dashboard' | 'video-briefs';
