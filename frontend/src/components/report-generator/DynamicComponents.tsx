import { dynamicImport, lazyLoad } from '@/lib/dynamic-import';

// Simple Skeleton component for loading states
const Skeleton = ({ className = '', ...props }: { className?: string, [key: string]: any }) => (
  <div
    className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
    {...props}
  />
);

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-10 w-3/4" />
  </div>
);

// Dynamically import heavy components to reduce initial bundle size
export const DynamicBeginTab = dynamicImport(
  () => import('./tabs/BeginTab'),
  <LoadingPlaceholder />
);

export const DynamicDataTab = dynamicImport(
  () => import('./tabs/DataTab'),
  <LoadingPlaceholder />
);

export const DynamicSourcesTab = dynamicImport(
  () => import('./tabs/SourcesTab'),
  <LoadingPlaceholder />
);

export const DynamicOutputConfigTab = dynamicImport(
  () => import('./tabs/OutputConfigTab'),
  <LoadingPlaceholder />
);

export const DynamicGenerateTab = dynamicImport(
  () => import('./tabs/GenerateTab'),
  <LoadingPlaceholder />
);

// Use lazy loading for components that are not needed immediately
export const LazyAudioRecorder = lazyLoad(
  () => import('../audio/AudioRecorder'),
  <Skeleton className="h-32 w-full rounded-md" />
);

export const LazyFileUploader = lazyLoad(
  () => import('../file/FileUploader'),
  <Skeleton className="h-32 w-full rounded-md" />
);

// Export all dynamic components
export const DynamicComponents = {
  BeginTab: DynamicBeginTab,
  DataTab: DynamicDataTab,
  SourcesTab: DynamicSourcesTab,
  OutputConfigTab: DynamicOutputConfigTab,
  GenerateTab: DynamicGenerateTab,
  AudioRecorder: LazyAudioRecorder,
  FileUploader: LazyFileUploader,
};
