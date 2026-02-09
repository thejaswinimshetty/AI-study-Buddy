import React, { useState, useRef } from 'react'
import { BrainCircuit, Loader2, CheckCircle2, XCircle, RefreshCcw, ArrowRight, Paperclip, X, FileText, Sparkles } from 'lucide-react'
import { generateQuiz, FileData } from '../services/aiService'
import { motion, AnimatePresence } from 'framer-motion'

interface Question {
    question: string
    options: string[]
    answer: string
}

const QuizGenerator: React.FC = () => {
    const [topic, setTopic] = useState('')
    const [difficulty, setDifficulty] = useState('medium')
    const [questionCount, setQuestionCount] = useState(5)
    const [isLoading, setIsLoading] = useState(false)
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isFinished, setIsFinished] = useState(false)
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
        setQuestions([])
        setCurrentQuestionIndex(0)
        setScore(0)
        setIsFinished(false)

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

            const data = await generateQuiz(topic || "the uploaded content", fileData, difficulty, questionCount)
            setQuestions(data.questions)
        } catch (error) {
            console.error("Failed to generate quiz", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOptionSelect = (option: string) => {
        if (selectedOption !== null) return
        setSelectedOption(option)
        if (option === questions[currentQuestionIndex].answer) {
            setScore(prev => prev + 1)
        }
    }

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            setSelectedOption(null)
        } else {
            setIsFinished(true)
        }
    }

    return (
        <div className="h-full flex flex-col items-center p-8 bg-slate-50 overflow-y-auto">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-slate-800">Knowledge Check</h2>
                    <p className="text-slate-500">Generate a quiz on any topic or from your own notes.</p>
                </div>

                {/* Generator Input */}
                {!questions.length && !isLoading && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm space-y-6 border">
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700 ml-1">What do you want to be quizzed on?</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Photosynthesis, or leave blank to use file content"
                                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-6 py-4 outline-none transition-all"
                            />
                        </div>

                        {/* Config Options */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-4 py-3 outline-none transition-all text-sm font-medium"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Number of Questions</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={questionCount}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) setQuestionCount(val);
                                        else if (e.target.value === '') setQuestionCount(0);
                                    }}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl px-4 py-3 outline-none transition-all text-sm font-medium"
                                />
                                <p className="text-[10px] text-slate-400 ml-1">Max 30 recommended</p>
                            </div>
                        </div>

                        {/* File Upload for Quiz */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Upload study material (Optional)</label>
                            {!attachedFile ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all text-sm"
                                >
                                    <Paperclip className="w-5 h-5" />
                                    <span>Attach PDF or Image for Quiz</span>
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
                                            <span className="text-xs text-slate-500">Ready for quiz generation</span>
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
                            <BrainCircuit className="w-5 h-5" />
                            Generate Quiz
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                        <p className="text-slate-500 font-medium">Analyzing content and creating your quiz...</p>
                    </div>
                )}

                {/* Quiz Interface */}
                {questions.length > 0 && !isFinished && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-3xl shadow-sm border space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-primary-600 uppercase tracking-wider">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                            <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-600 transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 leading-tight">
                            {questions[currentQuestionIndex].question}
                        </h3>

                        <div className="grid gap-3">
                            {questions[currentQuestionIndex].options.map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={selectedOption !== null}
                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${selectedOption === null
                                        ? 'border-slate-100 hover:border-primary-200 hover:bg-primary-50'
                                        : option === questions[currentQuestionIndex].answer
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : selectedOption === option
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : 'border-slate-100 opacity-50'
                                        }`}
                                >
                                    <span className="font-medium">{option}</span>
                                    {selectedOption !== null && option === questions[currentQuestionIndex].answer && (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    )}
                                    {selectedOption === option && option !== questions[currentQuestionIndex].answer && (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {selectedOption !== null && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={handleNext}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800"
                            >
                                {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {/* Results */}
                {isFinished && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-12 rounded-3xl shadow-sm border text-center space-y-6"
                    >
                        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${score >= questions.length / 2 ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            {score >= questions.length / 2 ? (
                                <Sparkles className="w-12 h-12 text-green-600" />
                            ) : (
                                <BrainCircuit className="w-12 h-12 text-red-600" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-800">Quiz Completed!</h3>
                            <p className="text-slate-500 text-lg">You scored <span className="text-primary-600 font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span></p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setQuestions([]);
                                    setAttachedFile(null);
                                }}
                                className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                Try Another Topic
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="flex-1 bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                Retake Quiz
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default QuizGenerator
