import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const formFields = [
  {
    label: 'Full name',
    name: 'fullName',
    placeholder: 'First and last name',
    type: 'text',
  },
  {
    label: 'Work email address',
    name: 'email',
    placeholder: 'me@company.com',
    type: 'email',
  },
  {
    label: 'Company name',
    name: 'company',
    placeholder: 'Company name',
    type: 'text',
    optional: true,
  },
  {
    label: 'Number of employees',
    name: 'employees',
    placeholder: 'Company name',
    type: 'text',
    optional: true,
  },
  {
    label: 'Your message',
    name: 'message',
    placeholder: 'Write your message',
    type: 'textarea',
  },
]

const VolunteerForm = () => {
  return (
    <div className="flex-1">
      <h2 className="text-lg font-semibold">Volunteer Form</h2>
      <form className="mt-5 space-y-5">
        {formFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.optional && <span className="text-muted-foreground/60"> (optional)</span>}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                name={field.name}
                placeholder={field.placeholder}
                className="min-h-[120px] resize-none"
              />
            ) : (
              <Input type={field.type} name={field.name} placeholder={field.placeholder} />
            )}
          </div>
        ))}

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Submit
          </Button>
        </div>
      </form>
    </div>
  )
}

export default VolunteerForm
