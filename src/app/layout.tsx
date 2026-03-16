import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Focus — Pomodoro Timer',
  description: 'Minimal Pomodoro timer with task tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            try {
              var t = localStorage.getItem('focus-theme') || 'dark'
              document.documentElement.classList.toggle('dark', t === 'dark')
            } catch(e){}
          })()
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
