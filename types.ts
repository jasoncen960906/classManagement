
export interface Student {
  id: string;
  name: string;
  studentId?: string;
  department?: string;
}

export interface Group {
  id: number;
  members: Student[];
}

export enum ViewMode {
  PICKER = 'picker',
  GROUPER = 'grouper',
  ROSTER = 'roster'
}

export interface PickerHistoryItem {
  timestamp: number;
  studentName: string;
  mode: 'repeat' | 'no-repeat';
}
