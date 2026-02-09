import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, FileText, ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { sendMessage, ChatMessage, FileData } from '../services/aiService'
import { motion, AnimatePresence } from 'framer-motion'

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Hi! I'm your AI Study Buddy. Upload your syllabus, notes, or just ask me a question to get started!" }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [attachedFiles, setAttachedFiles] = useState<{ file: File, preview: string }[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        for (const file of files) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setAttachedFiles(prev => [...prev, {
                    file,
                    preview: reader.result as string
                }])
            }
            reader.readAsDataURL(file)
        }
    }

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const formatFileData = async (): Promise<FileData[]> => {
        return Promise.all(attachedFiles.map(async ({ file }) => {
            return new Promise<FileData>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const base64Data = (reader.result as string).split(',')[1]
                    resolve({
                        inlineData: {
                            data: base64Data,
                            mimeType: file.type
                        },
                        name: file.name
                    })
                }
                reader.readAsDataURL(file)
            })
        }))
    }

    const handleSend = async () => {
        if ((!input.trim() && attachedFiles.length === 0) || isLoading) return

        const userMessage = input
        const currentFiles = [...attachedFiles]

        // Add user message to UI
        const newUserMsg: ChatMessage = { role: 'user', content: userMessage }
        setMessages(prev => [...prev, newUserMsg])
        setInput('')
        setAttachedFiles([])
        setIsLoading(true)

        try {
            const fileData = await formatFileData()
            const response = await sendMessage(messages, userMessage, fileData)
            setMessages(prev => [...prev, { role: 'model', content: response }])
        } catch (error: any) {
            setMessages(prev => [...prev, {
                role: 'model',
                content: `Error: ${error.message || "Failed to get response from AI."}`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-slate-800'
                            }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                            <span className="text-sm text-slate-500 font-medium">Study Buddy is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-8 bg-white border-t">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* File Previews */}
                    <AnimatePresence>
                        {attachedFiles.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex flex-wrap gap-2"
                            >
                                {attachedFiles.map((fileObj, i) => (
                                    <div key={i} className="relative group bg-slate-100 rounded-lg p-2 flex items-center gap-2 border">
                                        {fileObj.file.type.startsWith('image/') ? (
                                            <img src={fileObj.preview} alt="preview" className="w-8 h-8 rounded object-cover" />
                                        ) : (
                                            <FileText className="w-8 h-8 text-primary-600" />
                                        )}
                                        <span className="text-xs font-medium text-slate-600 max-w-[100px] truncate">
                                            {fileObj.file.name}
                                        </span>
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Text Input */}
                    <div className="relative flex items-center gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                            title="Upload PDF or Image"
                        >
                            <Paperclip className="w-6 h-6" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            multiple
                            accept=".pdf,image/*"
                        />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask anything about your studies..."
                            className="flex-1 bg-slate-100 border-none focus:ring-2 focus:ring-primary-500 rounded-2xl px-6 py-4 text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                            className="bg-primary-600 text-white p-4 rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatInterface
