'use client';

import { useState } from 'react';
import Link from 'next/link';
import { markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '@/app/actions/notifications';
import { useNotificationsSubscription } from '@/hooks/useNotificationsSubscription';

export function NotificationBell() {
  const { notifications } = useNotificationsSubscription();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function handleMarkAsRead(notificationId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await markNotificationAsRead(notificationId);
  }

  async function handleDelete(notificationId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await deleteNotification(notificationId);
  }

  async function handleMarkAllAsRead(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await markAllNotificationsAsRead();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-primary transition"
        title="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.target_url || '#'}
                  onClick={() => setIsOpen(false)}
                  className={`block p-4 border-b border-border hover:bg-muted transition ${
                    !notif.read_at ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">
                        {notif.title}
                      </h4>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      {!notif.read_at && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="text-primary hover:text-primary/80 transition"
                          title="Mark as read"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="text-destructive hover:text-destructive/80 transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-border">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
