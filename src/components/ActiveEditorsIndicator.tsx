'use client';

import { useActiveEditors } from '@/hooks/useCollaborativeEditing';

interface ActiveEditorsIndicatorProps {
  documentId: string;
}

/**
 * Shows who is currently editing the document in real-time.
 */
export function ActiveEditorsIndicator({ documentId }: ActiveEditorsIndicatorProps) {
  const { activeEditors } = useActiveEditors(documentId);

  if (activeEditors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex -space-x-2">
        {activeEditors.map((editor) => (
          <div
            key={editor.id}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs flex items-center justify-center border border-white"
            title={editor.user?.email}
          >
            {editor.user?.email?.[0]?.toUpperCase()}
          </div>
        ))}
      </div>
      <span className="text-xs text-green-700 font-medium">
        {activeEditors.length} editing now
      </span>
    </div>
  );
}
