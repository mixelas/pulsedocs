import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseDocs - Team Collaboration Platform',
  description: 'Where team knowledge and communication stay connected.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
