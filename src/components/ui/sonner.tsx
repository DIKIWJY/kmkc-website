'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

/** Notifikasi. Tema diteruskan dari shell admin (terang/gelap), bukan dari provider terpisah. */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className='toaster group [&_div[data-content]]:w-full'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
