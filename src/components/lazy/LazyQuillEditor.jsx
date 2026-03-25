import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const ReactQuill = lazy(() =>
  import('react-quill').then((mod) => {
    // Co-load the theme CSS alongside the JS so it never renders unstyled
    import('react-quill/dist/quill.snow.css');
    return mod;
  })
);

/**
 * Code-split wrapper for ReactQuill editor
 * Lazy-loads the heavy Quill library only when needed
 */
export default function LazyQuillEditor({ value, onChange, theme = 'snow', style, placeholder }) {
  return (
    <div className="min-h-[150px]" style={{ willChange: 'contents' }}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[150px] bg-muted/30 rounded-md border border-border">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ReactQuill
          theme={theme}
          value={value}
          onChange={onChange}
          style={style}
          placeholder={placeholder}
        />
      </Suspense>
    </div>
  );
}