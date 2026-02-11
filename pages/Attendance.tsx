
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, Filter, Save, Info } from 'lucide-react';
import Swal from 'sweetalert2';
import supabase from '../supabase';
import { Student, ClassRoom, AttendanceRecord } from '../types';

const Attendance: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string, note?: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').order('name', { ascending: true });
      if (data && data.length > 0) {
        setClasses(data);
        setSelectedClass(data[0].name);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchAttendance = async () => {
      setLoading(true);
      // Fetch students for this class
      const { data: stds } = await supabase.from('students').select('*').eq('class_name', selectedClass).order('name', { ascending: true });
      if (stds) setStudents(stds);

      // Fetch existing attendance for this date
      const { data: att } = await supabase.from('attendance').select('*').eq('date', selectedDate);
      
      const attMap: Record<string, { status: string, note?: string }> = {};
      // Initialize with 'Hadir' if no record
      stds?.forEach(s => {
        const record = att?.find(r => r.student_id === s.id);
        attMap[s.id] = record ? { status: record.status, note: record.note } : { status: 'Hadir' };
      });
      setAttendanceData(attMap);
      setLoading(false);
    };

    fetchAttendance();
  }, [selectedClass, selectedDate]);

  const handleStatusChange = async (studentId: string, status: string) => {
    let note = '';
    if (status === 'Sakit' || status === 'Izin') {
      const { value: inputNote } = await Swal.fire({
        title: `Alasan ${status}`,
        input: 'text',
        inputLabel: 'Masukkan keterangan singkat',
        inputValue: attendanceData[studentId]?.note || '',
        showCancelButton: true,
        confirmButtonColor: '#0EA5E9',
      });
      if (inputNote === undefined) return; // User cancelled
      note = inputNote || '';
    }

    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { status, note }
    }));
  };

  const saveAttendance = async () => {
    setLoading(true);
    const updates = students.map(s => ({
      student_id: s.id,
      date: selectedDate,
      status: attendanceData[s.id].status,
      note: attendanceData[s.id].note || ''
    }));

    try {
      // Upsert using student_id and date as constraints (need unique constraint on these columns in DB)
      // Since it's a demo, we might need a simpler logic if unique index isn't set.
      // Logic: delete existing records for these students on this date, then insert.
      const studentIds = students.map(s => s.id);
      await supabase.from('attendance').delete().in('student_id', studentIds).eq('date', selectedDate);
      
      const { error } = await supabase.from('attendance').insert(updates);
      
      if (error) throw error;
      Swal.fire('Berhasil', 'Data absensi telah disimpan.', 'success');
    } catch (err: any) {
      Swal.fire('Gagal', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Presensi Harian</h1>
          <p className="text-slate-500">Input kehadiran siswa hari ini.</p>
        </div>
        <button 
          onClick={saveAttendance}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl shadow-lg shadow-sky-200 transition-all active:scale-95"
        >
          <Save size={20} />
          <span className="font-bold">Simpan Absensi</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4">
          <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl">
            <Filter size={20} />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pilih Kelas</label>
            <select 
              className="w-full bg-transparent font-bold text-slate-700 outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4">
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
      </div>

      <div className="bg-white rounded-[32px] shadow-xl shadow-sky-50/50 border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold text-center">Status Kehadiran</th>
                <th className="px-6 py-4 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">Sedang sinkronisasi...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">Belum ada siswa di kelas ini.</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-sky-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.nis}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => (
                          <button
                            key={st}
                            onClick={() => handleStatusChange(s.id, st)}
                            className={`
                              px-4 py-2 rounded-xl text-xs font-bold transition-all
                              ${attendanceData[s.id]?.status === st 
                                ? st === 'Hadir' ? 'bg-sky-500 text-white' : 
                                  st === 'Sakit' ? 'bg-amber-400 text-white' : 
                                  st === 'Izin' ? 'bg-rose-500 text-white' : 'bg-slate-600 text-white'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                            `}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {attendanceData[s.id]?.note ? (
                        <div className="flex items-center gap-2 text-slate-600 text-sm italic">
                          <Info size={14} className="text-sky-500" />
                          {attendanceData[s.id]?.note}
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

export default Attendance;
