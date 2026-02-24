import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';

export function FindSchool() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
        // In real app, maybe validate slug exists first via API?
        // For now, direct navigation
        navigate(`/login/${query.toLowerCase().replace(/ /g, '-')}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Encuentra tu Autoescuela</h1>
        <p className="text-slate-500">Introduce el nombre o código de tu centro para acceder.</p>
      </div>

      <div className="w-full max-w-md bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex items-center">
        <Search className="w-6 h-6 text-slate-400 ml-4" />
        <form onSubmit={handleSearch} className="flex-1">
            <input
                className="w-full p-4 outline-none text-lg bg-transparent"
                placeholder="Ej: autoescuela-madrid"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
            />
        </form>
        <button
            onClick={handleSearch}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors"
        >
            <ChevronRight />
        </button>
      </div>

      <div className="mt-8 text-sm text-slate-400">
        ¿Eres dueño de una autoescuela? <a href="/register-school" className="text-blue-600 font-bold hover:underline">Regístrala aquí</a>
      </div>
    </div>
  );
}
