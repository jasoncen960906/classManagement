
import { Student } from '../types';

export const parseCSV = (text: string): Student[] => {
  const lines = text.split(/\r?\n/);
  const students: Student[] = [];
  
  // Skip header if it looks like one
  const startIdx = (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('姓名')) ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Support comma, semicolon, or tab separation
    const parts = line.split(/[,\t;]/);
    if (parts.length > 0) {
      const name = parts[0].trim();
      const studentId = parts[1]?.trim();
      const department = parts[2]?.trim();
      
      if (name) {
        students.push({
          id: Math.random().toString(36).substr(2, 9),
          name,
          studentId,
          department
        });
      }
    }
  }
  return students;
};
