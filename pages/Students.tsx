
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, GraduationCap } from 'lucide-react';
import Swal from 'sweetalert2';
import supabase from '../supabase';
import { Student, ClassRoom } from '../types';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: stdData } = await supabase.from('students').select('*').order('name', { ascending: true });
      const { data: clsData } = await supabase.from('classes').select('*').order('name', { ascending: true });
      if (stdData) setStudents(stdData);
      if (clsData) setClasses(clsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async () => {
    if (classes.length === 0) {
      Swal.fire('Info', 'Mohon tambahkan data kelas terlebih dahulu.', 'info');
      return;
    }

    const classOptions = classes.reduce((acc, curr) => {
      acc[curr.name] = curr.name;
      return acc;
    }, {} as any);

    const { value: formValues } = await Swal.fire({
      title: 'Tambah Siswa Baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="NIS">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Nama Lengkap">' +
        `<select id="swal-input3" class="swal2-input">` +
          Object.keys(classOptions).map(name => `<option value="${name}">${name}</option>`).join('') +
        `</select>`,
      focusConfirm: false,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#0EA5E9',
      showCancelButton: true,
      preConfirm: () => {
        return {
          nis: (document.getElementById('swal-input1') as HTMLInputElement).value,
          name: (document.getElementById('swal-input2') as HTMLInputElement).value,
          class_name: (document.getElementById('swal-input3') as HTMLSelectElement).value,
        };
      }
    });

    if (formValues && formValues.name && formValues.nis) {
      const { error } = await supabase.from('students').insert([formValues]);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Berhasil', 'Siswa telah ditambahkan', 'success');
        fetchData();
      }
    }
  };

  const handleEditStudent = async (std: Student) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Data Siswa',
      html:
        `<input id="swal-input1" class="swal2-input" value="${std.nis}" placeholder="NIS">` +
        `<input id="swal-input2" class="swal2-input" value="${std.name}" placeholder="Nama Lengkap">` +
        `<select id="swal-input3" class="swal2-input">` +
          classes.map(c => `<option value="${c.name}" ${c.name === std.class_name ? 'selected' : ''}>${c.name}</option>`).join('') +
        `</select>`,
      focusConfirm: false,
      confirmButtonText: 'Update',
      confirmButtonColor: '#0EA5E9',
      showCancelButton: true,
      preConfirm: () => {
        return {
          nis: (document.getElementById('swal-input1') as HTMLInputElement).value,
          name: (document.getElementById('swal-input2') as HTMLInputElement).value,
          class_name: (document.getElementById('swal-input3') as HTMLSelectElement).value,
        };
      }
    });

    if (formValues) {
      const { error } = await supabase.from('students').update(formValues).eq('id', std.id);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Berhasil', 'Data siswa diperbarui', 'success');
        fetchData();
      }
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Siswa?',
      text: "Data absensi siswa ini juga akan hilang!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F43F5E',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        Swal.fire('Gagal', error.message, 'error');
      } else {
        Swal.fire('Terhapus', 'Data siswa telah dihapus', 'success');
        fetchData();
      }
    }
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm);
    const matchClass = selectedClass === 'Semua Kelas' || s.class_name === selectedClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Siswa</h1>
          <p className="text-slate-500">Daftar siswa-siswi TK.</p>
        </div>
        <button 
          onClick={handleAddStudent}
          className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-sky-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span className="font-bold">Tambah Siswa</span>
        </button>
      </header>

      <div className="bg-white rounded-[32px] shadow-xl shadow-sky-50/50 border border-slate-50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Cari nama atau NIS..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all outline-none appearance-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option>Semua Kelas</option>
              {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">NIS</th>
                <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold">Kelas</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Memuat data...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Data siswa tidak ditemukan.</td></tr>
              ) : (
                filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-sky-50/30 transition-colors">
                    <td className="px-6 py-5 text-slate-500 font-medium">{std.nis}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                          {std.name.charAt(0)}
                        </div>
                        <div className="font-bold text-slate-800">{std.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-sky-100 text-sky-600 text-xs font-bold rounded-full">
                        {std.class_name}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditStudent(std)}
                          className="p-2 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-200 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(std.id)}
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

export default Students;
