import * as React from 'react'
import { Heading, Text, Section, Hr } from '@react-email/components'
import { EmailLayout } from '@/emails/components/EmailLayout'
import { EmailFooter } from '@/emails/components/EmailFooter'

export type ContactEmailProps = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  service: string
  subject: string
  message: string
}

export function ContactEmail(props: ContactEmailProps) {
  const { id, firstName, lastName, email, phone, service, subject, message } = props
  const fullName = `${firstName} ${lastName}`.trim()

  return (
    <EmailLayout previewText={`New contact: ${service} – ${subject}`}>
      <Section>
        <Heading as="h2" style={styles.heading}>
          New Contact Submission
        </Heading>
        <Text style={styles.kv}><strong>ID:</strong> {id}</Text>
        <Text style={styles.kv}><strong>Name:</strong> {fullName}</Text>
        <Text style={styles.kv}><strong>Email:</strong> {email}</Text>
        <Text style={styles.kv}><strong>Phone:</strong> {phone || '—'}</Text>
        <Text style={styles.kv}><strong>Service:</strong> {service}</Text>
        <Text style={styles.kv}><strong>Subject:</strong> {subject}</Text>
        <Hr style={{ borderColor: '#e5e7eb', margin: '16px 0' }} />
        <Text style={styles.label}>Message</Text>
        <Text style={styles.message}>{message}</Text>
      </Section>
      <EmailFooter />
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 20, margin: 0, marginBottom: 12 },
  kv: { margin: 0, marginBottom: 6, fontSize: 14, lineHeight: '22px' },
  label: { margin: 0, marginBottom: 6, fontSize: 12, color: '#6b7280' },
  message: { whiteSpace: 'pre-wrap', margin: 0, fontSize: 14, lineHeight: '22px' },
}

export default ContactEmail


