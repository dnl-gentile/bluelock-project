import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from './client-layout';

export const metadata: Metadata = {
  title: 'Blue Lock Project',
  description: 'Projeto de Treinamento de Futebol - Blue Lock',
  themeColor: '#000000',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon-v4.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest?v=4' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
