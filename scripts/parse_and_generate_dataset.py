import pypdf
import re
import json
import os

pdf_path = '/Users/xtreamdeveloper/.gemini/antigravity-ide/brain/0a86a17e-ba8e-4829-964e-73af347ba74b/.user_uploaded/media_1791349146830.pdf'
reader = pypdf.PdfReader(pdf_path)
row_regex = re.compile(r'^\s*(\d{1,2})\s+([A-E])\s+(\d+/026)\s+([A-Z\s\.\'\-]+?)\s{2,}(.*)$')

def to_num(val):
    if val == 'AB':
        return 0
    return int(val)

def title_case(name):
    # Formats e.g. "ABHAY SINGH" -> "Abhay Singh"
    # Handles hyphens and apostrophes cleanly
    words = name.strip().split()
    formatted_words = []
    for w in words:
        if '-' in w:
            parts = w.split('-')
            formatted_words.append('-'.join(p.capitalize() for p in parts))
        elif "'" in w:
            parts = w.split("'")
            formatted_words.append("'".join(p.capitalize() for p in parts))
        else:
            formatted_words.append(w.capitalize())
    return ' '.join(formatted_words)

students = []
excel_rows = []

for page_idx, page in enumerate(reader.pages):
    text = page.extract_text(extraction_mode='layout')
    for line in text.splitlines():
        m = row_regex.match(line)
        if m:
            cls = m.group(1)
            sec = m.group(2)
            roll_code = m.group(3)
            raw_name = m.group(4).strip()
            tokens = m.group(5).strip().split()
            
            roll_num = int(roll_code.split('/')[0])
            name = title_case(raw_name)
            student_id = f"CCS-{cls}{sec}-{roll_code}"
            
            excel_row = {
                'Student_ID': student_id,
                'Class': cls,
                'Section': sec,
                'Roll_No': roll_code,
                'Student_Name': name
            }
            
            if cls in ['6', '7', '8']:
                # 11 tokens: English Hindi Maths Science Social_Science Computer Sanskrit Total_Score Percentage Grade Attendance_Status
                eng = to_num(tokens[0])
                hin = to_num(tokens[1])
                mat = to_num(tokens[2])
                sci = to_num(tokens[3])
                sst = to_num(tokens[4])
                comp = to_num(tokens[5])
                sans = to_num(tokens[6])
                tot_score = int(tokens[7])
                pct_str = tokens[8]
                grade = tokens[9]
                att_status = tokens[10]
                
                marks = {
                    'English': eng,
                    'Hindi': hin,
                    'Mathematics': mat,
                    'Science': sci,
                    'Social Science': sst,
                    'Computer': comp,
                    'Sanskrit': sans
                }
                max_marks = {
                    'English': 80,
                    'Hindi': 80,
                    'Mathematics': 80,
                    'Science': 80,
                    'Social Science': 80,
                    'Computer': 80,
                    'Sanskrit': 80
                }
                
                excel_row['English'] = eng
                excel_row['Hindi'] = hin
                excel_row['Mathematics'] = mat
                excel_row['Science'] = sci
                excel_row['Social_Science'] = sst
                excel_row['Computer'] = comp
                excel_row['Sanskrit'] = sans
                excel_row['Total_Score'] = tot_score
                excel_row['Max_Marks'] = 560
                excel_row['Percentage'] = pct_str
                excel_row['Grade'] = grade
                excel_row['Attendance_Status'] = att_status
                
            elif cls == '9':
                # 10 tokens: English Hindi Maths Science Social_Science Sanskrit Total_Score Percentage Grade Attendance_Status
                eng = to_num(tokens[0])
                hin = to_num(tokens[1])
                mat = to_num(tokens[2])
                sci = to_num(tokens[3])
                sst = to_num(tokens[4])
                sans = to_num(tokens[5])
                tot_score = int(tokens[6])
                pct_str = tokens[7]
                grade = tokens[8]
                att_status = tokens[9]
                
                marks = {
                    'English': eng,
                    'Hindi': hin,
                    'Mathematics': mat,
                    'Science': sci,
                    'Social Science': sst,
                    'Sanskrit': sans
                }
                max_marks = {
                    'English': 80,
                    'Hindi': 80,
                    'Mathematics': 80,
                    'Science': 80,
                    'Social Science': 80,
                    'Sanskrit': 80
                }
                
                excel_row['English'] = eng
                excel_row['Hindi'] = hin
                excel_row['Mathematics'] = mat
                excel_row['Science'] = sci
                excel_row['Social_Science'] = sst
                excel_row['Computer'] = '-'
                excel_row['Sanskrit'] = sans
                excel_row['Total_Score'] = tot_score
                excel_row['Max_Marks'] = 480
                excel_row['Percentage'] = pct_str
                excel_row['Grade'] = grade
                excel_row['Attendance_Status'] = att_status
                
            elif cls == '10':
                # 9 tokens: English Hindi Maths Science Social_Science Total_Score Percentage Grade Attendance_Status
                eng = to_num(tokens[0])
                hin = to_num(tokens[1])
                mat = to_num(tokens[2])
                sci = to_num(tokens[3])
                sst = to_num(tokens[4])
                tot_score = int(tokens[5])
                pct_str = tokens[6]
                grade = tokens[7]
                att_status = tokens[8]
                
                marks = {
                    'English': eng,
                    'Hindi': hin,
                    'Mathematics': mat,
                    'Science': sci,
                    'Social Science': sst
                }
                max_marks = {
                    'English': 80,
                    'Hindi': 80,
                    'Mathematics': 80,
                    'Science': 80,
                    'Social Science': 80
                }
                
                excel_row['English'] = eng
                excel_row['Hindi'] = hin
                excel_row['Mathematics'] = mat
                excel_row['Science'] = sci
                excel_row['Social_Science'] = sst
                excel_row['Computer'] = '-'
                excel_row['Sanskrit'] = '-'
                excel_row['Total_Score'] = tot_score
                excel_row['Max_Marks'] = 400
                excel_row['Percentage'] = pct_str
                excel_row['Grade'] = grade
                excel_row['Attendance_Status'] = att_status
                
            att_pct = 90
            if att_status.lower() == 'partial':
                att_pct = 75
            elif att_status.lower() == 'absent':
                att_pct = 0
                
            student = {
                'student_id': student_id,
                'name': name,
                'class': cls,
                'section': sec,
                'roll_no': roll_num,
                'roll_code': roll_code,
                'exam_name': 'Annual Evaluation 2025-26',
                'session': '2025-2026',
                'attendance_percentage': att_pct,
                'marks': marks,
                'max_marks': max_marks
            }
            students.append(student)
            excel_rows.append(excel_row)

