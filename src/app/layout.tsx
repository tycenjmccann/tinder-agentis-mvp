export const metadata = {
  title: 'Agentis MVP',
  description: 'Multi-agent workflow management dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
