import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Settings, Save, Mail, Phone, MapPin, DollarSign, Clock, AlertTriangle, Palette } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/drivetime-backend/api';

export function TenantSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState({
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      primary_color: '#2563EB',
      secondary_color: '#1E40AF',
      class_price: 30,
      class_duration_minutes: 60,
      min_booking_notice_hours: 24,
      min_cancellation_notice_hours: 24,
      min_practice_hours_required: 20,
      welcome_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
        fetch(`${API_URL}/tenant_settings.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.name) setSettings(data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setMessage('');

      try {
          const res = await fetch(`${API_URL}/tenant_settings.php`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(settings)
          });

          if (res.ok) {
              setMessage('Configuración guardada.');
          } else {
              setMessage('Error al guardar.');
          }
      } catch (err) {
          setMessage('Error de conexión.');
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Configuración de la Escuela</h1>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
            >
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </div>

        {message && (
            <div className={`p-4 rounded-xl text-sm font-bold ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
            </div>
        )}

        <form className="grid lg:grid-cols-2 gap-6">
            {/* General Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Settings size={20} className="text-slate-400" /> Información General
                </h3>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                    <input className="w-full p-2 rounded border" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">URL (Slug)</label>
                    <input disabled className="w-full p-2 rounded border bg-slate-50 text-slate-500" value={settings.slug} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mensaje de Bienvenida</label>
                    <textarea rows={3} className="w-full p-2 rounded border" value={settings.welcome_message} onChange={e => setSettings({...settings, welcome_message: e.target.value})} />
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Phone size={20} className="text-slate-400" /> Contacto
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                            <input className="w-full pl-9 p-2 rounded border" value={settings.contact_email} onChange={e => setSettings({...settings, contact_email: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                        <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                            <input className="w-full pl-9 p-2 rounded border" value={settings.contact_phone} onChange={e => setSettings({...settings, contact_phone: e.target.value})} />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Dirección</label>
                    <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                        <input className="w-full pl-9 p-2 rounded border" value={settings.contact_address} onChange={e => setSettings({...settings, contact_address: e.target.value})} />
                    </div>
                </div>
            </div>

            {/* Business Rules */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Clock size={20} className="text-slate-400" /> Reglas y Precios
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Precio Clase (€)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                            <input type="number" className="w-full pl-9 p-2 rounded border" value={settings.class_price} onChange={e => setSettings({...settings, class_price: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Duración (min)</label>
                        <div className="relative">
                            <Clock className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                            <input type="number" className="w-full pl-9 p-2 rounded border" value={settings.class_duration_minutes} onChange={e => setSettings({...settings, class_duration_minutes: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Aviso Reserva (h)</label>
                        <input type="number" className="w-full p-2 rounded border" value={settings.min_booking_notice_hours} onChange={e => setSettings({...settings, min_booking_notice_hours: parseInt(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Aviso Cancelación (h)</label>
                        <div className="relative">
                            <AlertTriangle className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                            <input type="number" className="w-full pl-9 p-2 rounded border" value={settings.min_cancellation_notice_hours} onChange={e => setSettings({...settings, min_cancellation_notice_hours: parseInt(e.target.value)})} />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Min. Horas Práctica</label>
                    <input type="number" className="w-full p-2 rounded border" value={settings.min_practice_hours_required} onChange={e => setSettings({...settings, min_practice_hours_required: parseInt(e.target.value)})} />
                </div>
            </div>

            {/* Branding */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Palette size={20} className="text-slate-400" /> Apariencia
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Color Principal</label>
                        <div className="flex gap-2">
                            <input type="color" className="h-10 w-10 rounded cursor-pointer" value={settings.primary_color} onChange={e => setSettings({...settings, primary_color: e.target.value})} />
                            <input className="w-full p-2 rounded border uppercase" value={settings.primary_color} onChange={e => setSettings({...settings, primary_color: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Color Secundario</label>
                        <div className="flex gap-2">
                            <input type="color" className="h-10 w-10 rounded cursor-pointer" value={settings.secondary_color} onChange={e => setSettings({...settings, secondary_color: e.target.value})} />
                            <input className="w-full p-2 rounded border uppercase" value={settings.secondary_color} onChange={e => setSettings({...settings, secondary_color: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}
