
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  ClipboardCheck, 
  FileText, 
  Settings, 
  RefreshCw,
  Menu,
  X,
  UserCheck,
  Briefcase
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ClassRooms from './pages/ClassRooms';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Attendance from './pages/Attendance';
import TeacherAttendance from './pages/TeacherAttendance';
import Reports from './pages/Reports';
import AppSettings from './pages/Settings';
import supabase from './supabase';
import { SchoolSettings } from './types';

const App: React.FC = () => {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchSettings = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .single();
      
      if (!error && data) {
        setSchoolSettings(data);
      } else {
        // Fallback if no data
        setSchoolSettings({ id: '1', school_name: 'TK Digital Indonesia' });
      }
    } catch (err) {
      setSchoolSettings({ id: '1', school_name: 'TK Digital Indonesia' });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const NavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Beranda' },
    { to: '/classes', icon: School, label: 'Data Kelas' },
    { to: '/teachers', icon: Briefcase, label: 'Data Guru' },
    { to: '/students', icon: Users, label: 'Data Siswa' },
    { to: '/attendance-teacher', icon: UserCheck, label: 'Absen Guru' },
    { to: '/attendance', icon: ClipboardCheck, label: 'Absen Siswa' },
    { to: '/reports', icon: FileText, label: 'Laporan' },
    { to: '/settings', icon: Settings, label: 'Pengaturan' },
  ];

  return (
    <Router>
      <div className="min-h-screen flex flex-col md:flex-row bg-sky-50 text-slate-800">
        
        {/* Mobile Navbar */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50">
          <h1 className="text-xl font-bold text-sky-600 truncate max-w-[200px]">
            {schoolSettings?.school_name || 'TK Digital Indonesia'}
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchSettings}
              className={`p-2 rounded-full bg-sky-100 text-sky-600 transition-transform ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-sky-600"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transition-transform duration-300 transform
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar">
            <div className="mb-10 text-center shrink-0">
              <div className="w-16 h-16 bg-sky-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-sky-600">
                <School size={32} />
              </div>
              <h2 className="text-xl font-bold text-sky-600 px-2 leading-tight">
                {schoolSettings?.school_name || 'TK Digital Indonesia'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Absensi Pintar</p>
            </div>

            <nav className="flex-1 space-y-2">
              {NavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                    ${isActive 
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-200' 
                      : 'text-slate-500 hover:bg-sky-50 hover:text-sky-600'}
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <button 
              onClick={fetchSettings}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-colors shrink-0"
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              <span className="text-sm font-semibold">Sinkron Cloud</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 pb-24 md:pb-10 h-screen overflow-y-auto no-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/classes" element={<ClassRooms />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/attendance-teacher" element={<TeacherAttendance />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<AppSettings onUpdate={fetchSettings} />} />
          </Routes>
        </main>

        {/* Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </Router>
  );
};

export default App;
