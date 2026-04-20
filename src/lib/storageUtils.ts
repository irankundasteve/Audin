
import { StorageStats, StorageLocation } from "../types/storage";

export const getMockStorageStats = (): StorageStats => ({
  total: 128,
  usedByApp: 14540, // 14.2 GB
  categories: {
    recordings: 13107.2, // 12.8 GB
    cache: 1126.4, // 1.1 GB
    thumbnails: 150,
    appData: 156.4
  },
  freeOnDevice: 42.3
});

export const getMockStorageLocations = (): StorageLocation[] => [
  {
    id: 'internal',
    name: 'Internal Storage',
    type: 'internal',
    total: 128,
    free: 42.3,
    isDefault: true,
    status: 'active'
  },
  {
    id: 'sd-card',
    name: 'SanDisk SD Card',
    type: 'sd-card',
    total: 256,
    free: 124.5,
    isDefault: false,
    status: 'active'
  }
];

export const formatSize = (mb: number) => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
};

export const calculateProjection = (avgDailyMb: number, currentFreeMb: number) => {
  if (avgDailyMb <= 0) return Infinity;
  return Math.floor(currentFreeMb / avgDailyMb);
};
