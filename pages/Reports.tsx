
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import supabase from '../supabase';
import { ClassRoom, Student, SchoolSettings } from '../types';

const Reports: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: cls } = await supabase.from('classes').select('*').order('name', { ascending: true });
      const { data: set } = await supabase.from('school_settings').select('*').single();
      if (cls) {
        setClasses(cls);
        setSelectedClass(cls[0]?.name || '');
      }
      if (set) setSchoolSettings(set);
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchReportData = async () => {
      setLoading(true);
      try {
        const { data: stds } = await supabase.from('students').select('*').eq('class_name', selectedClass).order('name', { ascending: true });
        const { data: att } = await supabase.from('attendance')
          .select('*, students!inner(*)')
          .eq('students.class_name', selectedClass)
          .like('date', `${selectedMonth}%`);

        if (stds) {
          const report = stds.map(s => {
            const studentAtt = att?.filter(a => a.student_id === s.id) || [];
            return {
              name: s.name,
              nis: s.nis,
              hadir: studentAtt.filter(a => a.status === 'Hadir').length,
              sakit: studentAtt.filter(a => a.status === 'Sakit').length,
              izin: studentAtt.filter(a => a.status === 'Izin').length,
              alfa: studentAtt.filter(a => a.status === 'Alfa').length,
              total: studentAtt.length
            };
          });
          setAttendanceRecords(report);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedClass, selectedMonth]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const currentClass = classes.find(c => c.name === selectedClass);
    const monthYear = new Date(selectedMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // Formal Header (Kop Surat)
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text((schoolSettings?.school_name || 'TK ULTRA SMART').toUpperCase(), 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('LAPORAN KEHADIRAN SISWA BULANAN', 105, 22, { align: 'center' });
    doc.line(20, 25, 190, 25);
    doc.line(20, 25.5, 190, 25.5);

    // Metadata
    doc.setFontSize(11);
    doc.text(`Kelas : ${selectedClass}`, 20, 35);
    doc.text(`Bulan : ${monthYear}`, 20, 40);
    doc.text(`Guru  : ${currentClass?.teacher_name || '-'}`, 20, 45);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [['No', 'NIS', 'Nama Siswa', 'H', 'S', 'I', 'A', 'Total']],
      body: attendanceRecords.map((r, i) => [
        i + 1, r.nis, r.name, r.hadir, r.sakit, r.izin, r.alfa, r.total
      ]),
      styles: { font: 'times', fontSize: 10 },
      headStyles: { fillColor: [80, 80, 80], halign: 'center' },
      columnStyles: {
        0: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
      }
    });

    // Signature Area
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    doc.text(`Dicetak pada: ${today}`, 20, finalY - 10);
    
    // Left side (Headmaster)
    doc.text('Mengetahui,', 20, finalY);
    doc.text('Kepala Sekolah', 20, finalY + 5);
    doc.text(`(${currentClass?.headmaster_name || '............................'})`, 20, finalY + 30);
    doc.text(`NIP: ${currentClass?.headmaster_nip || '-'}`, 20, finalY + 35);

    // Right side (Teacher)
    doc.text('Wali Kelas,', 140, finalY);
    doc.text(`(${currentClass?.teacher_name || '............................'})`, 140, finalY + 30);
    doc.text(`NIP: ${currentClass?.teacher_nip || '-'}`, 140, finalY + 35);

    doc.save(`Laporan_Absensi_${selectedClass}_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Laporan Absensi</h1>
          <p className="text-slate-500">Unduh dan cetak rekapitulasi data.</p>
        </div>
        <button 
          onClick={downloadPDF}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
        >
          <Download size={20} />
          <span className="font-bold">Download PDF</span>
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
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Calendar size={20} />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pilih Bulan</label>
            <input 
              type="month"
              className="w-full bg-transparent font-bold text-slate-700 outline-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[48px] shadow-xl shadow-sky-50/50 border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">Pratinjau Rekapitulasi</h3>
          <div className="px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-xs font-bold">
            {new Date(selectedMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">No</th>
                <th className="px-6 py-4 font-bold">Nama Siswa</th>
                <th className="px-6 py-4 font-bold text-center">H</th>
                <th className="px-6 py-4 font-bold text-center">S</th>
                <th className="px-6 py-4 font-bold text-center">I</th>
                <th className="px-6 py-4 font-bold text-center">A</th>
                <th className="px-6 py-4 font-bold text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400">Menghitung rekapitulasi...</td></tr>
              ) : attendanceRecords.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400">Tidak ada data untuk bulan ini.</td></tr>
              ) : (
                attendanceRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 uppercase">{r.name}</td>
                    <td className="px-6 py-4 text-center font-bold text-sky-600">{r.hadir}</td>
                    <td className="px-6 py-4 text-center font-bold text-amber-500">{r.sakit}</td>
                    <td className="px-6 py-4 text-center font-bold text-rose-500">{r.izin}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">{r.alfa}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{r.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-slate-50 flex items-start gap-4 text-xs text-slate-400 italic">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-600" /> H: Hadir</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> S: Sakit</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" /> I: Izin</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-600" /> A: Alfa</div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
