import dynamic from 'next/dynamic';
import { ComponentType, lazy, Suspense } from 'react';

/**
 * Creates a dynamically imported component with loading state
 * @param importFunc Function that imports the component
 * @param LoadingComponent Component to show while loading
 * @returns Dynamically imported component
 */
export function dynamicImport<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  LoadingComponent: React.ReactNode = null
) {
  return dynamic(() => importFunc(), {
    loading: () => <>{LoadingComponent}</>,
    ssr: false, // Disable server-side rendering for client-only components
  });
}

/**
 * Creates a lazily loaded component with loading state
 * @param importFunc Function that imports the component
 * @param LoadingComponent Component to show while loading
 * @returns Lazily loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  LoadingComponent: React.ReactNode = null
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={LoadingComponent}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Creates a dynamically imported component with loading state and error boundary
 * @param importFunc Function that imports the component
 * @param options Dynamic import options
 * @returns Dynamically imported component
 */
export function dynamicImportWithErrorBoundary<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    loading?: React.ReactNode;
    errorFallback?: React.ReactNode;
    ssr?: boolean;
  } = {}
) {
  const { loading = null, errorFallback = null, ssr = false } = options;
  
  return dynamic(() => importFunc().catch((err) => {
    console.error('Error loading component:', err);
    // Return a component that renders the error fallback
    return Promise.resolve({
      default: () => <>{errorFallback}</>
    });
  }), {
    loading: () => <>{loading}</>,
    ssr,
  });
}

export default dynamicImport;
