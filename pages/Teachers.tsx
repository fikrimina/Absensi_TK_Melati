
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Briefcase } from 'lucide-react';
import Swal from 'sweetalert2';
import supabase from '../supabase';
import { Teacher } from '../types';

const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name', { ascending: true });
      if (data) setTeachers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Guru Baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="NIP">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Nama Lengkap">' +
        '<input id="swal-input3" class="swal2-input" placeholder="Jabatan/Role (Contoh: Guru Kelas A1)">',
      focusConfirm: false,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#0EA5E9',
      showCancelButton: true,
      preConfirm: () => {
        return {
          nip: (document.getElementById('swal-input1') as HTMLInputElement).value,
          name: (document.getElementById('swal-input2') as HTMLInputElement).value,
          role: (document.getElementById('swal-input3') as HTMLInputElement).value,
        };
      }
    });

    if (formValues && formValues.name && formValues.nip) {
      const { error } = await supabase.from('teachers').insert([formValues]);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Berhasil', 'Guru telah ditambahkan', 'success');
        fetchTeachers();
      }
    }
  };

  const handleEditTeacher = async (teacher: Teacher) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Data Guru',
      html:
        `<input id="swal-input1" class="swal2-input" value="${teacher.nip}" placeholder="NIP">` +
        `<input id="swal-input2" class="swal2-input" value="${teacher.name}" placeholder="Nama Lengkap">` +
        `<input id="swal-input3" class="swal2-input" value="${teacher.role}" placeholder="Jabatan">`,
      focusConfirm: false,
      confirmButtonText: 'Update',
      confirmButtonColor: '#0EA5E9',
      showCancelButton: true,
      preConfirm: () => {
        return {
          nip: (document.getElementById('swal-input1') as HTMLInputElement).value,
          name: (document.getElementById('swal-input2') as HTMLInputElement).value,
          role: (document.getElementById('swal-input3') as HTMLInputElement).value,
        };
      }
    });

    if (formValues) {
      const { error } = await supabase.from('teachers').update(formValues).eq('id', teacher.id);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Berhasil', 'Data guru diperbarui', 'success');
        fetchTeachers();
      }
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Guru?',
      text: "Data absensi guru ini juga akan hilang!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F43F5E',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Terhapus', 'Data guru telah dihapus', 'success');
        fetchTeachers();
      }
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.nip.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Guru</h1>
          <p className="text-slate-500">Kelola daftar pendidik di TK.</p>
        </div>
        <button 
          onClick={handleAddTeacher}
          className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-sky-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span className="font-bold">Tambah Guru</span>
        </button>
      </header>

      <div className="bg-white rounded-[32px] shadow-xl shadow-sky-50/50 border border-slate-50 overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Cari nama atau NIP guru..."
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
                <th className="px-6 py-4 font-semibold">NIP</th>
                <th className="px-6 py-4 font-semibold">Nama Guru</th>
                <th className="px-6 py-4 font-semibold">Jabatan</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Memuat data...</td></tr>
              ) : filteredTeachers.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Data guru tidak ditemukan.</td></tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-sky-50/30 transition-colors">
                    <td className="px-6 py-5 text-slate-500 font-medium">{teacher.nip}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="font-bold text-slate-800">{teacher.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                        {teacher.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditTeacher(teacher)}
                          className="p-2 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-200 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTeacher(teacher.id)}
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

export default Teachers;
