import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'IPTV Brasil',
    template: '%s | IPTV Brasil'
  },
  description: 'Player IPTV profissional para canais brasileiros. Carregamento rápido, qualidade excelente e design intuitivo.',
  keywords: ['IPTV', 'Brasil', 'TV', 'Streaming', 'Canais', 'Xtream', 'HLS'],
  authors: [{ name: 'IPTV Brasil' }],
  creator: 'IPTV Brasil',
  publisher: 'IPTV Brasil',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://iplinks.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://iplinks.vercel.app',
    siteName: 'IPTV Brasil',
    title: 'IPTV Brasil - Player de Canais Brasileiros',
    description: 'Player IPTV profissional para canais brasileiros. Carregamento rápido, qualidade excelente e design intuitivo.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPTV Brasil',
    description: 'Player IPTV profissional para canais brasileiros.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1e' },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
