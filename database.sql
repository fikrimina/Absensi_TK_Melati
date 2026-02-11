
-- 1. Table: school_settings
CREATE TABLE IF NOT EXISTS school_settings (
    id TEXT PRIMARY KEY DEFAULT '1',
    school_name TEXT NOT NULL
);

-- 2. Table: classes
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    teacher_name TEXT,
    teacher_nip TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT
);

-- 3. Table: students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    class_name TEXT REFERENCES classes(name) ON UPDATE CASCADE ON DELETE SET NULL,
    status TEXT DEFAULT 'active'
);

-- 4. Table: attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    date DATE NOT NULL,
    UNIQUE(student_id, date)
);

-- 5. Table: teachers
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip TEXT UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Guru Kelas'
);

-- FIX: Explicitly drop NOT NULL constraint if it exists to allow optional NIP
-- This handles cases where the table was created previously with a NOT NULL constraint
ALTER TABLE teachers ALTER COLUMN nip DROP NOT NULL;

-- Fix existing data: Convert empty strings to NULL to satisfy unique constraint
UPDATE teachers SET nip = NULL WHERE nip = '';

-- 6. Table: teacher_attendance
CREATE TABLE IF NOT EXISTS teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    date DATE NOT NULL,
    UNIQUE(teacher_id, date)
);

-- Row Level Security (RLS)
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Safer Policy Creation: Drop if exists then create to avoid ERROR 42710
DROP POLICY IF EXISTS "Allow All Public" ON school_settings;
CREATE POLICY "Allow All Public" ON school_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All Public" ON classes;
CREATE POLICY "Allow All Public" ON classes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All Public" ON students;
CREATE POLICY "Allow All Public" ON students FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All Public" ON attendance;
CREATE POLICY "Allow All Public" ON attendance FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All Public" ON teachers;
CREATE POLICY "Allow All Public" ON teachers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow All Public" ON teacher_attendance;
CREATE POLICY "Allow All Public" ON teacher_attendance FOR ALL USING (true);

-- ==========================================
-- SEED DATA (DATA AWAL CONTOH)
-- ==========================================

-- Nama Sekolah Default
INSERT INTO school_settings (id, school_name) 
VALUES ('1', 'TK Ultra Digital Indonesia')
ON CONFLICT (id) DO UPDATE SET school_name = EXCLUDED.school_name;

-- Data Kelas
INSERT INTO classes (name, teacher_name, teacher_nip, headmaster_name, headmaster_nip)
VALUES 
('TK A1 (Bintang)', 'Siti Aminah, S.Pd', '198501012010012001', 'Dra. Hj. Nurul Huda', '197005051995012002'),
('TK B1 (Matahari)', 'Budi Santoso, S.Pd', '198802022012011003', 'Dra. Hj. Nurul Huda', '197005051995012002')
ON CONFLICT (name) DO NOTHING;

-- Data Guru
INSERT INTO teachers (nip, name, role)
VALUES 
('198501012010012001', 'Siti Aminah, S.Pd', 'Guru Kelas A1'),
('198802022012011003', 'Budi Santoso, S.Pd', 'Guru Kelas B1'),
('199010102020011005', 'Rina Wati, S.Pd', 'Guru Agama')
ON CONFLICT (nip) DO NOTHING;

-- Data Siswa
INSERT INTO students (nis, name, class_name)
VALUES 
('1001', 'Ahmad Fauzi', 'TK A1 (Bintang)'),
('1002', 'Larasati Putri', 'TK A1 (Bintang)'),
('1003', 'Zikri Al-Ghifari', 'TK A1 (Bintang)'),
('2001', 'Bagas Saputra', 'TK B1 (Matahari)'),
('2002', 'Cinta Kirana', 'TK B1 (Matahari)')
ON CONFLICT (nis) DO NOTHING;
