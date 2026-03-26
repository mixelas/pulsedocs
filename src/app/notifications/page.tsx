'use client';

import Link from 'next/link';
import { markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '@/app/actions/notifications';
import { useNotificationsSubscription } from '@/hooks/useNotificationsSubscription';

export default function NotificationsPage() {
  const { notifications } = useNotificationsSubscription();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function handleMarkAsRead(notificationId: string) {
    await markNotificationAsRead(notificationId);
  }

  async function handleDelete(notificationId: string) {
    await deleteNotification(notificationId);
  }

  async function handleMarkAllAsRead() {
    await markAllNotificationsAsRead();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">PulseDocs</h1>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition">
            Back to workspaces
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2">Notifications</h2>
            <p className="text-muted-foreground">
              Mentions, comments, and workspace activity
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-card rounded-lg p-12 border border-border text-center">
            <p className="text-muted-foreground mb-4">No notifications yet</p>
            <Link href="/dashboard" className="text-sm text-primary hover:underline font-medium">
              Go to workspaces
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-card rounded-lg p-4 border border-border ${
                  !notif.read_at ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {notif.target_url ? (
                      <Link href={notif.target_url} className="hover:underline">
                        <h3 className="font-semibold text-primary">{notif.title}</h3>
                      </Link>
                    ) : (
                      <h3 className="font-semibold text-primary">{notif.title}</h3>
                    )}
                    {notif.body && (
                      <p className="text-sm text-muted-foreground mt-2">{notif.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!notif.read_at && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-opacity-90 transition"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-opacity-90 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
