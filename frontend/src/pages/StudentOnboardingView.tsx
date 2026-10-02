import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Mail,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Info,
  KeyRound,
  Trash2,
  Edit2,
  X,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Check,
  Zap
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import {
  checkBatchDuplicatesApi,
  batchProvisionStudentsApi,
  getAdminRegistrationSettingApi,
  updateAdminRegistrationSettingApi,
  getOnboardingConfigApi,
  ExistingUserDetail,
  StudentProvisionItem
} from '../lib/api';

export type CanonicalDept = 'CSE' | 'ECE' | 'IT';

export interface DepartmentOption {
  code: CanonicalDept;
  label: string;
}

export const SUPPORTED_DEPTS: DepartmentOption[] = [
  { code: 'CSE', label: 'Computer Science (CSE)' },
  { code: 'ECE', label: 'Electronics & Communication (ECE)' },
  { code: 'IT',  label: 'Information Technology (IT)' },
];

export const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export interface ReviewRow {
  id: string;
  name: string;
  email: string;
  dept: CanonicalDept;
  year: string;
  status: 'NEW' | 'DUPLICATE_EXISTING' | 'DUPLICATE_BATCH' | 'INVALID';
  invalidReason?: string;
  duplicateExistingData?: ExistingUserDetail;
}

interface StudentOnboardingViewProps {
  onUserCreated?: () => void;
}

