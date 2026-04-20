
export type StorageCategory = 'recordings' | 'cache' | 'thumbnails' | 'system' | 'free';

export interface StorageStats {
  total: number; // in GB
  usedByApp: number; // in MB
  categories: {
    recordings: number; // in MB
    cache: number;
    thumbnails: number;
    appData: number;
  };
  freeOnDevice: number; // in GB
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  recordingCount: number;
  isSystem?: boolean;
}

export interface Tag {
  id: string;
  label: string;
  color: string;
}

export interface CleanupRule {
  id: string;
  name: string;
  condition: {
    type: 'age' | 'size' | 'playCount';
    operator: '>' | '<';
    value: number;
  };
  action: 'delete' | 'archive' | 'compress';
  enabled: boolean;
}

export interface StorageLocation {
  id: string;
  name: string;
  type: 'internal' | 'sd-card' | 'external';
  total: number;
  free: number;
  isDefault: boolean;
  status: 'active' | 'readonly' | 'unmounted' | 'warning';
}
