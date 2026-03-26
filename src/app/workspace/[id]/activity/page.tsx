'use client';

import { ActivityFeed } from '@/components/ActivityFeed';

interface Props {
  params: { id: string };
}

export default function ActivityPage({ params: { id } }: Props) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-2">Activity Log</h2>
        <p className="text-muted-foreground">
          Track all changes and events in your workspace
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <ActivityFeed workspaceId={id} />
      </div>
    </div>
  );
}
