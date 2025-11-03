'use client'

import { useState } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Form validation schema
const serviceOptions = [
  'Mediation',
  'Facilitation',
  'Training',
  'Restorative Justice',
  'Volunteer',
  'Partnership',
  'Other',
]

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().optional(),
  service: z
    .string({ required_error: 'Please select a service.' })
    .min(1, 'Please select a service.')
    .refine((v) => serviceOptions.includes(v), { message: 'Invalid service selected.' }),
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
})

type FormValues = z.infer<typeof formSchema>

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      service: '',
      subject: '',
      message: '',
    },
  })

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      toast.success('Message sent! We will get back to you as soon as possible.')
      form.reset()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(`Something went wrong. Please try again later.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mt-32 py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="max-w-full md:w-1/2 mb-8">
            <h1 className="mb-3 text-xl font-medium text-muted-foreground">Contact us</h1>
            <p className="text-4xl font-medium text-balance md:text-5xl">
              Get in touch with us today to learn more
            </p>
          </div>
          {/* Contact Form */}
          <div className="rounded-lg border bg-card p-8 max-w-full md:w-1/2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (234) 567-890" type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Which service are you inquiring about?</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="How can we help?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us more about your inquiry..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:mt-20 md:grid-cols-3 md:gap-8">
          <div className="flex flex-col justify-between gap-6 rounded-lg border p-6">
            <div>
              <h2 className="mb-4 text-xl font-medium md:text-2xl">Contact Info</h2>
              <a
                href="tel:+14435187693"
                className="text-muted-foreground hover:underline flex self-center pb-3"
              >
                <Phone className="w-5 h-5 mr-2" />
                (443) 518-7693
              </a>
              <a
                href="mailto:info@mcrchoward.org"
                className="text-muted-foreground hover:underline flex self-center pb-3"
              >
                <Mail className="w-5 h-5 mr-2" />
                info@mcrchoward.org
              </a>
              <a
                href="https://maps.app.goo.gl/9770PatuxentWoodsDriveSuite306ColumbiaMD21046"
                className="flex self-center text-muted-foreground hover:underline pb-3"
              >
                <MapPin className="w-7 h-7 mr-2" />
                9770 Patuxent Woods Drive Suite 306 Columbia, MD 21046
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-lg border p-6">
            <div>
              <h2 className="mb-4 text-xl font-medium md:text-2xl">
                Are you looking for services?
              </h2>
              <p className="text-muted-foreground">Click below to request a mediation session.</p>
            </div>
            <a href="#" className="hover:underline">
              Start your journey
            </a>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-lg border p-6">
            <div>
              <h2 className="mb-4 text-xl font-medium md:text-2xl">Are you a Partner?</h2>
              <p className="text-muted-foreground">
                For general inquiries, please reach out to us using the form below.
              </p>
            </div>
            <a href="#" className="hover:underline">
              Contact us
            </a>
          </div>
        </div>
        <div className="mt-7">
          <div className="relative flex h-full flex-col overflow-hidden rounded-t-lg md:max-h-[496px] md:rounded-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3092.8791792549832!2d-76.85494072349039!3d39.17746733012958!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b7de412dd8c007%3A0xf4138df8f907b!2s9770%20Patuxent%20Woods%20Dr%2C%20Columbia%2C%20MD%2021046!5e0!3m2!1sen!2sus!4v1747512981460!5m2!1sen!2sus"
              width="800"
              height="600"
              style={{ border: 0, width: '100%', height: '496px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
