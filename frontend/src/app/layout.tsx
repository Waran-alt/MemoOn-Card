import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MemoOn Card - Spaced Repetition Flashcards',
  description: 'Intelligent flashcard system with FSRS algorithm',
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
