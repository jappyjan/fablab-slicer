import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3D Print Workflow',
  description: 'Upload and process 3D print files',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}