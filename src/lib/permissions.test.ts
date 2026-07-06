import { describe, it, expect } from 'vitest';
import {
  canComment,
  canCreateChannel,
  canCreateDocument,
  canDeleteContent,
  canEditDocument,
  canInviteMembers,
  canManageChannels,
  canManageWorkspace,
  hasAtLeastRole,
} from './permissions';

describe('permissions helpers', () => {
  it('grants the expected access for each role', () => {
    expect(canCreateDocument('member')).toBe(true);
    expect(canCreateDocument('guest')).toBe(false);
    expect(canDeleteContent('admin')).toBe(true);
    expect(canDeleteContent('member')).toBe(false);
    expect(canComment('guest')).toBe(false);
    expect(canComment('member')).toBe(true);
    expect(canManageWorkspace('owner')).toBe(true);
    expect(canManageWorkspace('member')).toBe(false);
    expect(canInviteMembers('admin')).toBe(true);
    expect(canInviteMembers('member')).toBe(false);
    expect(canCreateChannel('member')).toBe(true);
    expect(canCreateChannel('guest')).toBe(false);
    expect(canManageChannels('admin')).toBe(true);
    expect(canManageChannels('member')).toBe(false);
    expect(canEditDocument('member')).toBe(true);
    expect(canEditDocument('guest')).toBe(false);
  });

  it('supports role hierarchy checks', () => {
    expect(hasAtLeastRole('owner', 'member')).toBe(true);
    expect(hasAtLeastRole('admin', 'owner')).toBe(false);
    expect(hasAtLeastRole('member', 'guest')).toBe(true);
    expect(hasAtLeastRole('guest', 'member')).toBe(false);
  });
});