print(f"Total students parsed: {len(students)}")

# Save to realStudentRecords.json
with open('src/data/realStudentRecords.json', 'w', encoding='utf-8') as f:
    json.dump(students, f, indent=2, ensure_ascii=False)
print("Saved src/data/realStudentRecords.json")

# Save excel rows data to a temporary json so node can build the xlsx
with open('src/data/excel_rows.json', 'w', encoding='utf-8') as f:
    json.dump(excel_rows, f, indent=2, ensure_ascii=False)
print("Saved src/data/excel_rows.json")

# Generate src/data/studentsData.ts
ts_content = """import { StudentRecord } from '../types';

// Evaluation dataset for 829 students (Classes 6-10) from official school register
// Subject rules: Max marks = 80 per subject
// - Classes 6-8: English, Hindi, Mathematics, Science, Social Science, Computer, Sanskrit (560 max)
// - Class 9: English, Hindi, Mathematics, Science, Social Science, Sanskrit (480 max; no Computer)
// - Class 10: English, Hindi, Mathematics, Science, Social Science (400 max; no Computer, no Sanskrit)
export const INITIAL_STUDENTS_DATA: StudentRecord[] = """ + json.dumps(students, indent=2, ensure_ascii=False) + """;
"""

with open('src/data/studentsData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)
print("Saved src/data/studentsData.ts")
