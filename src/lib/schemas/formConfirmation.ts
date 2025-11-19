import { z } from 'zod'

export const formConfirmationSchema = z.object({
  to: z.string().email(),
  name: z.string().min(1),
  formName: z.string().min(1),
  summary: z.string().optional(),
})

export type FormConfirmationSchema = z.infer<typeof formConfirmationSchema>


