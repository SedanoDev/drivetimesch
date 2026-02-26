import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LogOut, Car } from 'lucide-react';

interface SidebarProps {
    title: string;
    links: { to: string; icon: React.ReactNode; label: string }[];
    logout: () => void;
    colorClass?: string; // e.g., 'text-purple-600'
}

export function SidebarLayout({ title, links, logout, colorClass = 'text-blue-600' }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <Car className={`w-6 h-6 ${colorClass}`} />
                    <span className="font-bold text-lg text-slate-800">{title}</span>
                </div>
                <button onClick={() => setIsOpen(true)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Car className={`w-8 h-8 ${colorClass}`} />
                        <span className="font-bold text-xl text-slate-800">{title}</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {links.map(link => (
                        <NavItem
                            key={link.to}
                            to={link.to}
                            icon={link.icon}
                            label={link.label}
                            onClick={() => setIsOpen(false)}
                            activeColor={colorClass}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium text-sm"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

function NavItem({ to, icon, label, onClick, activeColor }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void, activeColor: string }) {
    // Map colors to bg variants safely
    const colorMap: Record<string, string> = {
        'text-purple-600': 'bg-purple-600 shadow-purple-200',
        'text-blue-600': 'bg-blue-600 shadow-blue-200',
        'text-green-600': 'bg-green-600 shadow-green-200',
    };

    const activeClasses = colorMap[activeColor] || 'bg-slate-800 shadow-slate-200';

    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => `
                relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm overflow-hidden group
                ${isActive
                    ? `${activeClasses} text-white shadow-md`
                    : `text-slate-600 hover:bg-slate-50 hover:${activeColor}`
                }
            `}
        >
            <span className="relative z-10 flex items-center gap-3">
                {icon}
                <span>{label}</span>
            </span>
        </NavLink>
    );
}
