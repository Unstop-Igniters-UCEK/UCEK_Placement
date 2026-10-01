import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Zap,
  Mail,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Info,
  KeyRound
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { batchCreateUsers, batchCSVCreateUsers, getAdminRegistrationSettingApi, updateAdminRegistrationSettingApi } from '../lib/api';

interface CSVRowParsed {
  Name?: string;
  email_id: string;
  password?: string;
  dept: string;
  year?: string;
}

interface StudentOnboardingViewProps {
  onUserCreated?: () => void;
}

const SUPPORTED_DEPTS = [
  'Computer Science (CSE)',
  'Electronics & Comm (ECE)',
  'Information Technology (IT)',
];

export const StudentOnboardingView: React.FC<StudentOnboardingViewProps> = React.memo(({ onUserCreated }) => {
  // Student Self-Registration Toggle States
  const [selfRegEnabled, setSelfRegEnabled] = useState<boolean>(false);
  const [isLoadingSetting, setIsLoadingSetting] = useState<boolean>(true);
  const [isSavingSetting, setIsSavingSetting] = useState<boolean>(false);
  const [settingError, setSettingError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAdminRegistrationSettingApi()
      .then(res => {
        if (isMounted) {
          setSelfRegEnabled(Boolean(res?.student_self_registration_enabled));
          setIsLoadingSetting(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Failed to load student self-registration setting:', err);
          setIsLoadingSetting(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleSelfRegistration = async () => {
    if (isSavingSetting) return;
    const nextVal = !selfRegEnabled;
    setIsSavingSetting(true);
    setSettingError(null);
    try {
      const res = await updateAdminRegistrationSettingApi(nextVal);
      setSelfRegEnabled(Boolean(res?.student_self_registration_enabled));
    } catch (err: any) {
      setSettingError(err.message || 'Failed to update setting');
    } finally {
      setIsSavingSetting(false);
    }
  };

  // CARD 1: Direct Email Batch States
  const [emailYear, setEmailYear] = useState('4th Year');
  const [emailBranch, setEmailBranch] = useState(SUPPORTED_DEPTS[0]);
  const [emailRawInput, setEmailRawInput] = useState('');
  const [nameRawInput, setNameRawInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<{ createdCount: number; skippedCount: number; defaultPassword: string } | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // CARD 2: CSV Upload States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCSVRows, setParsedCSVRows] = useState<CSVRowParsed[]>([]);
  const [csvParseSuccessMsg, setCsvParseSuccessMsg] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState<{ createdCount: number; skippedCount: number } | null>(null);

  // Derive default password preview helper
  const getHelperDefaultPassword = (branch: string, year: string) => {
    let code = 'CSE';
    const bUpper = branch.toUpperCase();
    if (bUpper.includes('ELECTRONIC') || bUpper.includes('ECE') || bUpper.includes('EC')) code = 'ECE';
    else if (bUpper.includes('INFO') || bUpper.includes('IT')) code = 'IT';

    let yr = '2026';
    if (year.includes('4')) yr = '2026';
    else if (year.includes('3')) yr = '2027';
    else if (year.includes('2')) yr = '2028';
    else if (year.includes('1')) yr = '2029';

    return `${code}@${yr}`;
  };

  const handleEmailBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const emailList = emailRawInput
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (emailList.length === 0) {
      setEmailError('Please enter at least one valid email address.');
      return;
    }

    const nameList = nameRawInput
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Build email -> name mapping
    const namesMap: Record<string, string> = {};
    emailList.forEach((email, idx) => {
      if (idx < nameList.length && nameList[idx]) {
        namesMap[email] = nameList[idx];
      }
    });

    setEmailLoading(true);
    try {
      const res = await batchCreateUsers({
        emails: emailList,
        names: namesMap,
        year: emailYear,
        branch: emailBranch
      });
      setEmailSuccess({
        createdCount: res.createdCount,
        skippedCount: res.skippedCount,
        defaultPassword: res.defaultPassword
      });
      setEmailRawInput('');
      setNameRawInput('');
      onUserCreated?.();
    } catch (err: any) {
      setEmailError(err.message || 'Failed to provision student emails.');
    } finally {
      setEmailLoading(false);
    }
  };

  // CSV Parsing function supporting quotes and commas
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('The selected CSV file is empty.');
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    const lowerHeaders = rawHeaders.map(h => h.toLowerCase().trim());

    // Check required header columns
    const hasName = lowerHeaders.includes('name');
    const hasEmail = lowerHeaders.includes('email id') || lowerHeaders.includes('email_id') || lowerHeaders.includes('email');
    const hasPassword = lowerHeaders.includes('password');
    const hasDept = lowerHeaders.includes('dept') || lowerHeaders.includes('department') || lowerHeaders.includes('branch');
    const hasYear = lowerHeaders.includes('year');

    const missingHeaders: string[] = [];
    if (!hasName) missingHeaders.push('Name');
    if (!hasEmail) missingHeaders.push('email id');
    if (!hasPassword) missingHeaders.push('password');
    if (!hasDept) missingHeaders.push('dept');
    if (!hasYear) missingHeaders.push('year');

    if (missingHeaders.length > 0) {
      throw new Error(
        `CSV headers do not match. Missing required header(s): ${missingHeaders.join(', ')}. The CSV MUST contain: Name, email id, password, dept, year.`
      );
    }

    const nameIdx = lowerHeaders.findIndex(h => h === 'name');
    const emailIdx = lowerHeaders.findIndex(h => h === 'email id' || h === 'email_id' || h === 'email');
    const passIdx = lowerHeaders.findIndex(h => h === 'password');
    const deptIdx = lowerHeaders.findIndex(h => h === 'dept' || h === 'department' || h === 'branch');
    const yearIdx = lowerHeaders.findIndex(h => h === 'year');

    const parsedRows: CSVRowParsed[] = [];

    for (let r = 1; r < lines.length; r++) {
      const rowVals = parseLine(lines[r]);
      if (rowVals.length === 0 || (rowVals.length === 1 && !rowVals[0])) continue;

      const rowDept = (rowVals[deptIdx] || '').trim().toLowerCase();
      if (!['cs', 'cse', 'ec', 'ece', 'it'].includes(rowDept)) {
        throw new Error(
          `Invalid department '${rowVals[deptIdx] || ''}' at row ${r + 1}. The only allowed department values are: CSE, ECE, IT.`
        );
      }

      const emailVal = (rowVals[emailIdx] || '').trim();

      parsedRows.push({
        Name: (rowVals[nameIdx] || '').trim(),
        email_id: emailVal,
        password: (rowVals[passIdx] || '').trim(),
        dept: rowDept,
        year: (rowVals[yearIdx] || '').trim()
      });
    }

    if (parsedRows.length === 0) {
      throw new Error('No valid student data rows found in CSV file.');
    }

    return parsedRows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    setCsvParseSuccessMsg(null);
    setCsvSuccess(null);
    setParsedCSVRows([]);

    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setCsvError('Please upload a valid .csv file.');
      setCsvFile(null);
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSVText(text);
        setParsedCSVRows(rows);
        setCsvParseSuccessMsg(`CSV parsed successfully! Found ${rows.length} valid student record(s) ready for provisioning.`);
      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV file.');
        setParsedCSVRows([]);
      }
    };
    reader.readAsText(file);
  };

  const handleCSVBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedCSVRows.length === 0 || csvLoading) return;

    setCsvError(null);
    setCsvSuccess(null);
    setCsvLoading(true);

    try {
      const res = await batchCSVCreateUsers(parsedCSVRows);
      setCsvSuccess({
        createdCount: res.createdCount,
        skippedCount: res.skippedCount
      });
      setCsvFile(null);
      setParsedCSVRows([]);
      setCsvParseSuccessMsg(null);
      onUserCreated?.();
    } catch (err: any) {
      setCsvError(err.message || 'Failed to provision CSV student batch.');
    } finally {
      setCsvLoading(false);
    }
  };

  const inputCls = "w-full bg-[#141414] text-xs text-white p-3 rounded-2xl border border-white/10 outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all placeholder-zinc-500 font-sans";
  const labelCls = "block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide";

  return (
    <div className="w-full text-white font-sans max-w-7xl mx-auto space-y-6">
      {/* ── HERO HEADER (Consistent with Student Dashboard & AdminPanel) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="py-1"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono-badge rounded-full text-zinc-300 bg-white/5 border-white/10 font-medium">
                <Zap className="w-3 h-3 inline mr-1 text-amber-400" />
                Automated Credential Generation
              </span>
              <span className="text-[11px] text-zinc-600 font-medium tabular-nums hidden sm:inline">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading" style={{ letterSpacing: '-0.03em' }}>
              Student Onboarding &amp; Provisioning
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
              Batch provision new student accounts via direct email list input or CSV spreadsheets for placement drives.
            </p>
          </div>

          <div className="shrink-0">
            {/* Student Self-Registration Toggle Control */}
            <div className="flex items-center gap-4 bg-[#141414] hover:bg-[#17171a] border border-white/10 rounded-2xl p-3.5 px-4 transition-colors shadow-sm">
              <div className="text-left space-y-0.5">
                <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5 font-heading">
                  <span>Public Registration</span>
                  {isSavingSetting && <Loader2 className="w-3 h-3 animate-spin text-orange-400" />}
                </div>
                <div>
                  {isLoadingSetting ? (
                    <span className="text-[11px] text-zinc-500">Syncing status...</span>
                  ) : selfRegEnabled ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                      <span>Open &bull; Students can self-register</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                      <span>Closed &bull; Admin provisioning only</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={selfRegEnabled}
                onClick={handleToggleSelfRegistration}
                disabled={isSavingSetting || isLoadingSetting}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 disabled:opacity-40 disabled:cursor-not-allowed ${
                  selfRegEnabled ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.35)]' : 'bg-zinc-800'
                }`}
                title={selfRegEnabled ? 'Click to disable public student registration' : 'Click to enable public student registration'}
              >
                <span className="sr-only">Toggle public student registration</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    selfRegEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {settingError && (
          <div className="mt-3 p-3 rounded-full px-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{settingError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSettingError(null)}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </motion.div>

      {/* ── TWO SIDE-BY-SIDE PROVISIONING CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-20">
        {/* CARD 1: Direct Email Batch Provisioning */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="mono-card p-5 sm:p-6 space-y-5 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-heading tracking-tight">Direct Email Batch Provisioning</h2>
                  <p className="text-xs text-zinc-400">Paste multiple student email addresses to auto-create accounts</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleEmailBatchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Year of Study</label>
                  <CustomSelect
                    value={emailYear}
                    onChange={setEmailYear}
                    options={['1st Year', '2nd Year', '3rd Year', '4th Year']}
                  />
                </div>
                <div>
                  <label className={labelCls}>Department / Branch</label>
                  <CustomSelect
                    value={emailBranch}
                    onChange={setEmailBranch}
                    options={SUPPORTED_DEPTS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Student Full Names (Optional)</label>
                  <textarea
                    rows={4}
                    value={nameRawInput}
                    onChange={e => setNameRawInput(e.target.value)}
                    placeholder="John Doe, Alice Smith&#10;Bob Miller"
                    className={`${inputCls} resize-none leading-relaxed font-sans text-xs`}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">One per line/comma. Matches order of emails.</p>
                </div>
                <div>
                  <label className={labelCls}>Student Email Addresses <span className="text-orange-400">*</span></label>
                  <textarea
                    rows={4}
                    required
                    value={emailRawInput}
                    onChange={e => setEmailRawInput(e.target.value)}
                    placeholder="john.doe@college.edu, alice.smith@college.edu&#10;bob.miller@college.edu"
                    className={`${inputCls} resize-none leading-relaxed font-mono text-xs`}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Comma or newline separated student emails.</p>
                </div>
              </div>

              <div className="p-3 rounded-full px-4 bg-[#0d0d0d] border border-white/10 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-xs text-zinc-300">Default Password Format:</span>
                </div>
                <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20 text-xs">
                  {getHelperDefaultPassword(emailBranch, emailYear)}
                </span>
              </div>

              {emailError && (
                <div className="p-3 rounded-full px-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              {emailSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Email Batch Provisioning Complete!</span>
                  </div>
                  <p className="text-[11px]">
                    Successfully created <strong className="text-white">{emailSuccess.createdCount}</strong> student account(s). Skipped <strong className="text-white">{emailSuccess.skippedCount}</strong> duplicate/invalid email(s).
                  </p>
                  <div className="pt-0.5 text-[11px]">
                    Default Password: <span className="font-mono text-orange-300 font-bold">{emailSuccess.defaultPassword}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={emailLoading}
                className="btn-primary w-full py-2.5 px-6 rounded-full text-xs font-bold text-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-heading"
              >
                {emailLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Provisioning Email Batch...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-black" />
                    <span>Provision Email Batch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* CARD 2: CSV Spreadsheet Upload & Validation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05 }}
          className="mono-card p-5 sm:p-6 space-y-5 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-heading tracking-tight">CSV Spreadsheet Upload &amp; Validation</h2>
                  <p className="text-xs text-zinc-400">Upload bulk student CSV spreadsheet files with validation</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCSVBatchSubmit} className="space-y-4">
              <div className="p-3.5 px-4 rounded-2xl bg-[#0d0d0d] border border-white/10 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Strict CSV Spreadsheet Specification</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400">
                  <div>
                    <span className="text-zinc-500 block">Required CSV Headers:</span>
                    <span className="font-mono text-zinc-200 font-semibold">Name, email id, password, dept, year</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Allowed Dept Values:</span>
                    <span className="font-mono text-amber-300 font-semibold">CSE, ECE, IT</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Upload CSV File (.csv)</label>
                <div className="relative border-2 border-dashed border-white/15 hover:border-orange-500/40 rounded-2xl p-5 text-center bg-[#141414] hover:bg-[#1a1a1a] transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                    <span className="text-xs font-semibold text-zinc-300">
                      {csvFile ? csvFile.name : 'Click to select or drag .csv spreadsheet file'}
                    </span>
                    <span className="text-[10px] text-zinc-500">Only valid .csv files are supported</span>
                  </div>
                </div>
              </div>

              {csvError && (
                <div className="p-3 rounded-full px-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="leading-relaxed">{csvError}</span>
                </div>
              )}

              {csvParseSuccessMsg && (
                <div className="p-3 rounded-full px-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{csvParseSuccessMsg}</span>
                </div>
              )}

              {csvSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CSV Batch Provisioning Successful!</span>
                  </div>
                  <p className="text-[11px]">
                    Successfully created <strong className="text-white">{csvSuccess.createdCount}</strong> student account(s). Skipped <strong className="text-white">{csvSuccess.skippedCount}</strong> duplicate or invalid record(s).
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={parsedCSVRows.length === 0 || csvLoading}
                className="btn-primary w-full py-2.5 px-6 rounded-full text-xs font-bold text-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-heading"
              >
                {csvLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Uploading &amp; Provisioning CSV...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-black" />
                    <span>Upload &amp; Provision CSV</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export default StudentOnboardingView;