function resolveDeptCode(val: string): CanonicalDept {
  const upper = (val || '').trim().toUpperCase();
  if (upper.includes('ELECTRONIC') || upper.includes('ECE') || upper === 'EC') return 'ECE';
  if (upper.includes('INFO') || upper.includes('IT')) return 'IT';
  return 'CSE';
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const StudentOnboardingView: React.FC<StudentOnboardingViewProps> = React.memo(({ onUserCreated }) => {
  // Configured Initial Student Password
  const [initialPassword, setInitialPassword] = useState('impulse@login');

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

    getOnboardingConfigApi()
      .then(cfg => {
        if (isMounted && cfg.initialPassword) {
          setInitialPassword(cfg.initialPassword);
        }
      })
      .catch(() => {});

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

  // ── CARD 1: Direct Email Batch States ──────────────────────────────────────
  const [emailYear, setEmailYear] = useState('4th Year');
  const [emailDeptCode, setEmailDeptCode] = useState<CanonicalDept>('CSE');
  const [nameRawInput, setNameRawInput] = useState('');
  const [emailRawInput, setEmailRawInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // ── CARD 2: CSV Upload States ──────────────────────────────────────────────
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCSVRows, setParsedCSVRows] = useState<Array<{ name: string; email: string; dept: CanonicalDept; year: string }>>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvParseSuccessMsg, setCsvParseSuccessMsg] = useState<string | null>(null);

  // ── REVIEW / VERIFICATION POPUP STATES ─────────────────────────────────────
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{
    success: boolean;
    title: string;
    message: string;
    createdCount: number;
    skippedCount: number;
    failedCount: number;
    failedItems?: Array<{ email: string; name?: string; reason: string }>;
  } | null>(null);

  // Sub-modal: Edit Row
  const [editingRow, setEditingRow] = useState<ReviewRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState<CanonicalDept>('CSE');
  const [editYear, setEditYear] = useState('4th Year');

  // Sub-modal: Resolve Existing DB Duplicate
  const [resolvingExistingRow, setResolvingExistingRow] = useState<ReviewRow | null>(null);

  // Sub-modal: Resolve Intra-Batch Duplicate
  const [resolvingBatchEmail, setResolvingBatchEmail] = useState<string | null>(null);

  // Lock background page scroll while any review/edit modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(reviewModalOpen || editingRow || resolvingExistingRow || resolvingBatchEmail);
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [reviewModalOpen, editingRow, resolvingExistingRow, resolvingBatchEmail]);

  // ── RE-EVALUATE AND CLASSIFY BATCH ROWS ────────────────────────────────────
  const evaluateRowsWithDatabase = useCallback(async (rows: Array<Omit<ReviewRow, 'status' | 'invalidReason' | 'duplicateExistingData'>>): Promise<ReviewRow[]> => {
    setIsEvaluatingBatch(true);
    const emailsToCheck = rows.map(r => normalizeEmail(r.email)).filter(e => e.length > 0 && isValidEmail(e));

    let existingDbMap: Record<string, ExistingUserDetail> = {};
    if (emailsToCheck.length > 0) {
      try {
        const checkRes = await checkBatchDuplicatesApi(emailsToCheck);
        existingDbMap = checkRes.existing || {};
        if (checkRes.initialPassword) {
          setInitialPassword(checkRes.initialPassword);
        }
      } catch (err) {
        console.warn('Failed to pre-check existing accounts with DB:', err);
      }
    }

    // Count intra-batch occurrences
    const emailCounts: Record<string, number> = {};
    for (const r of rows) {
      const em = normalizeEmail(r.email);
      if (em) {
        emailCounts[em] = (emailCounts[em] || 0) + 1;
      }
    }

    const evaluated: ReviewRow[] = rows.map(r => {
      const cleanName = (r.name || '').trim();
      const cleanEmail = normalizeEmail(r.email);

      // 1. Validation checks
      if (!cleanName) {
        return {
          ...r,
          status: 'INVALID',
          invalidReason: 'Missing student full name.',
        };
      }
      if (!cleanEmail || !isValidEmail(cleanEmail)) {
        return {
          ...r,
          status: 'INVALID',
          invalidReason: 'Invalid email address format.',
        };
      }
      if (!['CSE', 'ECE', 'IT'].includes(r.dept)) {
        return {
          ...r,
          status: 'INVALID',
          invalidReason: 'Invalid department: must be CSE, ECE, or IT.',
        };
      }

      // 2. Intra-batch duplicate check
      if ((emailCounts[cleanEmail] || 0) > 1) {
        return {
          ...r,
          status: 'DUPLICATE_BATCH',
          invalidReason: 'Duplicate email within this batch.',
        };
      }

      // 3. Database duplicate check
      if (existingDbMap[cleanEmail]) {
        return {
          ...r,
          status: 'DUPLICATE_EXISTING',
          invalidReason: 'Account already exists in database.',
          duplicateExistingData: existingDbMap[cleanEmail],
        };
      }

      // 4. Genuine new student
      return {
        ...r,
        status: 'NEW',
      };
    });

    setIsEvaluatingBatch(false);
    return evaluated;
  }, []);

  // ── TRIGGER DIRECT EMAIL BATCH REVIEW ──────────────────────────────────────
  const handleReviewEmailBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setProvisionResult(null);

    const emailList = emailRawInput
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (emailList.length === 0) {
      setEmailError('Please enter at least one valid student email address.');
      return;
    }

    const nameList = nameRawInput
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (nameList.length === 0) {
      setEmailError('Student full names are required. Please provide a full name corresponding to each email.');
      return;
    }

    if (nameList.length !== emailList.length) {
      setEmailError(
        `The number of student names (${nameList.length}) does not match the number of emails (${emailList.length}). Every email must correspond to a full name.`
      );
      return;
    }

    const rawRows = emailList.map((email, idx) => ({
      id: `email_row_${Date.now()}_${idx}`,
      name: nameList[idx],
      email: normalizeEmail(email),
      dept: emailDeptCode,
      year: emailYear,
    }));

    const evaluated = await evaluateRowsWithDatabase(rawRows);
    setReviewRows(evaluated);
    setReviewModalOpen(true);
  };

  // ── CSV PARSER ─────────────────────────────────────────────────────────────
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

    // Required headers: Name, email id, dept, year (password is NO LONGER required)
    const hasName = lowerHeaders.some(h => h === 'name' || h === 'full name' || h === 'student name');
    const hasEmail = lowerHeaders.some(h => h === 'email id' || h === 'email_id' || h === 'email');
    const hasDept = lowerHeaders.some(h => h === 'dept' || h === 'department' || h === 'branch');
    const hasYear = lowerHeaders.some(h => h === 'year' || h === 'year of study');

    const missingHeaders: string[] = [];
    if (!hasName) missingHeaders.push('Name');
    if (!hasEmail) missingHeaders.push('email id');
    if (!hasDept) missingHeaders.push('dept');
    if (!hasYear) missingHeaders.push('year');

    if (missingHeaders.length > 0) {
      throw new Error(
        `CSV headers do not match. Missing required header(s): ${missingHeaders.join(', ')}. The CSV MUST contain: Name, email id, dept, year.`
      );
    }

    const nameIdx = lowerHeaders.findIndex(h => h === 'name' || h === 'full name' || h === 'student name');
    const emailIdx = lowerHeaders.findIndex(h => h === 'email id' || h === 'email_id' || h === 'email');
    const deptIdx = lowerHeaders.findIndex(h => h === 'dept' || h === 'department' || h === 'branch');
    const yearIdx = lowerHeaders.findIndex(h => h === 'year' || h === 'year of study');

    const parsed: Array<{ name: string; email: string; dept: CanonicalDept; year: string }> = [];

    for (let r = 1; r < lines.length; r++) {
      const rowVals = parseLine(lines[r]);
      if (rowVals.length === 0 || (rowVals.length === 1 && !rowVals[0])) continue;

      const nameVal = (rowVals[nameIdx] || '').trim();
      const emailVal = normalizeEmail(rowVals[emailIdx] || '');
      const deptRaw = (rowVals[deptIdx] || '').trim();
      const canonicalDept = resolveDeptCode(deptRaw);

      let yearVal = (rowVals[yearIdx] || '').trim();
      if (yearVal === '1' || yearVal.toLowerCase().includes('1')) yearVal = '1st Year';
      else if (yearVal === '2' || yearVal.toLowerCase().includes('2')) yearVal = '2nd Year';
      else if (yearVal === '3' || yearVal.toLowerCase().includes('3')) yearVal = '3rd Year';
      else yearVal = '4th Year';

      parsed.push({
        name: nameVal,
        email: emailVal,
        dept: canonicalDept,
        year: yearVal,
      });
    }

    if (parsed.length === 0) {
      throw new Error('No valid student data rows found in the CSV spreadsheet.');
    }

    return parsed;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    setCsvParseSuccessMsg(null);
    setProvisionResult(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Please select a valid .csv spreadsheet file.');
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target?.result as string;
        const rows = parseCSVText(text);
        setParsedCSVRows(rows);
        setCsvParseSuccessMsg(`Ready: Loaded ${rows.length} student row(s) from "${file.name}". Click "Review CSV Batch" to review.`);
      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV spreadsheet.');
        setParsedCSVRows([]);
      }
    };
    reader.onerror = () => {
      setCsvError('Failed to read the selected file.');
      setParsedCSVRows([]);
    };
    reader.readAsText(file);
  };

  // ── TRIGGER CSV BATCH REVIEW ───────────────────────────────────────────────
  const handleReviewCSVBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsvError(null);
    setProvisionResult(null);

    if (parsedCSVRows.length === 0) {
      setCsvError('Please upload and parse a valid CSV file first.');
      return;
    }

    const rawRows = parsedCSVRows.map((r, idx) => ({
      id: `csv_row_${Date.now()}_${idx}`,
      name: r.name,
      email: r.email,
      dept: r.dept,
      year: r.year,
    }));

    const evaluated = await evaluateRowsWithDatabase(rawRows);
    setReviewRows(evaluated);
    setReviewModalOpen(true);
  };

  // ── ROW ACTIONS IN REVIEW MODAL ────────────────────────────────────────────
  const handleRemoveRow = useCallback((id: string) => {
    setReviewRows(prev => {
      const remaining = prev.filter(r => r.id !== id);

      const counts: Record<string, number> = {};
      for (const r of remaining) {
        const em = normalizeEmail(r.email);
        if (em) counts[em] = (counts[em] || 0) + 1;
      }

      return remaining.map(r => {
        const em = normalizeEmail(r.email);
        if (r.status === 'DUPLICATE_BATCH' && (counts[em] || 0) <= 1) {
          if (r.duplicateExistingData) {
            return {
              ...r,
              status: 'DUPLICATE_EXISTING' as const,
              invalidReason: 'Account already exists in database.',
            };
          }
          const cleanName = (r.name || '').trim();
          if (!cleanName || !isValidEmail(em) || !['CSE', 'ECE', 'IT'].includes(r.dept)) {
            return {
              ...r,
              status: 'INVALID' as const,
              invalidReason: !cleanName ? 'Missing student full name.' : !isValidEmail(em) ? 'Invalid email format.' : 'Invalid department.',
            };
          }
          return {
            ...r,
            status: 'NEW' as const,
            invalidReason: undefined,
          };
        }
        return r;
      });
    });
  }, []);

  const handleOpenEditRow = (row: ReviewRow) => {
    setEditingRow(row);
    setEditName(row.name);
    setEditEmail(row.email);
    setEditDept(row.dept);
    setEditYear(row.year);
  };

  const handleSaveEditRow = async () => {
    if (!editingRow) return;
    const cleanName = editName.trim();
    const cleanEmail = normalizeEmail(editEmail);
    const prevEmail = normalizeEmail(editingRow.email);

    let dupData: ExistingUserDetail | undefined = editingRow.duplicateExistingData;
    if (cleanEmail !== prevEmail && isValidEmail(cleanEmail)) {
      try {
        const checkRes = await checkBatchDuplicatesApi([cleanEmail]);
        dupData = checkRes.existing?.[cleanEmail];
      } catch (err) {
        console.warn('Failed to verify edited email with DB:', err);
      }
    }

    setEditingRow(null);

    setReviewRows(prev => {
      const updated = prev.map(r => {
        if (r.id === editingRow.id) {
          return {
            ...r,
            name: cleanName,
            email: cleanEmail,
            dept: editDept,
            year: editYear,
            duplicateExistingData: dupData,
          };
        }
        return r;
      });

      const counts: Record<string, number> = {};
      for (const r of updated) {
        const em = normalizeEmail(r.email);
        if (em) counts[em] = (counts[em] || 0) + 1;
      }

      return updated.map(r => {
        const em = normalizeEmail(r.email);
        const name = (r.name || '').trim();

        if (!name) {
          return { ...r, status: 'INVALID' as const, invalidReason: 'Missing student full name.' };
        }
        if (!em || !isValidEmail(em)) {
          return { ...r, status: 'INVALID' as const, invalidReason: 'Invalid email address format.' };
        }
        if (!['CSE', 'ECE', 'IT'].includes(r.dept)) {
          return { ...r, status: 'INVALID' as const, invalidReason: 'Invalid department: must be CSE, ECE, or IT.' };
        }
        if ((counts[em] || 0) > 1) {
          return { ...r, status: 'DUPLICATE_BATCH' as const, invalidReason: 'Duplicate email within this batch.' };
        }
        if (r.duplicateExistingData) {
          return { ...r, status: 'DUPLICATE_EXISTING' as const, invalidReason: 'Account already exists in database.' };
        }
        return { ...r, status: 'NEW' as const, invalidReason: undefined };
      });
    });
  };

  const handleKeepExistingSkipNew = (rowId: string) => {
    setResolvingExistingRow(null);
    handleRemoveRow(rowId);
  };

  const handleKeepOneIntraBatchRow = (keepId: string, duplicateEmail: string) => {
    setResolvingBatchEmail(null);
    setReviewRows(prev => {
      const remaining = prev.filter(r => normalizeEmail(r.email) !== duplicateEmail || r.id === keepId);

      const counts: Record<string, number> = {};
      for (const r of remaining) {
        const em = normalizeEmail(r.email);
        if (em) counts[em] = (counts[em] || 0) + 1;
      }

      return remaining.map(r => {
        const em = normalizeEmail(r.email);
        if (r.status === 'DUPLICATE_BATCH' && (counts[em] || 0) <= 1) {
          if (r.duplicateExistingData) {
            return { ...r, status: 'DUPLICATE_EXISTING' as const, invalidReason: 'Account already exists in database.' };
          }
          const cleanName = (r.name || '').trim();
          if (!cleanName || !isValidEmail(em) || !['CSE', 'ECE', 'IT'].includes(r.dept)) {
            return { ...r, status: 'INVALID' as const, invalidReason: 'Invalid student details.' };
          }
          return { ...r, status: 'NEW' as const, invalidReason: undefined };
        }
        return r;
      });
    });
  };

  // ── DYNAMIC COUNTS IN REVIEW POPUP ─────────────────────────────────────────
  const reviewCounts = useMemo(() => {
    const total = reviewRows.length;
    const newCount = reviewRows.filter(r => r.status === 'NEW').length;
    const duplicateCount = reviewRows.filter(r => r.status === 'DUPLICATE_EXISTING' || r.status === 'DUPLICATE_BATCH').length;
    const invalidCount = reviewRows.filter(r => r.status === 'INVALID').length;
    return { total, newCount, duplicateCount, invalidCount };
  }, [reviewRows]);

  // ── CONFIRM & PROVISION ────────────────────────────────────────────────────
  const handleConfirmProvision = async () => {
    const validNewRows = reviewRows.filter(r => r.status === 'NEW');
    if (validNewRows.length === 0) return;

    setIsProvisioning(true);

    const payload: StudentProvisionItem[] = validNewRows.map(r => ({
      name: r.name.trim(),
      email: normalizeEmail(r.email),
      department_code: r.dept,
      year: r.year.includes('1') ? 1 : r.year.includes('2') ? 2 : r.year.includes('3') ? 3 : 4,
    }));

    try {
      const res = await batchProvisionStudentsApi(payload);
      setReviewModalOpen(false);

      const hasFailures = (res.failedCount || 0) > 0;
      setProvisionResult({
        success: !hasFailures,
        title: hasFailures ? 'Provisioning Completed with Issues' : 'Provisioning Complete',
        message: `${res.createdCount} student account(s) created. ${res.skippedCount} existing account(s) skipped. ${reviewCounts.invalidCount} invalid row(s) skipped.`,
        createdCount: res.createdCount,
        skippedCount: res.skippedCount,
        failedCount: res.failedCount || 0,
        failedItems: res.failed || [],
      });

      // Clear source inputs
      setEmailRawInput('');
      setNameRawInput('');
      setCsvFile(null);
      setParsedCSVRows([]);
      setCsvParseSuccessMsg(null);

      onUserCreated?.();
    } catch (err: any) {
      alert(`Provisioning failed: ${err.message || 'Unknown server error'}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  const labelCls = "block text-xs font-semibold text-zinc-300 mb-1.5 font-sans";
  const inputCls = "w-full bg-[#141414] border border-white/10 hover:border-white/20 focus:border-orange-500 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 transition-all outline-none font-sans focus:ring-1 focus:ring-orange-500";

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0 font-sans pb-12">
      {/* ── TOP BANNER: STUDENT SELF-REGISTRATION TOGGLE ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mono-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            selfRegEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800/80 border-white/10 text-zinc-400'
          }`}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-sans">Student Self-Registration Portal</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                selfRegEnabled ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}>
                {selfRegEnabled ? 'OPEN' : 'RESTRICTED'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
              {selfRegEnabled
                ? 'UCEK students can independently register their accounts on the sign-in screen.'
                : 'Self-registration disabled. Student accounts can only be provisioned by Placement Administrators below.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <button
            type="button"
            disabled={isLoadingSetting || isSavingSetting}
            onClick={handleToggleSelfRegistration}
            className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer border transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
              selfRegEnabled
                ? 'bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-white/10 text-zinc-200 border-white/15 hover:bg-white/15 hover:text-white'
            }`}
          >
            {isSavingSetting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <span>{selfRegEnabled ? 'Disable Self-Registration' : 'Enable Self-Registration'}</span>
            )}
          </button>
        </div>

        {settingError && (
          <div className="w-full text-xs text-rose-400 flex items-center gap-1.5 pt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{settingError}</span>
          </div>
        )}
      </motion.div>

      {/* ── PROVISIONING RESULT FEEDBACK BANNER ── */}
      <AnimatePresence>
        {provisionResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-2xl border ${
              provisionResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {provisionResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">{provisionResult.title}</h4>
                  <p className="text-xs text-zinc-300 mt-0.5">{provisionResult.message}</p>
                  {provisionResult.failedItems && provisionResult.failedItems.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      <div className="text-[11px] font-semibold text-rose-300">Failed accounts:</div>
                      {provisionResult.failedItems.map((fi, idx) => (
                        <div key={idx} className="text-[10px] text-zinc-400 font-mono">
                          • {fi.name || 'Student'} ({fi.email}): {fi.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProvisionResult(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TWO SIDE-BY-SIDE PROVISIONING CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-20">

        {/* ── CARD 1: Direct Email Batch Provisioning ── */}
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
                  <h2 className="text-base font-bold text-white font-sans tracking-tight">Direct Email Batch Provisioning</h2>
                  <p className="text-xs text-zinc-400">Paste student names and email addresses to review &amp; provision</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleReviewEmailBatch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Year of Study</label>
                  <CustomSelect
                    value={emailYear}
                    onChange={setEmailYear}
                    options={YEAR_OPTIONS}
                  />
                </div>
                <div>
                  <label className={labelCls}>Department / Branch</label>
                  <CustomSelect
                    value={SUPPORTED_DEPTS.find(d => d.code === emailDeptCode)?.label || 'Computer Science (CSE)'}
                    onChange={labelVal => {
                      const match = SUPPORTED_DEPTS.find(d => d.label === labelVal);
                      if (match) setEmailDeptCode(match.code);
                    }}
                    options={SUPPORTED_DEPTS.map(d => d.label)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Student Full Names <span className="text-orange-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={nameRawInput}
                    onChange={e => setNameRawInput(e.target.value)}
                    placeholder="Arun Kumar&#10;Rahul Raj&#10;Anu S"
                    className={`${inputCls} resize-none leading-relaxed font-sans text-xs`}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Required. One per line. Matches email order.</p>
                </div>
                <div>
                  <label className={labelCls}>
                    Student Email Addresses <span className="text-orange-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={emailRawInput}
                    onChange={e => setEmailRawInput(e.target.value)}
                    placeholder="arun@gmail.com&#10;rahul@gmail.com&#10;anu@gmail.com"
                    className={`${inputCls} resize-none leading-relaxed font-mono text-xs`}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Required. One per line. Matches name order.</p>
                </div>
              </div>

              {/* Initial Password Box */}
              <div className="p-3 rounded-2xl px-4 bg-[#0d0d0d] border border-white/10 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <div>
                    <span className="text-xs text-zinc-300 font-semibold block">Initial Password:</span>
                    <span className="text-[10px] text-zinc-500">Students must change this password when they first sign in.</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 text-xs shrink-0">
                  {initialPassword}
                </span>
              </div>

              {emailError && (
                <div className="p-3 rounded-2xl px-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isEvaluatingBatch}
                className="btn-primary w-full py-2.5 px-6 rounded-full text-xs font-bold text-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-sans"
              >
                {isEvaluatingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Validating Batch...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-black" />
                    <span>Review Batch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* ── CARD 2: CSV Spreadsheet Upload & Validation ── */}
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
                  <h2 className="text-base font-bold text-white font-sans tracking-tight">CSV Spreadsheet Upload &amp; Validation</h2>
                  <p className="text-xs text-zinc-400">Upload bulk student CSV spreadsheet files with validation</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleReviewCSVBatch} className="space-y-4">
              <div className="p-3.5 px-4 rounded-2xl bg-[#0d0d0d] border border-white/10 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Strict CSV Spreadsheet Specification</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400">
                  <div>
                    <span className="text-zinc-500 block">Required CSV Headers:</span>
                    <span className="font-mono text-zinc-200 font-semibold">Name, email id, dept, year</span>
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
                <div className="p-3 rounded-2xl px-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="leading-relaxed">{csvError}</span>
                </div>
              )}

              {csvParseSuccessMsg && (
                <div className="p-3 rounded-2xl px-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{csvParseSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={parsedCSVRows.length === 0 || isEvaluatingBatch}
                className="btn-primary w-full py-2.5 px-6 rounded-full text-xs font-bold text-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-sans"
              >
                {isEvaluatingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Validating CSV Batch...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-black" />
                    <span>Review CSV Batch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* ── VERIFICATION & REVIEW POPUP MODAL (PORTALED TO DOCUMENT.BODY) ── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {reviewModalOpen && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden font-sans"
                data-lenis-prevent="true"
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isProvisioning) {
                    setReviewModalOpen(false);
                  }
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-4xl max-h-[min(88dvh,820px)] bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl flex flex-col min-h-0 overflow-hidden font-sans text-white my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header — Fixed at Top */}
                  <div className="p-5 sm:p-6 pb-4 border-b border-white/10 shrink-0 bg-[#0d0d0d] space-y-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 shadow-inner">
                          <UserPlus className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight">
                            Review Student Provisioning
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-400">
                            <span>Initial Password:</span>
                            <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20 text-xs">
                              {initialPassword}
                            </span>
                            <span className="text-[11px] text-zinc-500">• Students must change on first sign-in</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setReviewModalOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dynamic Counts Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5 text-xs">
                      <div className="font-medium text-zinc-300">
                        <strong className="text-white font-bold">{reviewCounts.total}</strong> Students in Batch
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                          <Check className="w-3 h-3" />
                          <span>{reviewCounts.newCount} New</span>
                        </span>
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{reviewCounts.duplicateCount} Duplicate</span>
                        </span>
                        <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>{reviewCounts.invalidCount} Invalid</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Student List Body — Strictly constrained & protected from parent capture */}
                  <div
                    className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-2.5"
                    data-lenis-prevent="true"
                  >
                    {isEvaluatingBatch ? (
                      <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                        <span className="text-xs">Checking accounts against database...</span>
                      </div>
                    ) : reviewRows.length === 0 ? (
                      <div className="py-16 text-center text-zinc-500 text-xs">
                        No student rows in batch.
                      </div>
                    ) : (
                      reviewRows.map((row, idx) => (
                        <div
                          key={row.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            row.status === 'NEW'
                              ? 'bg-[#121214] hover:bg-[#161619] border-white/10'
                              : row.status === 'DUPLICATE_EXISTING' || row.status === 'DUPLICATE_BATCH'
                              ? 'bg-amber-500/[0.04] border-amber-500/30'
                              : 'bg-rose-500/[0.04] border-rose-500/30'
                          }`}
                        >
                          {/* Left: Row Details */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#1e1e24] border border-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {row.name ? row.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-white truncate text-xs sm:text-sm font-heading">
                                  {row.name || <span className="text-rose-400 italic">Missing Name</span>}
                                </h4>
                                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#18181b] border border-white/10 text-zinc-300">
                                  {row.dept} • {row.year}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 font-mono truncate">
                                {row.email}
                              </p>

                              {/* Status Badge & Reason */}
                              <div className="pt-0.5">
                                {row.status === 'NEW' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                    <Check className="w-3 h-3" />
                                    <span>Ready to Provision</span>
                                  </span>
                                )}
                                {row.status === 'DUPLICATE_EXISTING' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Duplicate: Already in Database</span>
                                  </span>
                                )}
                                {row.status === 'DUPLICATE_BATCH' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Duplicate: Repeated in Batch</span>
                                  </span>
                                )}
                                {row.status === 'INVALID' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Invalid: {row.invalidReason}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {row.status === 'DUPLICATE_EXISTING' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResolvingExistingRow(row);
                                }}
                                className="px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs cursor-pointer transition-all active:scale-95"
                              >
                                Resolve
                              </button>
                            )}

                            {row.status === 'DUPLICATE_BATCH' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResolvingBatchEmail(normalizeEmail(row.email));
                                }}
                                className="px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs cursor-pointer transition-all active:scale-95"
                              >
                                Resolve
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditRow(row);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title="Edit Row"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveRow(row.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title="Remove Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Modal Footer — Fixed at Bottom */}
                  <div className="p-4 sm:px-6 sm:py-4 border-t border-white/10 bg-[#0d0d0d] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-zinc-400">
                      {reviewCounts.newCount > 0 ? (
                        <span>
                          <strong className="text-white font-bold">{reviewCounts.newCount}</strong> new student{reviewCounts.newCount === 1 ? '' : 's'} ready for provisioning
                        </span>
                      ) : reviewCounts.total > 0 ? (
                        <span className="text-amber-400 font-medium">
                          No new students ready for provisioning. Resolve duplicates or edit invalid rows.
                        </span>
                      ) : (
                        <span>No students loaded.</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setReviewModalOpen(false)}
                        disabled={isProvisioning}
                        className="px-5 py-2.5 rounded-full bg-[#2a2e2f] hover:bg-[#34383a] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer w-full sm:w-auto transition-colors disabled:opacity-40"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={reviewCounts.newCount === 0 || isProvisioning || isEvaluatingBatch}
                        onClick={handleConfirmProvision}
                        className="btn-primary w-full sm:w-auto py-2.5 px-6 rounded-full text-xs font-bold text-black flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title={reviewCounts.newCount === 0 ? "No valid new students to provision" : undefined}
                      >
                        {isProvisioning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                            <span>Provisioning Accounts...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm &amp; Provision {reviewCounts.newCount} Student{reviewCounts.newCount === 1 ? '' : 's'}</span>
                            <ArrowRight className="w-4 h-4 text-black" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ── SUB-MODAL: EDIT ROW (PORTALED TO DOCUMENT.BODY) ── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {editingRow && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden font-sans"
                data-lenis-prevent="true"
                onClick={() => setEditingRow(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 font-sans text-white my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-heading">Edit Student Row</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingRow(null)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Student Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Arun Kumar"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Student Email Address</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        className={inputCls}
                        placeholder="e.g. arun@gmail.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Department</label>
                        <CustomSelect
                          value={SUPPORTED_DEPTS.find(d => d.code === editDept)?.label || 'Computer Science (CSE)'}
                          onChange={labelVal => {
                            const match = SUPPORTED_DEPTS.find(d => d.label === labelVal);
                            if (match) setEditDept(match.code);
                          }}
                          options={SUPPORTED_DEPTS.map(d => d.label)}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Year</label>
                        <CustomSelect
                          value={editYear}
                          onChange={setEditYear}
                          options={YEAR_OPTIONS}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingRow(null)}
                      className="px-4 py-2 rounded-full bg-[#2a2e2f] hover:bg-[#34383a] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditRow}
                      className="btn-primary px-5 py-2 rounded-full text-xs font-bold text-black cursor-pointer shadow-md active:scale-95"
                    >
                      Save &amp; Revalidate
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ── SUB-MODAL: RESOLVE EXISTING DB DUPLICATE (PORTALED TO DOCUMENT.BODY) ── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {resolvingExistingRow && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden font-sans"
                data-lenis-prevent="true"
                onClick={() => setResolvingExistingRow(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-lg bg-[#0d0d0d] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 font-sans text-white my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5 text-amber-400">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-heading">Existing Account Duplicate</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResolvingExistingRow(null)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    An account with email <strong className="text-white font-mono">{resolvingExistingRow.email}</strong> is already registered. Existing accounts are <strong className="text-white">never overwritten</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Existing Account Box */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Existing in Database</span>
                      <div className="font-bold text-white font-heading">{resolvingExistingRow.duplicateExistingData?.name || 'Existing Student'}</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">{resolvingExistingRow.duplicateExistingData?.email}</div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        {resolvingExistingRow.duplicateExistingData?.department} • {resolvingExistingRow.duplicateExistingData?.year}
                      </div>
                    </div>

                    {/* New Row Box */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                      <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider block">New Batch Row</span>
                      <div className="font-bold text-white font-heading">{resolvingExistingRow.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">{resolvingExistingRow.email}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {resolvingExistingRow.dept} • {resolvingExistingRow.year}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const rowToEdit = resolvingExistingRow;
                        setResolvingExistingRow(null);
                        handleOpenEditRow(rowToEdit);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#2a2e2f] hover:bg-[#34383a] border border-white/10 text-zinc-200 font-semibold cursor-pointer transition-colors"
                    >
                      Edit New Row
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeepExistingSkipNew(resolvingExistingRow.id)}
                      className="btn-primary w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-black cursor-pointer shadow-md active:scale-95"
                    >
                      Keep Existing &amp; Skip New
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ── SUB-MODAL: RESOLVE INTRA-BATCH DUPLICATE (PORTALED TO DOCUMENT.BODY) ── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {resolvingBatchEmail && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden font-sans"
                data-lenis-prevent="true"
                onClick={() => setResolvingBatchEmail(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-lg bg-[#0d0d0d] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 font-sans text-white my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5 text-amber-400">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-heading">Duplicate Email Within Batch</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResolvingBatchEmail(null)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    The email <strong className="text-white font-mono">{resolvingBatchEmail}</strong> appears multiple times in your batch. Only one row can be provisioned:
                  </p>

                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1" data-lenis-prevent="true">
                    {reviewRows
                      .filter(r => normalizeEmail(r.email) === resolvingBatchEmail)
                      .map((r, idx) => (
                        <div
                          key={r.id}
                          className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white font-heading">Row #{idx + 1}: {r.name}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">{r.email}</div>
                            <div className="text-[10px] text-zinc-500">{r.dept} • {r.year}</div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingBatchEmail(null);
                                handleOpenEditRow(r);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs border border-white/10 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleKeepOneIntraBatchRow(r.id, resolvingBatchEmail)}
                              className="btn-primary px-3.5 py-1.5 rounded-lg font-bold text-black text-xs cursor-pointer active:scale-95"
                            >
                              Keep This Row
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
});

export default StudentOnboardingView;
