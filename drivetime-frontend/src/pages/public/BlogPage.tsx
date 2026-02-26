import { Car, Tag, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BlogPage() {
  const posts = [
    {
      title: 'Cómo digitalizar tu autoescuela en 2026',
      excerpt: 'Guía paso a paso para pasar del papel a la nube sin perder clientes.',
      date: '12 Ene 2026',
      tag: 'Tutoriales'
    },
    {
      title: 'Consejos para instructores de manejo',
      excerpt: 'Mejora la retención de alumnos y optimiza tus horas de clase.',
      date: '08 Ene 2026',
      tag: 'Educación'
    },
    {
      title: 'Actualización normativa DGT',
      excerpt: 'Lo que necesitas saber sobre los nuevos exámenes prácticos.',
      date: '03 Ene 2026',
      tag: 'Legal'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Car className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl tracking-tight">DriveTime Blog</span>
          </Link>
          <div className="flex gap-4">
             <Link to="/" className="text-slate-500 font-medium hover:text-blue-600">Volver</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Noticias y Actualizaciones</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Aprende sobre gestión de autoescuelas, seguridad vial y tecnología.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <article key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer">
              <div className="h-48 bg-slate-200 w-full animate-pulse-slow object-cover" style={{backgroundImage: `url(https://source.unsplash.com/random/800x600?car,road&sig=${i})`, backgroundSize: 'cover'}}></div>
              <div className="p-8">
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded"><Tag size={12} /> {post.tag}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {post.date}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-3 hover:text-blue-600 transition-colors">{post.title}</h2>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center text-blue-600 font-bold text-sm hover:underline group">
                  Leer más <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>&copy; {new Date().getFullYear()} DriveTime SaaS.</p>
      </footer>
    </div>
  );
}
