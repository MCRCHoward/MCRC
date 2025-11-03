import * as React from 'react'
import { Hr, Text, Link, Section } from '@react-email/components'

type EmailFooterProps = {
  supportEmail?: string
  websiteUrl?: string
}

export function EmailFooter({ supportEmail = 'info@mcrchoward.org', websiteUrl = 'https://mcrchoward.org' }: EmailFooterProps) {
  return (
    <Section>
      <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
      <Text style={styles.muted}>This message was sent by MCRC.</Text>
      <Text style={styles.muted}>For questions, contact <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>.</Text>
      <Text style={styles.muted}>Visit <Link href={websiteUrl}>{websiteUrl}</Link></Text>
    </Section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  muted: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: '18px',
    margin: 0,
  },
}

export default EmailFooter


