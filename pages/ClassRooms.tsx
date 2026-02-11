
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, User, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import supabase from '../supabase';
import { ClassRoom } from '../types';

const ClassRooms: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });
      if (data) setClasses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleAddClass = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Kelas Baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama Kelas (Contoh: TK A1)">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Nama Guru Wali">' +
        '<input id="swal-input3" class="swal2-input" placeholder="NIP Guru">' +
        '<input id="swal-input4" class="swal2-input" placeholder="Nama Kepala Sekolah">' +
        '<input id="swal-input5" class="swal2-input" placeholder="NIP Kepala Sekolah">',
      focusConfirm: false,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#0EA5E9',
      showCancelButton: true,
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-input1') as HTMLInputElement).value,
          teacher_name: (document.getElementById('swal-input2') as HTMLInputElement).value,
          teacher_nip: (document.getElementById('swal-input3') as HTMLInputElement).value,
          headmaster_name: (document.getElementById('swal-input4') as HTMLInputElement).value,
          headmaster_nip: (document.getElementById('swal-input5') as HTMLInputElement).value,
        };
      }
    });

    if (formValues && formValues.name) {
      const { error } = await supabase.from('classes').insert([formValues]);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Berhasil', 'Kelas telah ditambahkan', 'success');
        fetchClasses();
      }
    }
  };

  const handleEditClass = async (cls: ClassRoom) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Data Kelas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${cls.name}" placeholder="Nama Kelas">` +
        `<input id="swal-input2" class="swal2-input" value="${cls.teacher_name}" placeholder="Nama Guru Wali">` +
        `<input id="swal-input3" class="swal2-input" value="${cls.teacher_nip}" placeholder="NIP Guru">` +
        `<input id="swal-input4" class="swal2-input" value="${cls.headmaster_name}" placeholder="Nama Kepala Sekolah">` +
        `<input id="swal-input5" class="swal2-input" value="${cls.headmaster_nip}" placeholder="NIP Kepala Sekolah">`,
      focusConfirm: false,
      confirmButtonText: 'Update',
      confirmButtonColor: '#0EA5E9',
      showCancelButton: true,
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-input1') as HTMLInputElement).value,
          teacher_name: (document.getElementById('swal-input2') as HTMLInputElement).value,
          teacher_nip: (document.getElementById('swal-input3') as HTMLInputElement).value,
          headmaster_name: (document.getElementById('swal-input4') as HTMLInputElement).value,
          headmaster_nip: (document.getElementById('swal-input5') as HTMLInputElement).value,
        };
      }
    });

    if (formValues) {
      const { error } = await supabase.from('classes').update(formValues).eq('id', cls.id);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Berhasil', 'Data kelas diperbarui', 'success');
        fetchClasses();
      }
    }
  };

  const handleDeleteClass = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Kelas?',
      text: "Data siswa di kelas ini mungkin akan terdampak!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F43F5E',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Terhapus', 'Kelas telah dihapus', 'success');
        fetchClasses();
      }
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Kelas</h1>
          <p className="text-slate-500">Kelola daftar kelas dan pengajar.</p>
        </div>
        <button 
          onClick={handleAddClass}
          className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-sky-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span className="font-bold">Tambah Kelas</span>
        </button>
      </header>

      <div className="bg-white rounded-[32px] shadow-xl shadow-sky-50/50 border border-slate-50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Cari kelas atau guru..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Kelas</th>
                <th className="px-6 py-4 font-semibold">Wali Kelas</th>
                <th className="px-6 py-4 font-semibold">Kepala Sekolah</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">Data tidak ditemukan.</td>
                </tr>
              ) : (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-sky-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800">{cls.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <User size={16} className="text-sky-500" />
                        {cls.teacher_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">NIP: {cls.teacher_nip || '-'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <ShieldCheck size={16} className="text-amber-500" />
                        {cls.headmaster_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">NIP: {cls.headmaster_nip || '-'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClass(cls)}
                          className="p-2 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-200 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassRooms;
