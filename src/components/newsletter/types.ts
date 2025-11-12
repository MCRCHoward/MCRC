/**
 * Type definitions for newsletter subscription functionality
 */

export interface NewsletterFormData {
  email: string
  firstName?: string
}

export interface NewsletterFormProps {
  /**
   * Whether to show the first name field
   * @default false
   */
  showNames?: boolean

  /**
   * Visual variant of the form
   * @default 'default'
   */
  variant?: 'default' | 'compact'

  /**
   * Custom className for the form container
   */
  className?: string

  /**
   * Custom placeholder text for email field
   */
  emailPlaceholder?: string

  /**
   * Custom placeholder text for first name field
   */
  firstNamePlaceholder?: string

  /**
   * Custom button text
   * @default 'Subscribe'
   */
  buttonText?: string
}

export interface NewsletterAPIResponse {
  success: boolean
  message?: string
  error?: string
}

