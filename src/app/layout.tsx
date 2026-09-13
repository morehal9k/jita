import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Task Dashboard',
  description: 'Unified overview of your Jira and GitHub active tasks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-50 dark:bg-neutral-950">
        {children}
      </body>
    </html>
  );
}
