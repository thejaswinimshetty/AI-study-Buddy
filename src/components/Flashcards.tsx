import React, { useState, useRef } from 'react'
import { BookOpen, Loader2, RefreshCcw, ChevronLeft, ChevronRight, RotateCw, Paperclip, FileText, X } from 'lucide-react'
import { generateFlashcards, FileData } from '../services/aiService'
import { motion, AnimatePresence } from 'framer-motion'

interface Flashcard {
    front: string
    back: string
}

const Flashcards: React.FC = () => {
    const [topic, setTopic] = useState('')
    const [cardCount, setCardCount] = useState(5)
    const [isLoading, setIsLoading] = useState(false)
    const [cards, setCards] = useState<Flashcard[]>([])
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [attachedFile, setAttachedFile] = useState<{ file: File, preview: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setAttachedFile({
                    file,
                    preview: reader.result as string
                })
            }
            reader.readAsDataURL(file)
        }
    }

    const removeFile = () => {
        setAttachedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleGenerate = async () => {
        if (!topic.trim() && !attachedFile) return
        if (isLoading) return

        setIsLoading(true)
        setCards([])
        setCurrentCardIndex(0)
        setIsFlipped(false)

        try {
            let fileData: FileData | undefined
            if (attachedFile) {
                const base64Data = attachedFile.preview.split(',')[1]
                fileData = {
                    inlineData: {
                        data: base64Data,
                        mimeType: attachedFile.file.type
                    },
                    name: attachedFile.file.name
                }
            }

            const data = await generateFlashcards(topic || "the uploaded content", fileData, cardCount)
            setCards(data.flashcards)
        } catch (error) {
            console.error("Failed to generate flashcards", error)
        } finally {
            setIsLoading(false)
        }
    }

    const nextCard = () => {
        if (currentCardIndex < cards.length - 1) {
            setCurrentCardIndex(prev => prev + 1)
            setIsFlipped(false)
        }
    }

    const prevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1)
            setIsFlipped(false)
        }
    }

    return (
        <div className="h-full flex flex-col items-center p-8 bg-slate-50 overflow-y-auto">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-slate-800">Flashcard Deck</h2>
                    <p className="text-slate-500">Master new concepts with interactive flashcards.</p>
                </div>

                {/* Generator Input */}
                {!cards.length && !isLoading && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm space-y-6 border">
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700 ml-1">What topic do you want to learn?</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Photosynthesis, or leave blank to use file content"
                                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-6 py-4 outline-none transition-all"
                            />
                        </div>

                        {/* Config Options */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Number of Flashcards</label>
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={cardCount}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) setCardCount(val);
                                    else if (e.target.value === '') setCardCount(0);
                                }}
                                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-4 py-3 outline-none transition-all text-sm font-medium"
                            />
                            <p className="text-[10px] text-slate-400 ml-1">Max 30 recommended</p>
                        </div>

                        {/* File Upload for Flashcards */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Upload study material (Optional)</label>
                            {!attachedFile ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all text-sm"
                                >
                                    <Paperclip className="w-5 h-5" />
                                    <span>Attach PDF or Image for Flashcards</span>
                                </button>
                            ) : (
                                <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {attachedFile.file.type.startsWith('image/') ? (
                                            <img src={attachedFile.preview} alt="preview" className="w-10 h-10 rounded object-cover border" />
                                        ) : (
                                            <FileText className="w-10 h-10 text-primary-600" />
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{attachedFile.file.name}</span>
                                            <span className="text-xs text-slate-500">Ready for flashcard generation</span>
                                        </div>
                                    </div>
                                    <button onClick={removeFile} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".pdf,image/*"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!topic.trim() && !attachedFile}
                            className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
                        >
                            <BookOpen className="w-5 h-5" />
                            Generate Flashcards
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                        <p className="text-slate-500 font-medium">Creating flashcards for you...</p>
                    </div>
                )}

                {/* Flashcard Interface */}
                {cards.length > 0 && (
                    <div className="space-y-8">
                        <div className="perspective-1000 h-[350px] w-full relative group">
                            <motion.div
                                className="w-full h-full relative preserve-3d cursor-pointer"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border-2 border-primary-100 flex flex-col items-center justify-center p-12 text-center">
                                    <span className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Question</span>
                                    <p className="text-2xl font-bold text-slate-800">{cards[currentCardIndex].front}</p>
                                    <div className="absolute bottom-6 text-slate-400 flex items-center gap-2 text-sm font-medium">
                                        <RotateCw className="w-4 h-4" /> Click to flip
                                    </div>
                                </div>

                                {/* Back */}
                                <div
                                    className="absolute inset-0 backface-hidden bg-primary-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-12 text-center"
                                    style={{ transform: 'rotateY(180deg)' }}
                                >
                                    <span className="absolute top-6 left-6 text-xs font-bold text-white/60 uppercase tracking-widest">Answer</span>
                                    <p className="text-2xl font-medium text-white leading-relaxed">{cards[currentCardIndex].back}</p>
                                    <div className="absolute bottom-6 text-white/60 flex items-center gap-2 text-sm font-medium">
                                        <RotateCw className="w-4 h-4" /> Click to flip back
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex items-center justify-between px-4">
                            <button
                                onClick={prevCard}
                                disabled={currentCardIndex === 0}
                                className="p-3 bg-white rounded-2xl border shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-500">
                                    Card <span className="text-primary-600">{currentCardIndex + 1}</span> of {cards.length}
                                </p>
                            </div>

                            <button
                                onClick={nextCard}
                                disabled={currentCardIndex === cards.length - 1}
                                className="p-3 bg-white rounded-2xl border shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>

                        <button
                            onClick={() => setCards([])}
                            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-medium py-2 transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" /> Clear and start new topic
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
        </div>
    )
}

export default Flashcards
