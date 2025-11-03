import * as React from 'react'
import { Html, Head, Preview, Body, Container } from '@react-email/components'

type EmailLayoutProps = {
  previewText?: string
  children: React.ReactNode
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={styles.body}>
        <Container style={styles.container}>{children}</Container>
      </Body>
    </Html>
  )
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f7f7f8',
    margin: 0,
    padding: '24px 0',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    padding: 24,
    width: '100%',
    maxWidth: 620,
  },
}

export default EmailLayout
