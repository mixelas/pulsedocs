import React, { type ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SignUp from './page';

const { pushMock, refreshMock, signUpMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: signUpMock,
    },
  }),
}));

describe('SignUp page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits credentials and redirects on successful sign up', async () => {
    signUpMock.mockResolvedValue({ error: null });

    render(<SignUp />);

    await userEvent.type(screen.getByLabelText('Email'), 'bob@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'bob@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      },
    });
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('shows an auth error when sign up fails', async () => {
    signUpMock.mockResolvedValue({ error: { message: 'Email already registered' } });

    render(<SignUp />);

    await userEvent.type(screen.getByLabelText('Email'), 'bob@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
