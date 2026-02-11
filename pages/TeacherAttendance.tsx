
import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Save, Info } from 'lucide-react';
import Swal from 'sweetalert2';
import supabase from '../supabase';
import { Teacher, TeacherAttendanceRecord } from '../types';

const TeacherAttendance: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string, note?: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeacherAttendance = async () => {
      setLoading(true);
      try {
        // Fetch all teachers
        const { data: tData, error: tError } = await supabase.from('teachers').select('*').order('name', { ascending: true });
        if (tError) throw tError;
        if (tData) setTeachers(tData);

        // Fetch existing attendance for this date
        const { data: att, error: attError } = await supabase.from('teacher_attendance').select('*').eq('date', selectedDate);
        if (attError) throw attError;
        
        const attMap: Record<string, { status: string, note?: string }> = {};
        tData?.forEach(t => {
          const record = att?.find(r => r.teacher_id === t.id);
          attMap[t.id] = record ? { status: record.status, note: record.note } : { status: 'Hadir', note: '' };
        });
        setAttendanceData(attMap);
      } catch (err: any) {
        console.error("Fetch Teacher Attendance Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherAttendance();
  }, [selectedDate]);

  const handleStatusChange = async (teacherId: string, status: string) => {
    let note = '';
    if (status === 'Sakit' || status === 'Izin') {
      const { value: inputNote } = await Swal.fire({
        title: `Alasan ${status}`,
        input: 'text',
        inputLabel: 'Masukkan keterangan singkat',
        inputValue: attendanceData[teacherId]?.note || '',
        showCancelButton: true,
        confirmButtonColor: '#0EA5E9',
      });
      if (inputNote === undefined) return;
      note = inputNote || '';
    }

    setAttendanceData(prev => ({
      ...prev,
      [teacherId]: { status, note }
    }));
  };

  const saveAttendance = async () => {
    if (teachers.length === 0) {
      Swal.fire('Info', 'Tidak ada data guru untuk diabsen.', 'info');
      return;
    }

    setLoading(true);
    // Ensure all data is ready and structured correctly
    const updates = teachers.map(t => ({
      teacher_id: t.id,
      date: selectedDate,
      status: attendanceData[t.id]?.status || 'Hadir',
      note: attendanceData[t.id]?.note || ''
    }));

    try {
      // 1. Delete existing records to avoid unique constraint violations
      const teacherIds = teachers.map(t => t.id);
      const { error: deleteError } = await supabase
        .from('teacher_attendance')
        .delete()
        .in('teacher_id', teacherIds)
        .eq('date', selectedDate);
      
      if (deleteError) throw deleteError;

      // 2. Batch insert new records
      const { error: insertError } = await supabase.from('teacher_attendance').insert(updates);
      
      if (insertError) throw insertError;

      Swal.fire({
        title: 'Berhasil',
        text: 'Data absensi guru telah disimpan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire('Gagal Menyimpan', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Presensi Guru</h1>
          <p className="text-slate-500">Input kehadiran guru harian.</p>
        </div>
        <button 
          onClick={saveAttendance}
          disabled={loading || teachers.length === 0}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <Save size={20} />
          <span className="font-bold">Simpan Absensi</span>
        </button>
      </header>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 max-w-sm">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
          <Calendar size={20} />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tanggal Absensi</label>
          <input 
            type="date"
            className="w-full bg-transparent font-bold text-slate-700 outline-none"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl shadow-sky-50/50 border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Guru</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && teachers.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">Sedang memuat...</td></tr>
              ) : teachers.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">Belum ada data guru. Tambahkan di menu Data Guru.</td></tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.nip} - {t.role}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => (
                          <button
                            key={st}
                            onClick={() => handleStatusChange(t.id, st)}
                            className={`
                              px-4 py-2 rounded-xl text-xs font-bold transition-all
                              ${attendanceData[t.id]?.status === st 
                                ? st === 'Hadir' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 
                                  st === 'Sakit' ? 'bg-amber-400 text-white shadow-md shadow-amber-100' : 
                                  st === 'Izin' ? 'bg-rose-500 text-white shadow-md shadow-rose-100' : 'bg-slate-600 text-white shadow-md shadow-slate-100'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                            `}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {attendanceData[t.id]?.note ? (
                        <div className="flex items-center gap-2 text-slate-600 text-sm italic">
                          <Info size={14} className="text-indigo-500" />
                          {attendanceData[t.id]?.note}
                        </div>
                      ) : <span className="text-slate-300 text-xs">-</span>}
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

export default TeacherAttendance;
