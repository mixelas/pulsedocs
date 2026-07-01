// @vitest-environment node

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createDocument } from './workspace';

const {
  createClientMock,
  getCurrentUserMock,
  getCurrentUserRoleMock,
  canCreateDocumentMock,
  logActivityMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  getCurrentUserRoleMock: vi.fn(),
  canCreateDocumentMock: vi.fn(),
  logActivityMock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: getCurrentUserMock,
  getCurrentUserRole: getCurrentUserRoleMock,
}));

vi.mock('@/lib/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/permissions')>();
  return {
    ...actual,
    canCreateDocument: canCreateDocumentMock,
  };
});

vi.mock('@/app/actions/activity', () => ({
  logActivity: logActivityMock,
}));

describe('createDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when user is not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    await expect(createDocument('ws-1', 'Doc title', 'Body')).rejects.toThrow('Not authenticated');
  });

  it('throws when user does not have permission to create documents', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    getCurrentUserRoleMock.mockResolvedValue('viewer');
    canCreateDocumentMock.mockReturnValue(false);

    await expect(createDocument('ws-1', 'Doc title', 'Body')).rejects.toThrow('Permission denied');
  });

  it('inserts a document and logs activity', async () => {
    const insertedDocument = {
      id: 'doc-123',
      workspace_id: 'ws-1',
      title: 'Doc title',
      content: 'Body',
    };

    const singleMock = vi.fn().mockResolvedValue({ data: insertedDocument, error: null });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectMock });
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock });

    getCurrentUserMock.mockResolvedValue({ id: 'user-1' });
    getCurrentUserRoleMock.mockResolvedValue('owner');
    canCreateDocumentMock.mockReturnValue(true);
    createClientMock.mockResolvedValue({ from: fromMock });
    logActivityMock.mockResolvedValue(undefined);

    const result = await createDocument('ws-1', 'Doc title', 'Body');

    expect(fromMock).toHaveBeenCalledWith('documents');
    expect(insertMock).toHaveBeenCalledWith({
      workspace_id: 'ws-1',
      title: 'Doc title',
      content: 'Body',
      folder_id: null,
      created_by: 'user-1',
      updated_by: 'user-1',
    });
    expect(logActivityMock).toHaveBeenCalledWith(
      'ws-1',
      'document_created',
      'Created document "Doc title"',
      {
        documentId: 'doc-123',
        documentTitle: 'Doc title',
      }
    );
    expect(result).toEqual(insertedDocument);
  });
});
