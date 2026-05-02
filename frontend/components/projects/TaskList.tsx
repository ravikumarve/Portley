'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  completed: boolean
  position: number
  created_at: string
}

interface TaskListProps {
  projectId: string
}

export function TaskList({ projectId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setAddingTask(true)
    try {
      const newPosition = tasks.length

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: newTaskTitle.trim(),
          position: newPosition,
        })
        .select()
        .single()

      if (error) throw error

      setTasks([...tasks, data])
      setNewTaskTitle('')
    } catch (error) {
      console.error('Failed to add task:', error)
    } finally {
      setAddingTask(false)
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, completed } : task
      ))
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.filter(task => task.id !== taskId))
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const completedCount = tasks.filter(t => t.completed).length
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card className="border-border bg-surface">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {completedCount}/{tasks.length} tasks complete
            </span>
            <span className="text-sm text-text-2">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Add Task Input */}
      <form onSubmit={addTask} className="flex gap-2">
        <Input
          placeholder="Add a new task... (press Enter)"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          disabled={addingTask}
          className="flex-1"
        />
        <Button type="submit" disabled={addingTask || !newTaskTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Task List */}
      {tasks.length === 0 ? (
        <Card className="border-border bg-surface">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-text-2 mb-2">No tasks yet</p>
              <p className="text-sm text-text-3">
                Add your first task to get started
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                'border-border bg-surface transition-all',
                task.completed && 'opacity-60'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-text-3 mt-0.5 flex-shrink-0" />
                  
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm',
                        task.completed && 'line-through text-text-3'
                      )}
                    >
                      {task.title}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="h-8 w-8 flex-shrink-0 text-text-3 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
