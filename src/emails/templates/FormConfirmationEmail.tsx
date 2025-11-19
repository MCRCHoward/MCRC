import * as React from 'react'
import { Heading, Text, Section, Hr } from '@react-email/components'
import { EmailLayout } from '@/emails/components/EmailLayout'
import { EmailFooter } from '@/emails/components/EmailFooter'

export type FormConfirmationEmailProps = {
  name: string
  formName: string
  summary?: string
}

export function FormConfirmationEmail({ name, formName, summary }: FormConfirmationEmailProps) {
  return (
    <EmailLayout previewText={`We received your ${formName}`}>
      <Section>
        <Heading as="h2" style={styles.heading}>
          Thank you, {name || 'there'}!
        </Heading>
        <Text style={styles.body}>
          This is a quick note to confirm that we received your {formName}. Our team is already
          reviewing the information you shared.
        </Text>
        {summary ? (
          <Text style={styles.body}>{summary}</Text>
        ) : (
          <Text style={styles.body}>
            We will follow up as soon as possible—typically within two business days. If something is
            urgent, please reply to this email or give us a call.
          </Text>
        )}
        <Hr style={{ borderColor: '#e5e7eb', margin: '16px 0' }} />
        <Text style={styles.subtle}>
          While you wait, feel free to gather any notes or information you might want to share with
          our intake team. We look forward to connecting with you soon.
        </Text>
      </Section>
      <EmailFooter />
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, margin: 0, marginBottom: 12 },
  body: { margin: '0 0 12px', fontSize: 15, lineHeight: '24px' },
  subtle: { margin: 0, fontSize: 13, lineHeight: '22px', color: '#4b5563' },
}

export default FormConfirmationEmail


