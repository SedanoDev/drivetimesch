import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, School, Loader2 } from 'lucide-react';

// Use env var or default
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface TenantResult {
    id: string;
    name: string;
    slug: string;
}

export function FindSchool() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TenantResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public/search_tenants.php?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults([]);
      }
      setHasSearched(true);
    } catch (err) {
      console.error("Search error", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
          performSearch(query);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="text-center mb-12 relative w-full max-w-lg">
        <Link to="/" className="absolute -top-16 left-0 flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors text-sm font-bold">
            ← Volver
        </Link>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Encuentra tu Autoescuela</h1>
        <p className="text-slate-500 text-lg leading-relaxed">Introduce el nombre de tu centro para acceder a tu panel de alumno o profesor.</p>
      </div>

      <div className="w-full max-w-lg relative">
        <div className={`bg-white p-2 rounded-2xl shadow-xl border transition-all flex items-center z-20 relative ${hasSearched && results.length > 0 ? 'rounded-b-none border-blue-200 shadow-blue-100/50' : 'border-slate-100'}`}>
            <Search className={`w-6 h-6 ml-4 transition-colors ${loading ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
            <form onSubmit={handleManualSubmit} className="flex-1">
                <input
                    className="w-full p-4 pl-3 outline-none text-lg bg-transparent text-slate-800 placeholder:text-slate-300"
                    placeholder="Ej: Autoescuela Veloz"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                />
            </form>
            {loading ? (
                <div className="p-3 text-blue-500">
                    <Loader2 className="animate-spin" />
                </div>
            ) : (
                <button
                    onClick={() => performSearch(query)}
                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-200"
                >
                    <ChevronRight />
                </button>
            )}
        </div>

        {/* Results Dropdown */}
        {(hasSearched || (query.length >= 2 && results.length > 0)) && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-b-2xl shadow-xl border border-t-0 border-blue-100 overflow-hidden z-10 animate-in fade-in slide-in-from-top-2">
                {results.length > 0 ? (
                    <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                        {results.map((tenant) => (
                            <div
                                key={tenant.id}
                                onClick={() => navigate(`/login/${tenant.slug}`)}
                                className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group cursor-pointer"
                            >
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <School size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors text-lg truncate">{tenant.name}</div>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">drivetime.com/login/<span className="text-slate-500 font-bold">{tenant.slug}</span></div>
                                </div>
                                <ChevronRight className="ml-auto text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-4 text-slate-300">
                             <Search size={32} />
                        </div>
                        <p className="mb-2 text-base font-bold text-slate-600">No encontramos resultados</p>
                        <p className="text-sm">Prueba con otro nombre o revisa la ortografía.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="mt-16 text-sm text-slate-400 flex flex-col items-center gap-2">
        <span className="w-12 h-px bg-slate-200"></span>
        <p>
            ¿Eres dueño de una autoescuela? <Link to="/register-school" className="text-blue-600 font-bold hover:underline">Regístrala aquí</Link>
        </p>
      </div>
    </div>
  );
}
