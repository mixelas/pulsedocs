// Application metadata
export const APP_NAME = 'PulseDocs';
export const APP_TAGLINE = 'Where team knowledge and communication stay connected.';

// Route constants for type-safe navigation
export const ROUTES = {
  HOME: '/',
  AUTH_SIGN_IN: '/auth/signin',
  AUTH_SIGN_UP: '/auth/signup',
} as const;

// Validation rules for user input, enforced on client and server
export const CHANNEL_NAME_RULES = {
  MIN: 2,
  MAX: 50,
} as const;

export const DOCUMENT_TITLE_RULES = {
  MIN: 1,
  MAX: 180,
} as const;

export const MESSAGE_LENGTH_RULES = {
  MIN: 1,
  MAX: 5000,
};
