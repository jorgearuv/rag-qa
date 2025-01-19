import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ChevronRight } from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

import { API_URL } from '../constants/config'
import { cn } from '../lib/utils'

interface Message {
  id: string
  type: 'question' | 'answer' | 'error'
  content: string
  sources?: Array<{
    text: string
    relevance: number
  }>
  timestamp: Date
}

interface ChatInterfaceProps {
  selectedDocument: { id: number; title: string } | null
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedDocument }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSources, setExpandedSources] = useState<{
    [key: string]: boolean
  }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFetching, setIsFetching] = useState(false)

  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return
    const container = messagesEndRef.current
    const shouldAutoScroll =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 100
    if (shouldAutoScroll) {
      container.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedDocument) {
        setMessages([])
        return
      }

      setIsFetching(true)
      try {
        const response = await axios.get(
          `${API_URL}/api/documents/${selectedDocument.id}/messages/`,
        )
        const formattedMessages = response.data.map((msg: any) => ({
          id: crypto.randomUUID(),
          type: msg.is_user ? 'question' : 'answer',
          content: msg.content,
          sources: msg.sources,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(formattedMessages)
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchMessages()
  }, [selectedDocument])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading || !selectedDocument) return

    const newMessage: Message = {
      id: crypto.randomUUID(),
      type: 'question',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/chat/`, {
        message: inputValue,
        document_id: selectedDocument.id,
      })

      const answerMessage: Message = {
        id: crypto.randomUUID(),
        type: 'answer',
        content: response.data.answer,
        sources: response.data.relevant_chunks,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, answerMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: 'error',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const renderWelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex items-center justify-center py-16"
    >
      <div className="text-center space-y-4 px-4 mt-12 md:mt-0">
        <h1 className="text-2xl font-bold text-gray-900">
          {!selectedDocument ? 'Welcome to Document Q&A!' : 'Ready to help!'}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          {!selectedDocument
            ? 'Please upload a document from the sidebar to start asking questions'
            : `Ask questions about "${selectedDocument.title}"`}
        </p>
      </div>
    </motion.div>
  )

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div
        className="flex-1 overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
        ref={messagesEndRef}
      >
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-8 space-y-6">
          {isFetching ? (
            <div className="flex justify-center py-8">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          ) : messages.length === 0 ? (
            renderWelcomeScreen()
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    'flex',
                    message.type === 'question'
                      ? 'justify-end'
                      : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 max-w-[85%] lg:max-w-[65%] shadow-sm transition-all duration-200',
                      message.type === 'question'
                        ? 'bg-blue-500 text-white hover:shadow-md'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md',
                    )}
                  >
                    <div className="whitespace-pre-wrap text-sm md:text-base">
                      {message.content}
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <motion.div
                        className="mt-3 pt-3 border-t border-gray-200/30"
                        initial={false}
                      >
                        <button
                          onClick={() =>
                            setExpandedSources(prev => ({
                              ...prev,
                              [message.id]: !prev[message.id],
                            }))
                          }
                          className="flex items-center gap-2 w-full text-left hover:bg-gray-50/10 rounded-lg p-1 transition-colors"
                          aria-expanded={expandedSources[message.id]}
                        >
                          <motion.div
                            animate={{
                              rotate: expandedSources[message.id] ? 90 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </motion.div>
                          <p className="text-sm font-medium text-gray-500">
                            {message.sources.length} relevant passages from
                            document
                          </p>
                        </button>
                        <motion.div>
                          {expandedSources[message.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-2 mt-2 overflow-hidden"
                            >
                              {message.sources.map((source, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm bg-gray-50/50 rounded-lg p-2 border border-gray-100 hover:border-gray-200 transition-colors"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-400">
                                      Passage {idx + 1}
                                    </span>
                                    <div className="h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${source.relevance * 100}%`,
                                        }}
                                        transition={{
                                          duration: 0.5,
                                          delay: idx * 0.1,
                                        }}
                                        className="h-full bg-blue-500/40"
                                      />
                                    </div>
                                  </div>
                                  <p className="text-gray-600 leading-relaxed">
                                    {source.text}
                                  </p>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Floating input */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72">
        <div className="bg-gradient-to-t from-gray-50 via-gray-50 to-transparent h-24 w-full absolute bottom-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <motion.form
            onSubmit={handleSubmit}
            className="flex items-center gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={
                selectedDocument
                  ? 'Ask a question about the document...'
                  : 'Select a document to start asking questions...'
              }
              disabled={!selectedDocument || isLoading}
              className={cn(
                'w-full px-4 py-3.5 text-base rounded-full bg-white border border-gray-200 shadow-lg',
                'hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50',
                'transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed',
                'backdrop-blur-sm bg-white/80',
              )}
              aria-label="Chat input"
            />
            <motion.button
              type="submit"
              disabled={!selectedDocument || !inputValue.trim() || isLoading}
              className={cn(
                'h-[46px] w-[46px] aspect-square rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center transition-all focus:outline-none focus:ring-2',
                'focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl active:shadow-md',
                'backdrop-blur-sm',
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Send message"
            >
              <Send className="h-5 w-5 text-white" />
            </motion.button>
          </motion.form>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
