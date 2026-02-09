import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatInterface from './components/ChatInterface'
import QuizGenerator from './components/QuizGenerator'
import Flashcards from './components/Flashcards'
import { GraduationCap } from 'lucide-react'

type View = 'chat' | 'quiz' | 'flashcards'

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('chat')

    return (
        <div className="flex h-screen bg-background text-slate-900">
            <Sidebar currentView={currentView} onViewChange={setCurrentView} />

            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b bg-white flex items-center justify-between px-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-primary-600" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                            AI Study Buddy
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                            Syllabus Assistant
                        </span>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto relative">
                    {currentView === 'chat' && <ChatInterface />}
                    {currentView === 'quiz' && <QuizGenerator />}
                    {currentView === 'flashcards' && <Flashcards />}
                </div>
            </main>
        </div>
    )
}

export default App
