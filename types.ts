
export interface SchoolSettings {
  id: string;
  school_name: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  teacher_name: string;
  teacher_nip: string;
  headmaster_name: string;
  headmaster_nip: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  class_name: string;
  status: 'active' | 'inactive';
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  role: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  note?: string;
  date: string;
}

export interface TeacherAttendanceRecord {
  id: string;
  teacher_id: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  note?: string;
  date: string;
}

export interface AttendanceWithStudent extends AttendanceRecord {
  student: Student;
}
