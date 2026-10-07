import pypdf
import re
import json

# 1. Load the 829 students from classes 6-10
with open('src/data/realStudentRecords.json', 'r', encoding='utf-8') as f:
    junior_students = json.load(f)

print(f"Loaded {len(junior_students)} junior students (Classes 6-10).")

# 2. Parse the 183 senior students (Classes 11-12) from media_1791351618232.pdf
pdf_senior = '/Users/xtreamdeveloper/.gemini/antigravity-ide/brain/0a86a17e-ba8e-4829-964e-73af347ba74b/.user_uploaded/media_1791351618232.pdf'
reader_senior = pypdf.PdfReader(pdf_senior)

bounds = [
    ('English', 66, 77),
    ('Hindi', 77, 86),
    ('Physical Education', 86, 101),
    ('Mathematics', 101, 110),
    ('Applied Maths', 110, 124),
    ('Physics', 124, 134),
    ('Chemistry', 134, 145),
    ('Biology', 145, 156),
    ('Business Studies', 156, 171),
    ('Accountancy', 171, 185),
    ('Economics', 185, 196),
    ('History', 196, 207),
    ('Political Science', 207, 223),
    ('Geography', 223, 233),
    ('Sociology', 233, 243)
]

def title_case(name):
    words = name.strip().split()
    formatted = []
    for w in words:
        if '-' in w:
            parts = w.split('-')
            formatted.append('-'.join(p.capitalize() for p in parts))
        elif "'" in w:
            parts = w.split("'")
            formatted.append("'".join(p.capitalize() for p in parts))
        else:
            formatted.append(w.capitalize())
    return ' '.join(formatted)

senior_students = []
senior_excel_rows = []

for p_idx, page in enumerate(reader_senior.pages):
    lines = page.extract_text(extraction_mode='layout').splitlines()
    for l_idx, line in enumerate(lines):
        m = re.match(r'^\s*(11|12)\s+([A-D])\s+(\d+/026)\s+([A-Z\s\.\'\-]+?)\s{2,}', line)
        if not m:
            continue
        cls = m.group(1)
        sec = m.group(2)
        roll_code = m.group(3)
        raw_name = m.group(4).strip()
        
        all_tokens = [(tok.group(), tok.start(), tok.end()) for tok in re.finditer(r'\S+', line)]
        att_status = all_tokens[-1][0]
        grade = all_tokens[-2][0]
        tot_tok = all_tokens[-3]
        tot_val = 0 if tot_tok[0] == 'AB' else int(tot_tok[0])
        
        marks = {}
        for subj_name, start, end in bounds:
            matching_tokens = [t for t in all_tokens if t[1] >= 65 and t[2] <= tot_tok[1] and start <= (t[1]+t[2])/2 < end]
            if matching_tokens:
                t = matching_tokens[0]
                marks[subj_name] = 0 if t[0] == 'AB' else int(t[0])
                
        roll_num = int(roll_code.split('/')[0])
        name = title_case(raw_name)
        sid = f'CCS-{cls}{sec}-{roll_code}'
        
        att_pct = 90
        if att_status.lower() == 'partial':
            att_pct = 75
        elif att_status.lower() == 'absent':
            att_pct = 0
            
        student_obj = {
            'student_id': sid,
            'name': name,
            'class': cls,
            'section': sec,
            'roll_no': roll_num,
            'roll_code': roll_code,
            'exam_name': 'Annual Evaluation 2025-26',
            'session': '2025-2026',
            'attendance_percentage': att_pct,
            'marks': marks,
            'is_marks_only': True,
            'grade': grade
        }
        senior_students.append(student_obj)

print(f"Parsed {len(senior_students)} senior students (Classes 11-12).")

# 3. Combine both lists
all_students = junior_students + senior_students
print(f"Total merged students: {len(all_students)}")

# 4. Save JSON and TypeScript
with open('src/data/realStudentRecords.json', 'w', encoding='utf-8') as f:
    json.dump(all_students, f, indent=2, ensure_ascii=False)
print("Saved src/data/realStudentRecords.json")

ts_content = """import { StudentRecord } from '../types';

// Complete school evaluation dataset for 1,012 students (Classes 6-12)
// Classes 6-10: 80 marks per subject
// - Classes 6-8: English, Hindi, Mathematics, Science, Social Science, Computer, Sanskrit (560 max)
// - Class 9: English, Hindi, Mathematics, Science, Social Science, Sanskrit (480 max; no Computer)
// - Class 10: English, Hindi, Mathematics, Science, Social Science (400 max; no Computer, no Sanskrit)
// Classes 11-12: Senior evaluation where only obtained marks and grade are shown (is_marks_only: true, no percentage out of 80)
export const INITIAL_STUDENTS_DATA: StudentRecord[] = """ + json.dumps(all_students, indent=2, ensure_ascii=False) + """;
"""

with open('src/data/studentsData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)
print("Saved src/data/studentsData.ts")

# 5. Build full Excel rows
# Collect all distinct subject names across the entire school
all_excel_rows = []
for s in all_students:
    row = {
        'Student_ID': s['student_id'],
        'Class': s['class'],
        'Section': s['section'],
        'Roll_No': s.get('roll_code', str(s['roll_no'])),
        'Student_Name': s['name']
    }
    
    # Add subject marks
    tot = sum(s['marks'].values())
    for subj, mark in s['marks'].items():
        row[subj] = mark
        
    row['Total_Score'] = tot
    if not s.get('is_marks_only'):
        max_tot = sum(s.get('max_marks', {}).values()) if 'max_marks' in s else 80 * len(s['marks'])
        row['Max_Marks'] = max_tot
        pct = (tot / max_tot * 100) if max_tot > 0 else 0
        row['Percentage'] = f"{pct:.2f}%"
    else:
        row['Max_Marks'] = '—'
        row['Percentage'] = '—'
        
    row['Grade'] = s.get('grade', '')
    att_pct = s.get('attendance_percentage', 90)
    row['Attendance_Status'] = 'Present' if att_pct >= 90 else ('Partial' if att_pct >= 75 else 'Absent')
    all_excel_rows.append(row)

with open('src/data/all_excel_rows.json', 'w', encoding='utf-8') as f:
    json.dump(all_excel_rows, f, indent=2, ensure_ascii=False)
print("Saved src/data/all_excel_rows.json")
