'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Search } from 'lucide-react'

import type { Task, TaskPriority } from '@/types/task'
import { markTaskComplete, updateTaskPriority } from '@/lib/actions/task-actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const priorityOptions: TaskPriority[] = ['low', 'medium', 'high']

export function TasksTable({ tasks, userId }: { tasks: Task[]; userId: string }) {
  const [taskList, setTaskList] = useState<Task[]>(tasks)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    setTaskList(tasks)
  }, [tasks])

  const hasTasks = taskList.length > 0

  const serviceAreaOptions = useMemo(() => {
    const values = Array.from(new Set(taskList.map((task) => task.serviceArea)))
    return values.sort()
  }, [taskList])

  const typeOptions = useMemo(() => {
    const values = Array.from(new Set(taskList.map((task) => task.type)))
    return values.sort()
  }, [taskList])

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase()

    return taskList.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.link && task.link.toLowerCase().includes(query))
      const matchesService = serviceFilter === 'all' || task.serviceArea === serviceFilter
      const matchesType = typeFilter === 'all' || task.type === typeFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      return matchesSearch && matchesService && matchesType && matchesPriority
    })
  }, [taskList, search, serviceFilter, typeFilter, priorityFilter])

  const handlePriorityChange = (taskId: string, priority: TaskPriority) => {
    startTransition(async () => {
      try {
        setTaskList((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, priority } : task)),
        )
        await updateTaskPriority(userId, taskId, priority)
        toast.success('Priority updated')
      } catch (error) {
        toast.error('Failed to update priority')
        console.error('[TasksTable] updatePriority error', error)
      }
    })
  }

  const handleMarkComplete = (taskId: string) => {
    startTransition(async () => {
      try {
        setTaskList((prev) => prev.filter((task) => task.id !== taskId))
        await markTaskComplete(userId, taskId)
        toast.success('Task completed')
      } catch (error) {
        toast.error('Failed to mark task complete')
        console.error('[TasksTable] markComplete error', error)
      }
    })
  }

  const typeLabels: Record<string, string> = useMemo(
    () => ({
      'new-inquiry': 'New inquiry',
      'intake-call': 'Intake call',
      'follow-up': 'Follow-up',
      'review-evals': 'Review evaluations',
    }),
    [],
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center rounded-md border bg-background px-3">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks"
              className="border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </div>
        </div>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Service area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All service areas</SelectItem>
            {serviceAreaOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option.replace(/([A-Z])/g, ' $1')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Task type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {typeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {typeLabels[option] ?? option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {priorityOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!hasTasks ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          You’re all caught up. New tasks will appear here automatically.
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No tasks match your filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Service Area</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="max-w-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{task.title}</span>
                    <Link
                      href={task.link}
                      className="text-sm text-primary underline-offset-2 hover:underline"
                    >
                      View inquiry
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {task.serviceArea.replace(/([A-Z])/g, ' $1')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{typeLabels[task.type] ?? task.type}</Badge>
                </TableCell>
                <TableCell>{formatDate(task.due)}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={task.priority}
                    onValueChange={(value) => handlePriorityChange(task.id, value as TaskPriority)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-28 capitalize">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option} value={option} className="capitalize">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleMarkComplete(task.id)}
                    disabled={isPending}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Done
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

