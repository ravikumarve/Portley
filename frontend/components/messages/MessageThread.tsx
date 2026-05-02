'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  is_mine: boolean
  created_at: string
}

interface MessageThreadProps {
  projectId: string
}

export function MessageThread({ projectId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMessages()
    setupRealtimeSubscription()
    getCurrentUser()
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Mark messages as read
      if (currentUserId) {
        await markMessagesAsRead(data || [])
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`project:${projectId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          const newMessage = payload.new as Message
          
          // Get sender info
          const { data: { user } } = await supabase.auth.getUser()
          const isMine = newMessage.sender_id === user?.id

          setMessages(prev => [...prev, { ...newMessage, is_mine: isMine }])

          // Mark as read if it's my message
          if (isMine && currentUserId) {
            await supabase
              .from('messages')
              .update({ read_by: [currentUserId] })
              .eq('id', newMessage.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const markMessagesAsRead = async (messages: Message[]) => {
    if (!currentUserId) return

    const unreadMessages = messages.filter(
      msg => msg.sender_id !== currentUserId && !msg.read_by?.includes(currentUserId)
    )

    for (const message of unreadMessages) {
      await supabase
        .from('messages')
        .update({
          read_by: [...(message.read_by || []), currentUserId]
        })
        .eq('id', message.id)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('messages')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          content: newMessage.trim(),
          read_by: [user.id],
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDate = (date: string) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <Card className="border-border bg-surface">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <p className="text-text-2 mb-2">No messages yet</p>
                <p className="text-sm text-text-3">
                  Start the conversation with your client
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(messages[index - 1].created_at) !== formatDate(message.created_at)

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-text-3 bg-surface px-3 py-1 rounded-full">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'flex gap-3',
                      message.is_mine ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {!message.is_mine && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={cn(
                        'max-w-[70%]',
                        message.is_mine && 'flex flex-col items-end'
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-lg px-4 py-2',
                          message.is_mine
                            ? 'bg-accent text-white'
                            : 'bg-surface2 text-text'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {!message.is_mine && (
                          <span className="text-xs text-text-3">
                            {message.sender_name}
                          </span>
                        )}
                        <span className="text-xs text-text-3">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>

                    {message.is_mine && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-accent text-white">
                          {getInitials(message.sender_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input
          placeholder="Type a message... (press Enter to send)"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" disabled={sending || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
