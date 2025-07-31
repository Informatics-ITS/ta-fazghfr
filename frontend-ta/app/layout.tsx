import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GUI Tugas AKhir',
  description: 'Inference GUI Tugas AKhir'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
