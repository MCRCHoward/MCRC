import * as React from 'react'
import { Heading, Text, Section, Hr } from '@react-email/components'
import { EmailLayout } from '@/emails/components/EmailLayout'
import { EmailFooter } from '@/emails/components/EmailFooter'

export type LoggedErrorAlertEmailProps = {
  id: string
  to: string
  name: string
  formName: string
  summary?: string
  error: string
}

export function LoggedErrorAlertEmail({
  id,
  to,
  name,
  formName,
  summary,
  error,
}: LoggedErrorAlertEmailProps) {
  return (
    <EmailLayout previewText="Form email delivery failed">
      <Section>
        <Heading as="h2" style={styles.heading}>
          ERROR IN FORM
        </Heading>
        <Text style={styles.body}>
          <strong>Please forward this email to your hired web development team or
            derrick.valentine@gmail.com.</strong>
        </Text>
        <Hr style={{ borderColor: '#e5e7eb', margin: '16px 0' }} />
        <Text style={styles.body}>
          <strong>Log ID:</strong> {id}
        </Text>
        <Text style={styles.body}>
          <strong>Intended Recipient:</strong> {to}
        </Text>
        <Text style={styles.body}>
          <strong>Submitted Name:</strong> {name}
        </Text>
        <Text style={styles.body}>
          <strong>Form Name:</strong> {formName}
        </Text>
        {summary ? (
          <Text style={styles.body}>
            <strong>Summary:</strong> {summary}
          </Text>
        ) : null}
        <Text style={styles.body}>
          <strong>Error Message:</strong> {error}
        </Text>
        <Text style={styles.note}>
          This alert indicates the participant did not receive their confirmation email and may need
          manual follow-up.
        </Text>
      </Section>
      <EmailFooter />
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, margin: 0, marginBottom: 12 },
  body: { margin: '0 0 12px', fontSize: 15, lineHeight: '24px' },
  note: { margin: '12px 0 0', fontSize: 13, lineHeight: '22px', color: '#4b5563' },
}

export default LoggedErrorAlertEmail


