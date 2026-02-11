
import React, { useState, useEffect } from 'react';
import { Settings, Save, School, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import supabase from '../supabase';

interface Props {
  onUpdate: () => void;
}

const AppSettings: React.FC<Props> = ({ onUpdate }) => {
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('school_settings').select('*').single();
      if (data) {
        setSchoolName(data.school_name);
      }
      setInitialLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      Swal.fire('Error', 'Nama sekolah tidak boleh kosong', 'error');
      return;
    }

    setLoading(true);
    try {
      // Upsert logic for school_settings (id: 1)
      const { error } = await supabase
        .from('school_settings')
        .upsert({ id: '1', school_name: schoolName });

      if (error) throw error;
      
      Swal.fire('Berhasil', 'Pengaturan telah disimpan.', 'success');
      onUpdate();
    } catch (err: any) {
      Swal.fire('Gagal', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-10 text-center text-slate-400">Memuat konfigurasi...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in duration-300">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-slate-500">Sesuaikan identitas sekolah Anda.</p>
      </header>

      <form onSubmit={handleSave} className="bg-white p-10 rounded-[48px] shadow-xl shadow-sky-50/50 border border-slate-50 space-y-8">
        <div className="flex items-center gap-4 p-6 bg-sky-50 rounded-3xl text-sky-700">
          <AlertCircle className="shrink-0" />
          <p className="text-sm font-medium">Nama sekolah akan otomatis digunakan pada judul aplikasi, kop surat, dan laporan PDF.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700 ml-2">Nama Taman Kanak-Kanak / Sekolah</label>
          <div className="relative">
            <School className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input 
              type="text"
              placeholder="Masukkan Nama TK..."
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none transition-all font-bold text-xl text-slate-800 placeholder:text-slate-300"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white py-5 rounded-3xl shadow-lg shadow-sky-200 transition-all font-bold text-lg active:scale-95"
        >
          {loading ? 'Menyimpan...' : (
            <>
              <Save size={24} />
              Simpan Perubahan
            </>
          )}
        </button>
      </form>

      <div className="p-10 border-2 border-dashed border-slate-200 rounded-[48px] flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
          <Settings size={32} />
        </div>
        <div>
          <h4 className="font-bold text-slate-700">Informasi Sistem</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">Data disimpan secara aman di cloud database Supabase dengan enkripsi tingkat lanjut.</p>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;
