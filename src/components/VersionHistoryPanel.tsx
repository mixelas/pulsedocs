'use client';

import { useState } from 'react';
import { useDocumentVersions } from '@/hooks/useCollaborativeEditing';
import { rollbackToVersion } from '@/app/actions/documentVersioning';

interface VersionHistoryPanelProps {
  documentId: string;
  currentVersion?: number;
}

/**
 * Displays document version history with ability to rollback.
 */
export function VersionHistoryPanel({
  documentId,
  currentVersion,
}: VersionHistoryPanelProps) {
  const { versions, loading } = useDocumentVersions(documentId);
  const [rolling, setRolling] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleRollback = async (versionNumber: number) => {
    setRolling(versionNumber.toString());
    setError('');

    try {
      await rollbackToVersion(documentId, versionNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRolling(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Version History</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {versions.length} version{versions.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-3 mt-2 p-2 bg-destructive/10 text-destructive rounded text-xs">
          {error}
        </div>
      )}

      {/* Versions list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Loading versions...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">No versions yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`p-2 rounded border ${
                  currentVersion === version.version_number
                    ? 'bg-primary/10 border-primary'
                    : 'border-border hover:border-primary/50'
                } transition cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      Version {version.version_number}
                    </p>
                    {version.change_summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {version.change_summary}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  {currentVersion !== version.version_number && (
                    <button
                      onClick={() => handleRollback(version.version_number)}
                      disabled={rolling === version.version_number.toString()}
                      className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-opacity-90 disabled:opacity-50 transition whitespace-nowrap"
                    >
                      {rolling === version.version_number.toString() ? 'Restoring...' : 'Restore'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
