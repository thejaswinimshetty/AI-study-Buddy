import React from 'react'
import { MessageSquare, BookOpen, BrainCircuit, Settings, LogOut } from 'lucide-react'

type View = 'chat' | 'quiz' | 'flashcards'

interface SidebarProps {
    currentView: View
    onViewChange: (view: View) => void
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
    const navItems = [
        { id: 'chat', label: 'Chat Assistant', icon: MessageSquare },
        { id: 'quiz', label: 'Quiz Center', icon: BrainCircuit },
        { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
    ]

    return (
        <aside className="w-64 bg-white border-r flex flex-col">
            <div className="flex-1 py-8 px-4 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id as View)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentView === item.id
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500'
                            }`} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 border-t space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
                    <Settings className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
