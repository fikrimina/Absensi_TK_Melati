
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Clock,
  School,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import supabase from '../supabase';

const COLORS = ['#0EA5E9', '#FBBF24', '#F43F5E', '#94A3B8'];

const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
      <div className="w-16 h-4 bg-slate-50 rounded"></div>
    </div>
    <div className="w-10 h-8 bg-slate-100 rounded mb-2"></div>
    <div className="w-24 h-4 bg-slate-50 rounded"></div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ present: 0, sick: 0, permission: 0, alpha: 0 });
  const [teacherStats, setTeacherStats] = useState({ present: 0, total: 0 });
  const [classData, setClassData] = useState<any[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch Today's student stats
        const { data: attData } = await supabase
          .from('attendance')
          .select('status')
          .eq('date', today);

        const counts = { present: 0, sick: 0, permission: 0, alpha: 0 };
        attData?.forEach(r => {
          if (r.status === 'Hadir') counts.present++;
          else if (r.status === 'Sakit') counts.sick++;
          else if (r.status === 'Izin') counts.permission++;
          else if (r.status === 'Alfa') counts.alpha++;
        });
        setStats(counts);

        // Fetch Today's teacher stats
        const { data: tData } = await supabase.from('teachers').select('id');
        const { data: tAttData } = await supabase
          .from('teacher_attendance')
          .select('status')
          .eq('date', today)
          .eq('status', 'Hadir');

        setTeacherStats({
          present: tAttData?.length || 0,
          total: tData?.length || 0
        });

        // Fetch Class data
        const { data: classes } = await supabase.from('classes').select('name');
        const { data: students } = await supabase.from('students').select('class_name');
        
        const classChart = classes?.map(c => ({
          name: c.name,
          count: students?.filter(s => s.class_name === c.name).length || 0
        })) || [];
        setClassData(classChart);

        // Mock weekly trends
        setWeeklyTrends([
          { day: 'Sen', hadir: 45 },
          { day: 'Sel', hadir: 48 },
          { day: 'Rab', hadir: 42 },
          { day: 'Kam', hadir: 50 },
          { day: 'Jum', hadir: 47 },
        ]);

      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pieData = [
    { name: 'Hadir', value: stats.present },
    { name: 'Sakit', value: stats.sick },
    { name: 'Izin', value: stats.permission },
    { name: 'Alfa', value: stats.alpha },
  ].filter(d => d.value > 0);

  const StatCard = ({ title, value, icon: Icon, colorClass, shadowClass }: any) => (
    <div className={`bg-white p-6 rounded-[32px] shadow-lg ${shadowClass} border border-slate-50 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          <Icon size={24} className="text-white" />
        </div>
        <span className="text-slate-400 font-medium text-sm">Hari Ini</span>
      </div>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      <p className="text-slate-500 text-sm mt-1">{title}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Ringkasan Utama</h1>
          <p className="text-slate-500">Selamat datang kembali! Berikut pantauan hari ini.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
          <Calendar size={18} className="text-sky-500" />
          <span className="font-bold text-slate-700">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard 
              title="Siswa Hadir" 
              value={stats.present} 
              icon={CheckCircle} 
              colorClass="bg-sky-500" 
              shadowClass="shadow-sky-100" 
            />
            <StatCard 
              title="Guru Hadir" 
              value={`${teacherStats.present}/${teacherStats.total}`} 
              icon={UserCheck} 
              colorClass="bg-indigo-500" 
              shadowClass="shadow-indigo-100" 
            />
            <StatCard 
              title="Izin & Sakit" 
              value={stats.sick + stats.permission} 
              icon={Clock} 
              colorClass="bg-amber-400" 
              shadowClass="shadow-amber-100" 
            />
            <StatCard 
              title="Total Kelas" 
              value={classData.length} 
              icon={School} 
              colorClass="bg-slate-500" 
              shadowClass="shadow-slate-100" 
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-50 min-h-[400px]">
          <h3 className="text-xl font-bold mb-8 text-slate-800 flex items-center gap-3">
            <Users size={22} className="text-sky-500" /> Statistik Siswa Per Kelas
          </h3>
          {classData.length === 0 && !loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <TrendingUp size={40} className="mb-2 opacity-20" />
              <p>Belum ada data kelas.</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="count" fill="#0EA5E9" radius={[10, 10, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-50 min-h-[400px]">
          <h3 className="text-xl font-bold mb-8 text-slate-800 flex items-center gap-3">
            <CheckCircle size={22} className="text-sky-500" /> Komposisi Kehadiran Hari Ini
          </h3>
          {pieData.length === 0 && !loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <CheckCircle size={40} className="mb-2 opacity-20" />
              <p>Belum ada data absensi hari ini.</p>
            </div>
          ) : (
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 pr-4">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}} />
                    <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
