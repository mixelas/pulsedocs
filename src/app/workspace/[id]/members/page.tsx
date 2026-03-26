'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getWorkspaceMembers,
  updateMemberRole,
  removeMemberFromWorkspace,
  getWorkspaceInvitations,
  revokeInvitation,
} from '@/app/actions/members';
import { getCurrentUserRole } from '@/lib/auth-helpers';
import { InviteMembers } from '@/components/InviteMembers';
import type { WorkspaceMember } from '@/types/database';

interface Props {
  params: { id: string };
}

export default function MembersPage({ params: { id } }: Props) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    async function load() {
      try {
        const membersData = await getWorkspaceMembers(id);
        setMembers(membersData);

        const role = await getCurrentUserRole(id);
        setUserRole(role);

        if (role === 'owner' || role === 'admin') {
          const invitationsData = await getWorkspaceInvitations(id);
          setInvitations(invitationsData);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleRoleChange(memberId: string, newRole: string) {
    setUpdating((prev) => ({ ...prev, [memberId]: true }));

    try {
      await updateMemberRole(id, memberId, newRole as any);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole as any } : m))
      );
    } finally {
      setUpdating((prev) => ({ ...prev, [memberId]: false }));
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMemberFromWorkspace(id, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      alert('Failed to remove member');
    }
  }

  async function handleRevokeInvitation(invitationId: string, email: string) {
    if (!confirm(`Revoke invitation for ${email}?`)) return;

    try {
      await revokeInvitation(invitationId, id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      alert('Failed to revoke invitation');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading members...</div>
      </div>
    );
  }

  const canManage = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-primary mb-2">Members</h2>
        <p className="text-muted-foreground">Manage workspace members and permissions</p>
      </div>

      {/* Invite section */}
      {canManage && (
        <InviteMembers
          workspaceId={id}
          onInviteSent={() => {
            // Refetch invitations
            getWorkspaceInvitations(id).then(setInvitations);
          }}
        />
      )}

      {/* Pending invitations */}
      {canManage && invitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-primary mb-4">Pending Invitations</h3>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Role: <span className="capitalize">{inv.role}</span> • Expires{' '}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                  className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-opacity-90 transition"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div>
        <h3 className="text-lg font-semibold text-primary mb-4">Members ({members.length})</h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {member.user_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </p>
              </div>

              {canManage && member.role !== 'owner' ? (
                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={updating[member.id]}
                    className="text-sm px-3 py-1 rounded bg-muted text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="guest">Guest</option>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-opacity-90 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-sm font-medium text-primary">
                  {member.role === 'owner' ? '👑 Owner' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Link
          href={`/workspace/${id}`}
          className="text-sm text-primary hover:underline font-medium"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
