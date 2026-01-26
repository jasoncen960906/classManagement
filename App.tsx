
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Layers,
  Upload,
  Download,
  History,
  RefreshCw,
  Trash2,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { Student, Group, ViewMode, PickerHistoryItem } from './types';
import { parseCSV } from './utils/csvParser';
import { generateQuestion } from './services/geminiService';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [view, setView] = useState<ViewMode>(ViewMode.ROSTER);
  const [history, setHistory] = useState<PickerHistoryItem[]>([]);

  // Picker State
  const [lastPicked, setLastPicked] = useState<Student | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'repeat' | 'no-repeat'>('no-repeat');
  const [pool, setPool] = useState<Student[]>([]);
  const [topic, setTopic] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // Grouping State
  const [groupSize, setGroupSize] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState<Group[]>([]);

  // File Upload Handler with Encoding Detection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      let text = '';

      try {
        // First try to decode as UTF-8 (strict mode)
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(buffer);
      } catch (err) {
        // If UTF-8 fails (e.g., file is GBK from Excel), fallback to GBK
        const gbkDecoder = new TextDecoder('gbk');
        text = gbkDecoder.decode(buffer);
      }

      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        setStudents(parsed);
        setPool(parsed);
        setView(ViewMode.PICKER);
      } else {
        alert("未能識別文件中的學生數據，請檢查格式。");
      }
    } catch (error) {
      console.error("File reading error:", error);
      alert("讀取文件出錯，請重試。");
    }

    // Reset input value so the same file can be uploaded again if needed
    e.target.value = '';
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
    setAiQuestion('');

    // "Drum roll" effect simulation
    let currentPool = repeatMode === 'repeat' ? students : pool;
    if (currentPool.length === 0 && repeatMode === 'no-repeat') {
      alert("所有學生都已抽過！重新重置名單。");
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

    // Auto-generate AI question if topic exists
    if (topic.trim()) {
      handleGenerateQuestion();
    }
  };

  const handleGenerateQuestion = async () => {
    if (!topic.trim()) return;
    setIsGeneratingQuestion(true);
    const q = await generateQuestion(topic);
    setAiQuestion(q || '');
    setIsGeneratingQuestion(false);
  };

  const resetPool = () => {
    setPool(students);
    setLastPicked(null);
    setHistory([]);
    setAiQuestion('');
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
    let csvContent = "小組編號,學生姓名,學號\n";

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
    link.setAttribute("download", `分組結果_${new Date().toLocaleDateString()}.csv`);
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
            <span className="font-medium">學生名冊</span>
          </button>
          <button
            onClick={() => setView(ViewMode.PICKER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === ViewMode.PICKER ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">隨機點名</span>
          </button>
          <button
            onClick={() => setView(ViewMode.GROUPER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === ViewMode.GROUPER ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
          >
            <Layers className="w-5 h-5" />
            <span className="font-medium">自動分組</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-indigo-800 text-xs text-indigo-300">
          <p>當前學生總數: <span className="text-white font-bold">{students.length}</span></p>
          <p className="mt-1">Powered by Gemini AI</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Header Information */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              {view === ViewMode.ROSTER && "管理名單"}
              {view === ViewMode.PICKER && "課堂隨機點名"}
              {view === ViewMode.GROUPER && "智能自動分組"}
            </h2>
            <p className="text-slate-500 mt-1">
              {view === ViewMode.ROSTER && "上傳CSV或手動輸入學生姓名（支持Excel導出的中文格式）"}
              {view === ViewMode.PICKER && "隨機挑選學生回答問題，支持AI出題"}
              {view === ViewMode.GROUPER && "快速為班級學生分配小組並導出結果"}
            </p>
          </div>

          {students.length === 0 && view !== ViewMode.ROSTER && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">請先在名冊頁面上傳名單</span>
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
                    批量導入
                  </h3>
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all rounded-xl p-8 text-center">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-600">選擇 CSV 文件</p>
                      <p className="text-xs text-slate-400 mt-1">自動識別 UTF-8 或 GBK 編碼</p>
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </div>
                  </label>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-semibold mb-4">手動新增</h3>
                  <form onSubmit={handleManualInput} className="space-y-4">
                    <textarea
                      name="studentNames"
                      placeholder="每行一個姓名，例如：&#10;王小明&#10;李大華"
                      rows={5}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                    <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-xl hover:bg-slate-700 transition-colors">
                      新增至名單
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold">當前學生列表 ({students.length})</h3>
                  <button
                    onClick={() => { if (confirm("確定要清空名單嗎？")) { setStudents([]); setPool([]); } }}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {students.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      尚未導入任何學生
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                        <tr>
                          <th className="px-6 py-3 font-semibold">姓名</th>
                          <th className="px-6 py-3 font-semibold">學號</th>
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
                    <h3 className="text-slate-400 font-medium mb-2">點名結果</h3>
                    <div className="h-40 flex items-center justify-center">
                      {isPicking ? (
                        <div className="flex flex-col items-center gap-4">
                          <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                          <p className="text-indigo-600 font-bold animate-pulse text-xl">挑選中...</p>
                        </div>
                      ) : lastPicked ? (
                        <div className="space-y-2">
                          <p className="text-6xl font-black text-slate-800 tracking-tight">{lastPicked.name}</p>
                          <p className="text-slate-400">{lastPicked.studentId}</p>
                        </div>
                      ) : (
                        <p className="text-slate-300 text-2xl font-light">點擊下方按鈕開始</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setRepeatMode('no-repeat')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${repeatMode === 'no-repeat' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                      >
                        不重複抽取
                      </button>
                      <button
                        onClick={() => setRepeatMode('repeat')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${repeatMode === 'repeat' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                      >
                        重複抽取
                      </button>
                    </div>
                    <button
                      onClick={resetPool}
                      className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" /> 重置名單
                    </button>
                  </div>

                  <button
                    disabled={students.length === 0 || isPicking}
                    onClick={pickStudent}
                    className="w-full max-w-md mx-auto bg-indigo-600 text-white text-xl font-bold py-6 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    隨機抽取一位學生
                  </button>
                </div>

                {/* AI Question Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-indigo-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      AI 智能挑戰題
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-indigo-400 font-medium">基於當前課題生成問題</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-6">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="輸入當前課程的主題 (例如: 總體經濟學, 行銷管理...)"
                      className="flex-1 bg-white border border-indigo-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={handleGenerateQuestion}
                      disabled={!topic.trim() || isGeneratingQuestion}
                      className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGeneratingQuestion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      生成
                    </button>
                  </div>

                  {aiQuestion && (
                    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-inner">
                      <p className="text-slate-700 leading-relaxed font-medium italic">
                        "{aiQuestion}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Picking History Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-full">
                  <h3 className="font-bold flex items-center gap-2 mb-6">
                    <History className="w-5 h-5 text-slate-400" />
                    點名紀錄
                  </h3>
                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <p className="text-slate-400 text-sm italic">尚無紀錄</p>
                    ) : (
                      history.map((item, idx) => (
                        <div key={item.timestamp} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`mt-1 w-2 h-2 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                          <div>
                            <p className="font-semibold text-slate-800">{item.studentName}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(item.timestamp).toLocaleTimeString()} · {item.mode === 'repeat' ? '可重複' : '不可重複'}
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
                    <label className="text-sm font-semibold text-slate-600">每組人數</label>
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
                      開始隨機分組
                    </button>
                    {generatedGroups.length > 0 && (
                      <button
                        onClick={downloadGroupsCSV}
                        className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        下載 CSV
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
                        <span className="font-bold text-slate-700">小組 {group.id}</span>
                        <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100">
                          {group.members.length} 位成員
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
