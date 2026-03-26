'use client';

import { useState } from 'react';
import { inviteMemberToWorkspace } from '@/app/actions/members';

interface InviteMembersProps {
  workspaceId: string;
  onInviteSent?: () => void;
}

export function InviteMembers({ workspaceId, onInviteSent }: InviteMembersProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);

    try {
      await inviteMemberToWorkspace(workspaceId, email, role);
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      setRole('member');
      onInviteSent?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-lg font-semibold text-primary mb-4">Invite Member</h3>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-600 rounded-lg p-3 mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleInvite} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
        >
          {sending ? 'Sending invitation...' : 'Send Invitation'}
        </button>
      </form>
    </div>
  );
}
