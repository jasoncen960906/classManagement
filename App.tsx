import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Layers,
  Upload,
  Download,
  History,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import { Student, Group, ViewMode, PickerHistoryItem } from './types';
import { parseCSV } from './utils/csvParser';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [view, setView] = useState<ViewMode>(ViewMode.ROSTER);
  const [history, setHistory] = useState<PickerHistoryItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Picker State
  const [lastPicked, setLastPicked] = useState<Student | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'repeat' | 'no-repeat'>('no-repeat');
  const [pool, setPool] = useState<Student[]>([]);

  // Grouping State
  const [groupSize, setGroupSize] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState<Group[]>([]);

  // File Processing Logic
  const processFile = async (file: File) => {
    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (!isCSV && !isExcel) {
      alert("请上传 CSV 或 Excel 格式的文件。");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      let text = '';

      if (isExcel) {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        text = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        try {
          // First try to decode as UTF-8 (strict mode)
          const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
          text = utf8Decoder.decode(buffer);
        } catch (err) {
          // If UTF-8 fails (e.g., file is GBK from Excel), fallback to GBK
          const gbkDecoder = new TextDecoder('gbk');
          text = gbkDecoder.decode(buffer);
        }
      }

      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        setStudents(parsed);
        setPool(parsed);
        setView(ViewMode.PICKER);
      } else {
        alert("未能识别文件中的学生数据，请检查格式。");
      }
    } catch (error) {
      console.error("File reading error:", error);
      alert("读取文件出错，请重试。");
    }
  };

  // File Upload Handler with Encoding Detection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await processFile(file);

    // Reset input value so the same file can be uploaded again if needed
    e.target.value = '';
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleManualInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('studentNames') as string;
    if (!text.trim()) return;

    const parsed = parseCSV(text);
    setStudents(prev => [...prev, ...parsed]);
    setPool(prev => [...prev, ...parsed]);
    e.currentTarget.reset();
  };

  // Student Picker Logic
  const pickStudent = async () => {
    if (students.length === 0) return;

    setIsPicking(true);

    // "Drum roll" effect simulation
    let currentPool = repeatMode === 'repeat' ? students : pool;
    if (currentPool.length === 0 && repeatMode === 'no-repeat') {
      alert("所有学生都已抽过！重新重置名单。");
      currentPool = students;
      setPool(students);
    }

    // Animation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const randomIndex = Math.floor(Math.random() * currentPool.length);
    const picked = currentPool[randomIndex];

    setLastPicked(picked);

    if (repeatMode === 'no-repeat') {
      setPool(prev => prev.filter(s => s.id !== picked.id));
    }

    setHistory(prev => [{
      timestamp: Date.now(),
      studentName: picked.name,
      mode: repeatMode
    }, ...prev].slice(0, 20));

    setIsPicking(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const resetPool = () => {
    setPool(students);
    setLastPicked(null);
    setHistory([]);
  };

  // Grouping Logic
  const generateGroupsAction = () => {
    if (students.length === 0) return;

    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const groups: Group[] = [];

    for (let i = 0; i < shuffled.length; i += groupSize) {
      groups.push({
        id: Math.floor(i / groupSize) + 1,
        members: shuffled.slice(i, i + groupSize)
      });
    }
    setGeneratedGroups(groups);
  };

  const downloadGroupsCSV = () => {
    if (generatedGroups.length === 0) return;

    // Create CSV header
    let csvContent = "小组编号,学生姓名,学号\n";

    // Add group members
    generatedGroups.forEach(group => {
      group.members.forEach(member => {
        csvContent += `${group.id},${member.name},${member.studentId || ''}\n`;
      });
    });

    // Add BOM for Excel compatibility with Chinese characters
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `分组结果_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-indigo-900 text-white p-6 flex flex-col gap-4 sticky top-0 md:h-screen z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">SmartClass</h1>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setView(ViewMode.ROSTER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === ViewMode.ROSTER ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">学生名册</span>
          </button>
          <button
            onClick={() => setView(ViewMode.PICKER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === ViewMode.PICKER ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">随机点名</span>
          </button>
          <button
            onClick={() => setView(ViewMode.GROUPER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === ViewMode.GROUPER ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
          >
            <Layers className="w-5 h-5" />
            <span className="font-medium">自动分组</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-indigo-800 text-xs text-indigo-300">
          <p>当前学生总数: <span className="text-white font-bold">{students.length}</span></p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Header Information */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              {view === ViewMode.ROSTER && "管理名单"}
              {view === ViewMode.PICKER && "课堂随机点名"}
              {view === ViewMode.GROUPER && "智能自动分组"}
            </h2>
            <p className="text-slate-500 mt-1">
              {view === ViewMode.ROSTER && "上传CSV或Excel表格、手动输入学生姓名"}
              {view === ViewMode.PICKER && "随机挑选学生回答问题"}
              {view === ViewMode.GROUPER && "快速为班级学生分配小组并导出结果"}
            </p>
          </div>

          {students.length === 0 && view !== ViewMode.ROSTER && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">请先在名册页面上传名单</span>
            </div>
          )}
        </header>

        {/* Dynamic Views */}
        <div className="space-y-6">

          {/* VIEW: ROSTER */}
          {view === ViewMode.ROSTER && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    批量导入
                  </h3>
                  <label 
                    className="block w-full cursor-pointer"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className={`border-2 border-dashed transition-all rounded-xl p-8 text-center ${isDragging ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                      <div className="pointer-events-none">
                        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <p className="text-sm font-medium text-slate-600">
                          {isDragging ? "松手将其上传" : "点击或拖拽 CSV / Excel 文件至此处"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">支持常见表格格式 (.csv, .xlsx, .xls)</p>
                      </div>
                      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                    </div>
                  </label>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-semibold mb-4">手动新增</h3>
                  <form onSubmit={handleManualInput} className="space-y-4">
                    <textarea
                      name="studentNames"
                      placeholder="每行一个姓名，例如：&#10;王小明&#10;李大华"
                      rows={5}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                    <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-xl hover:bg-slate-700 transition-colors">
                      新增至名单
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold">当前学生列表 ({students.length})</h3>
                  <button
                    onClick={() => { if (confirm("确定要清空名单吗？")) { setStudents([]); setPool([]); } }}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {students.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      尚未导入任何学生
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                        <tr>
                          <th className="px-6 py-3 font-semibold">姓名</th>
                          <th className="px-6 py-3 font-semibold">学号</th>
                          <th className="px-6 py-3 font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium">{s.name}</td>
                            <td className="px-6 py-4 text-slate-500">{s.studentId || '-'}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setStudents(prev => prev.filter(item => item.id !== s.id))}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PICKER */}
          {view === ViewMode.PICKER && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />

                  <div className="mb-8">
                    <h3 className="text-slate-400 font-medium mb-2">点名结果</h3>
                    <div className="h-40 flex items-center justify-center">
                      {isPicking ? (
                        <div className="flex flex-col items-center gap-4">
                          <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                          <p className="text-indigo-600 font-bold animate-pulse text-xl">挑选中...</p>
                        </div>
                      ) : lastPicked ? (
                        <div className="space-y-2">
                          <p className="text-6xl font-black text-slate-800 tracking-tight">{lastPicked.name}</p>
                          <p className="text-slate-400">{lastPicked.studentId}</p>
                        </div>
                      ) : (
                        <p className="text-slate-300 text-2xl font-light">点击下方按钮开始</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setRepeatMode('no-repeat')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${repeatMode === 'no-repeat' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                      >
                        不重复抽取
                      </button>
                      <button
                        onClick={() => setRepeatMode('repeat')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${repeatMode === 'repeat' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                      >
                        重复抽取
                      </button>
                    </div>
                    <button
                      onClick={resetPool}
                      className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" /> 重置名单
                    </button>
                  </div>

                  <button
                    disabled={students.length === 0 || isPicking}
                    onClick={pickStudent}
                    className="w-full max-w-md mx-auto bg-indigo-600 text-white text-xl font-bold py-6 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    随机抽取一位学生
                  </button>
                </div>

                {/* Student Visual Tracker */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" />
                      名单状态
                    </h3>
                    <div className="flex gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-slate-600">待抽取 ({pool.length})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                        <span className="text-slate-400">已抽取 ({students.length - pool.length})</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {students.map(student => {
                      const isAvailable = pool.some(p => p.id === student.id);
                      return (
                        <div
                          key={student.id}
                          className={`
                            px-2 py-3 rounded-xl text-center text-base font-semibold transition-all duration-300
                            ${isAvailable
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                              : 'bg-slate-50 text-slate-300 border border-slate-100 opacity-50 grayscale'
                            }
                          `}
                          title={student.name}
                        >
                          {student.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Picking History Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-full">
                  <h3 className="font-bold flex items-center gap-2 mb-6">
                    <History className="w-5 h-5 text-slate-400" />
                    点名纪录
                  </h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                      <p className="text-slate-400 text-sm italic">尚无纪录</p>
                    ) : (
                      history.map((item, idx) => (
                        <div key={item.timestamp} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`mt-1 w-2 h-2 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                          <div>
                            <p className="font-semibold text-slate-800">{item.studentName}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(item.timestamp).toLocaleTimeString()} · {item.mode === 'repeat' ? '可重复' : '不可重复'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GROUPER */}
          {view === ViewMode.GROUPER && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-semibold text-slate-600">每组人数</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="2"
                        max="10"
                        value={groupSize}
                        onChange={(e) => setGroupSize(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-600"
                      />
                      <span className="w-12 text-center font-bold text-indigo-600 bg-indigo-50 py-1 rounded-lg border border-indigo-100">
                        {groupSize}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={generateGroupsAction}
                      disabled={students.length === 0}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                      开始随机分组
                    </button>
                    {generatedGroups.length > 0 && (
                      <button
                        onClick={downloadGroupsCSV}
                        className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        下载 CSV
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {generatedGroups.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedGroups.map(group => (
                    <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:border-indigo-300 transition-colors">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-700">小组 {group.id}</span>
                        <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100">
                          {group.members.length} 位成员
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        {group.members.map(member => (
                          <div key={member.id} className="flex items-center gap-3 p-1">
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span className="font-semibold text-lg text-slate-800">{member.name}</span>
                            <span className="text-xs text-slate-400 ml-auto">{member.studentId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
