import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-fraunces',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Plainly — Politics Explained Plainly',
  description:
    'See what is on your ballot, get plain-language explanations of every race and measure, and get ready to vote.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} font-body`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
