'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BriefSummary {
  project_name: string
  deliverables: string[]
  timeline: string | null
  budget: string | null
  key_requirements: string[]
  suggested_tasks: string[]
}

interface BriefSummarizerProps {
  onSummaryComplete?: (summary: BriefSummary) => void
  onProjectNameChange?: (name: string) => void
  onTasksSelected?: (tasks: string[]) => void
}

export function BriefSummarizer({
  onSummaryComplete,
  onProjectNameChange,
  onTasksSelected,
}: BriefSummarizerProps) {
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<BriefSummary | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const summarizeBrief = async () => {
    if (!rawText.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/ai/brief-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw_text: rawText }),
      })

      if (!response.ok) {
        throw new Error('Failed to summarize brief')
      }

      const data = await response.json()
      setSummary(data)

      // Auto-fill project name
      if (data.project_name && onProjectNameChange) {
        onProjectNameChange(data.project_name)
      }

      // Select all suggested tasks by default
      if (data.suggested_tasks && onTasksSelected) {
        setSelectedTasks(new Set(data.suggested_tasks))
        onTasksSelected(data.suggested_tasks)
      }

      if (onSummaryComplete) {
        onSummaryComplete(data)
      }
    } catch (error) {
      console.error('Failed to summarize brief:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = (task: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(task)) {
      newSelected.delete(task)
    } else {
      newSelected.add(task)
    }
    setSelectedTasks(newSelected)

    if (onTasksSelected) {
      onTasksSelected(Array.from(newSelected))
    }
  }

  const selectAllTasks = () => {
    if (summary) {
      setSelectedTasks(new Set(summary.suggested_tasks))
      if (onTasksSelected) {
        onTasksSelected(summary.suggested_tasks)
      }
    }
  }

  const deselectAllTasks = () => {
    setSelectedTasks(new Set())
    if (onTasksSelected) {
      onTasksSelected([])
    }
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          AI Brief Summarizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Paste client email or brief
              </label>
              <Textarea
                placeholder="Paste the client's email, project brief, or requirements here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            <Button
              onClick={summarizeBrief}
              disabled={loading || !rawText.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Summarize Brief
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Project Name */}
            <div className="p-4 bg-surface2 rounded-lg">
              <label className="text-sm font-medium mb-2 block">
                Suggested Project Name
              </label>
              <p className="text-lg font-semibold">{summary.project_name}</p>
            </div>

            {/* Deliverables */}
            {summary.deliverables.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Deliverables
                </label>
                <div className="flex flex-wrap gap-2">
                  {summary.deliverables.map((deliverable, index) => (
                    <Badge key={index} variant="secondary">
                      {deliverable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline & Budget */}
            <div className="grid grid-cols-2 gap-4">
              {summary.timeline && (
                <div className="p-4 bg-surface2 rounded-lg">
                  <label className="text-sm font-medium mb-2 block">
                    Timeline
                  </label>
                  <p className="text-sm">{summary.timeline}</p>
                </div>
              )}
              {summary.budget && (
                <div className="p-4 bg-surface2 rounded-lg">
                  <label className="text-sm font-medium mb-2 block">
                    Budget
                  </label>
                  <p className="text-sm">{summary.budget}</p>
                </div>
              )}
            </div>

            {/* Key Requirements */}
            {summary.key_requirements.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Key Requirements
                </label>
                <ul className="space-y-2">
                  {summary.key_requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Tasks */}
            {summary.suggested_tasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Suggested Tasks
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllTasks}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllTasks}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {summary.suggested_tasks.map((task, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                        selectedTasks.has(task)
                          ? 'border-accent bg-accent/5'
                          : 'border-border bg-surface2'
                      )}
                    >
                      <Checkbox
                        id={`task-${index}`}
                        checked={selectedTasks.has(task)}
                        onCheckedChange={() => toggleTask(task)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`task-${index}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {task}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={() => {
                setSummary(null)
                setRawText('')
                setSelectedTasks(new Set())
              }}
              className="w-full"
            >
              Start Over
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
