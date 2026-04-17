import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Calendar,
  Info
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { cn } from '../types';
import Modal from '../components/Modal';
import { accountAPI, journalAPI, chartAPI, chequeAPI, paymentVoucherAPI, bankAPI, payrollAPI, userAPI } from '../services/api';

interface AccountsViewProps {
  activeSubTab?: string;
}

const AccountsView: React.FC<AccountsViewProps> = ({ activeSubTab }) => {
  // determine which section should be visible; fall back to reconciliation if none provided
  const [currentSection, setCurrentSection] = useState<string>(activeSubTab || 'reconciliation');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState<number>(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState<number>(new Date().getFullYear());
  const [payrollPreview, setPayrollPreview] = useState<any>(null);
  const [payrollCalculating, setPayrollCalculating] = useState(false);
  const [payrollProcessing, setPayrollProcessing] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryUsers, setSalaryUsers] = useState<any[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [savingSalaries, setSavingSalaries] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [chequeForm, setChequeForm] = useState({ payee: '', amount: '', issued_date: new Date().toISOString().split('T')[0], status: 'Pending' });
  const [chartForm, setChartForm] = useState({ code: '', name: '', type: 'asset' });
  const [journalForm, setJournalForm] = useState({ description: '', debit_account: '', credit_account: '', amount: '', entry_date: new Date().toISOString().split('T')[0] });
  const [reconciliationForm, setReconciliationForm] = useState({ description: '', amount: '', type: 'income', category: 'General', date: new Date().toISOString().split('T')[0] });
  const [bankForm, setBankForm] = useState({ name: '', account_number: '', balance: '' });
  const [voucherForm, setVoucherForm] = useState({ description: '', amount: '', status: 'Pending' });
  const [payrollForm, setPayrollForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), total_amount: '', employee_count: '' });

  // sync prop changes
  useEffect(() => {
    if (activeSubTab) {
      setCurrentSection(activeSubTab);
    }
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (currentSection) {
        case 'reconciliation': {
          const response = await accountAPI.getAll(10, 0);
          const accountsData = response.data.accounts || response.data || [];
          setTransactions(accountsData.map((account: any) => ({
            title: account.description || `Transaction ${account.id}`,
            type: account.type || 'Credit',
            amount: account.type === 'income' ? `+GH₵${account.amount}` : `-GH₵${account.amount}`,
            date: account.created_at ? new Date(account.created_at).toLocaleDateString() : new Date().toLocaleString(),
            icon: account.type === 'income' ? ArrowUpRight : ArrowDownRight,
            color: account.type === 'income' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
          })));
          break;
        }
        case 'journal': {
          const response = await journalAPI.getAll(10, 0);
          console.log("Journal API Response:", response.data);
          // Extract entries more robustly
          let entries = [];
          if (Array.isArray(response.data)) {
            entries = response.data;
          } else if (response.data && typeof response.data === 'object') {
            entries = response.data.journal_entries || 
                      response.data.entries || 
                      response.data.data || 
                      (response.data.id ? [response.data] : []);
          }
          console.log("Extracted journal entries:", entries);
          setTransactions(entries);
          break;
        }
        case 'cheques': {
          const response = await chequeAPI.getAll(10, 0);
          setTransactions(response.data.cheques || response.data || []);
          break;
        }
        case 'chart': {
          const response = await chartAPI.getAll(100, 0);
          setTransactions(response.data.chart || response.data || []);
          break;
        }
        case 'vouchers': {
          const response = await paymentVoucherAPI.getAll(10, 0);
          setTransactions(response.data.vouchers || response.data || []);
          break;
        }
        case 'bank': {
          const response = await bankAPI.getAll(10, 0);
          setTransactions(response.data.banks || response.data || []);
          break;
        }
        case 'payroll': {
          const response = await payrollAPI.getAll(10, 0);
          setTransactions(response.data.payroll_runs || response.data || []);
          break;
        }
        default:
          setTransactions([]);
      }
    } catch (error: any) {
      console.error('Error fetching accounting data:', error);
      // Show user-friendly error message
      if (error.response?.status === 429) {
        alert('Too many requests. Please wait a moment and try again.');
      } else if (error.response?.status === 401) {
        alert('Session expired. Please log in again.');
      } else {
        alert('Failed to load accounting data. Please check your connection and try again.');
      }
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch different data based on the active subsection
    loadData();
  }, [currentSection]);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      switch (currentSection) {
        case 'reconciliation':
          await accountAPI.create(reconciliationForm);
          setReconciliationForm({ description: '', amount: '', type: 'income', category: 'General', date: new Date().toISOString().split('T')[0] });
          break;
        case 'journal':
          await journalAPI.create(journalForm);
          setJournalForm({ description: '', debit_account: '', credit_account: '', amount: '', entry_date: new Date().toISOString().split('T')[0] });
          break;
        case 'cheques':
          await chequeAPI.create(chequeForm);
          setChequeForm({ payee: '', amount: '', issued_date: new Date().toISOString().split('T')[0], status: 'Pending' });
          break;
        case 'chart':
          await chartAPI.create(chartForm);
          setChartForm({ code: '', name: '', type: 'debit' });
          break;
        case 'vouchers':
          await paymentVoucherAPI.create(voucherForm);
          setVoucherForm({ description: '', amount: '', status: 'Pending' });
          break;
        case 'bank':
          await bankAPI.create(bankForm);
          setBankForm({ name: '', account_number: '', balance: '' });
          break;
        case 'payroll':
          // For manual payroll entry if needed, but usually done via Calculate Payroll modal
          // For now, let's allow saving if the user uses this modal
          const { period_start, period_end } = getPeriodForMonth(Number(payrollForm.month), Number(payrollForm.year));
          await payrollAPI.process(period_start, period_end);
          setPayrollForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), total_amount: '', employee_count: '' });
          break;
      }
      alert('Record saved successfully!');
      setIsRecordModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPeriodForMonth = (month: number, year: number) => {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0); // last day of month
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { period_start: fmt(periodStart), period_end: fmt(periodEnd) };
  };

  const openPayrollModal = () => {
    setPayrollPreview(null);
    setPayrollMonth(new Date().getMonth() + 1);
    setPayrollYear(new Date().getFullYear());
    setIsPayrollModalOpen(true);
  };

  const openSalaryModal = async () => {
    setIsSalaryModalOpen(true);
    setSalaryLoading(true);
    try {
      const response = await userAPI.getAll();
      const users = response.data || [];
      setSalaryUsers(
        users.map((u: any) => ({
          ...u,
          base_salary: u.base_salary == null ? 0 : u.base_salary,
        }))
      );
    } catch (error: any) {
      console.error('Load staff salaries error:', error);
      if (error.response?.status === 403) {
        alert('You do not have permission to manage staff salaries.');
      } else {
        alert('Failed to load staff salaries. Please try again.');
      }
      setSalaryUsers([]);
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleSalaryChange = (id: number, value: string) => {
    const numeric = Number(value);
    setSalaryUsers((prev) =>
      prev.map((u: any) =>
        u.id === id ? { ...u, base_salary: isNaN(numeric) ? 0 : numeric } : u
      )
    );
  };

  const handleSaveAllSalaries = async () => {
    if (salaryUsers.length === 0) return;
    setSavingSalaries(true);
    try {
      const updates = salaryUsers.map((u: any) => ({
        id: u.id,
        base_salary: Number(u.base_salary || 0),
      }));
      await userAPI.bulkUpdateSalaries(updates);
      alert('All base salaries updated.');
    } catch (error: any) {
      console.error('Bulk update salaries error:', error);
      if (error.response?.status === 403) {
        alert('You do not have permission to update staff salaries.');
      } else {
        alert('Failed to update salaries. Please try again.');
      }
    } finally {
      setSavingSalaries(false);
    }
  };

  const exportToCsv = (filename: string, rows: any[]) => {
    if (!rows || rows.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((field) => {
            const value = row[field] ?? '';
            const str = typeof value === 'string' ? value : String(value);
            const escaped = str.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSection = () => {
    if (!transactions || transactions.length === 0) {
      alert('No data to export for this section.');
      return;
    }
    const filename = `accounts-${currentSection}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    exportToCsv(filename, transactions);
  };

  const handleExportPayrollReport = () => {
    if (!payrollPreview || !Array.isArray(payrollPreview.entries) || payrollPreview.entries.length === 0) {
      alert('No payroll preview available. Calculate payroll first.');
      return;
    }
    const rows = payrollPreview.entries.map((e: any) => ({
      Staff: e.user_name || e.user_id,
      Role: e.role || '',
      BaseSalary: Number(e.base_salary || 0).toFixed(2),
      Commission: Number(e.commission_earned || 0).toFixed(2),
      GrossPay: Number(e.gross_pay || 0).toFixed(2),
      NetPay: Number(e.net_pay || 0).toFixed(2),
    }));
    const filename = `payroll-report-${payrollMonth}-${payrollYear}.csv`;
    exportToCsv(filename, rows);
  };

  const handleCalculatePayroll = async () => {
    setPayrollCalculating(true);
    try {
      const { period_start, period_end } = getPeriodForMonth(payrollMonth, payrollYear);
      const response = await payrollAPI.calculate(period_start, period_end);
      setPayrollPreview(response.data);
    } catch (error) {
      console.error('Calculate payroll error:', error);
      alert('Failed to calculate payroll. Please try again.');
      setPayrollPreview(null);
    } finally {
      setPayrollCalculating(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!payrollPreview) return;
    setPayrollProcessing(true);
    try {
      const { period_start, period_end } = getPeriodForMonth(payrollMonth, payrollYear);
      await payrollAPI.process(period_start, period_end);
      setIsPayrollModalOpen(false);
      setPayrollPreview(null);
      // refresh payroll runs list if we’re currently on payroll section
      if (currentSection === 'payroll') {
        const refreshed = await payrollAPI.getAll(10, 0);
        setTransactions(refreshed.data || []);
      }
      alert('Payroll processed successfully.');
    } catch (error) {
      console.error('Process payroll error:', error);
      alert('Failed to process payroll. Please try again.');
    } finally {
      setPayrollProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts & Finance</h1>
          <p className="text-slate-500 text-sm">Manage salaries, commissions, and financial reporting.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportSection}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={18} /> Export Reports
          </button>
          {currentSection !== 'payroll' && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
            >
              <Plus size={18} /> Record Entry
            </button>
          )}
        </div>
      </div>

      {/* section navigation removed; sidebar controls which view is shown */}
      <div className="py-4">
        <p className="text-sm text-slate-500">You are viewing the <strong>{currentSection.replace(/([A-Z])/g, ' $1')}</strong> section.</p>
      </div>

      {/* render section content based on currentSection */}
      {currentSection === 'reconciliation' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Reconciliation</h2>
          <p className="text-slate-500">Here you would reconcile bank statements with ledger entries.</p>
          {/* existing transaction summary could live here */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Balance" value="GH₵125,400" icon={Wallet} color="blue" />
            <StatCard title="Monthly Revenue" value="GH₵42,500" icon={TrendingUp} trend={{ value: 12, isPositive: true }} color="green" />
            <StatCard title="Monthly Expenses" value="GH₵18,200" icon={TrendingDown} trend={{ value: 5, isPositive: false }} color="red" />
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Recent Transactions</h3>
              <button className="text-xs font-medium text-brand-600">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading transactions...</div>
              ) : transactions.length > 0 ? (
                transactions.map((tx, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.color}`}>
                      <tx.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{tx.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", tx.type === 'Credit' ? 'text-emerald-600' : 'text-red-600')}>{tx.amount}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{tx.type}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">No transactions found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentSection === 'journal' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Journal Entries</h2>
          <p className="text-slate-500">Create and view double-entry journal transactions.</p>

          {/* Journal Entries List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Journal Entries</h3>
              <button className="text-xs font-medium text-brand-600">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading journal entries...</div>
              ) : Array.isArray(transactions) && transactions.length > 0 ? (
                transactions.map((entry, i) => {
                  // Skip entries that are null/undefined
                  if (!entry || typeof entry !== 'object') {
                    return null;
                  }

                  return (
                    <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{entry.description || 'No description'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {entry.entry_date ? (
                              (() => {
                                const d = new Date(entry.entry_date);
                                return isNaN(d.getTime()) ? entry.entry_date : d.toLocaleDateString();
                              })()
                            ) : 'No date'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">GH₵{entry.amount ?? 0}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Debit: {entry.debit_account || 'N/A'} | Credit: {entry.credit_account || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              ) : (
                <div className="p-6 text-center text-slate-500">No journal entries found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentSection === 'cheques' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Cheques & Expenses</h2>
          <p className="text-slate-500">Generate cheques or log expenses.</p>

          {/* Cheques List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Cheques</h3>
              <button className="text-xs font-medium text-brand-600">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading cheques...</div>
              ) : transactions.length > 0 ? (
                transactions.map((cheque, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">To: {cheque.payee}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Issued: {cheque.issued_date} | Status: {cheque.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">-GH₵{cheque.amount}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">No cheques found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentSection === 'chart' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Chart of Accounts</h2>
          <p className="text-slate-500">Manage account hierarchy, set debits and credits.</p>

          {/* Chart of Accounts List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Chart of Accounts</h3>
              <button className="text-xs font-medium text-brand-600">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading accounts...</div>
              ) : transactions.length > 0 ? (
                transactions.map((account, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{account.code} - {account.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Type: {account.type}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">No accounts found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentSection === 'vouchers' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Payment Vouchers</h2>
          <p className="text-slate-500">View generated receivables.</p>

          {/* Payment Vouchers List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Payment Vouchers</h3>
              <button className="text-xs font-medium text-brand-600">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading vouchers...</div>
              ) : transactions.length > 0 ? (
                transactions.map((voucher, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{voucher.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Status: {voucher.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">+GH₵{voucher.amount}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">No vouchers found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentSection === 'bank' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Bank</h2>
          <p className="text-slate-500">Bank account information and transfers.</p>

          {/* Bank Accounts List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Bank Accounts</h3>
              <button className="text-xs font-medium text-brand-600">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading bank accounts...</div>
              ) : transactions.length > 0 ? (
                transactions.map((bank, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{bank.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Account: {bank.account_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">GH₵{bank.balance}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">No bank accounts found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentSection === 'payroll' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Payroll Management</h2>
          <p className="text-slate-500">Process staff salaries, commissions, and payroll accounting.</p>

          {/* Payroll Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={openPayrollModal}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
            >
              <Calculator size={18} /> Calculate Payroll
            </button>
            <button
              onClick={openSalaryModal}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Tag size={18} /> Manage Staff Salaries
            </button>
            <button
              onClick={handleExportPayrollReport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download size={18} /> Export Payroll Report
            </button>
          </div>

          {/* Payroll Runs List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Payroll Runs</h3>
              <button className="text-xs font-medium text-brand-600">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading payroll data...</div>
              ) : transactions.length > 0 ? (
                transactions.map((payroll, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {payroll.period_start?.split('T')[0] || 'N/A'} – {payroll.period_end?.split('T')[0] || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Processed: {payroll.processed_at ? new Date(payroll.processed_at).toLocaleString() : '—'} | Status: {payroll.status || 'Draft'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">-GH₵{Number(payroll.total_net || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{payroll.employee_count ?? 0} employees</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">No payroll runs found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentSection === 'profitloss' && (
        <div>
          <h2 className="text-xl font-semibold">Profit & Loss Report</h2>
          <p className="text-slate-500">Financial report showing profits and losses.</p>
        </div>
      )}

      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title={`Record ${currentSection.replace(/([A-Z])/g, ' $1')}`}
        size="md"
      >
        <form className="space-y-6" onSubmit={handleRecordSubmit}>
          <div className="space-y-4">
            {/* section-specific fields */}
            {currentSection === 'reconciliation' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Transaction Description</label>
                  <input
                    type="text"
                    placeholder="Description"
                    required
                    value={reconciliationForm.description}
                    onChange={(e) => setReconciliationForm({ ...reconciliationForm, description: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Amount (GH₵)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        required
                        value={reconciliationForm.amount}
                        onChange={(e) => setReconciliationForm({ ...reconciliationForm, amount: e.target.value })}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                    <input
                      type="date"
                      required
                      value={reconciliationForm.date}
                      onChange={(e) => setReconciliationForm({ ...reconciliationForm, date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Type</label>
                    <select
                      value={reconciliationForm.type}
                      onChange={(e) => setReconciliationForm({ ...reconciliationForm, type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                    <select
                      value={reconciliationForm.category}
                      onChange={(e) => setReconciliationForm({ ...reconciliationForm, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    >
                      <option value="General">General</option>
                      <option value="Commission">Commission</option>
                      <option value="Salary">Salary</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Taxes">Taxes</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {currentSection === 'journal' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                  <input
                    type="text"
                    placeholder="Entry description"
                    required
                    value={journalForm.description}
                    onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Debit Account</label>
                    <input
                      type="text"
                      placeholder="Account code or name"
                      required
                      value={journalForm.debit_account}
                      onChange={(e) => setJournalForm({ ...journalForm, debit_account: e.target.value })}
                      className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Credit Account</label>
                    <input
                      type="text"
                      placeholder="Account code or name"
                      required
                      value={journalForm.credit_account}
                      onChange={(e) => setJournalForm({ ...journalForm, credit_account: e.target.value })}
                      className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Amount (GH₵)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      required
                      value={journalForm.amount}
                      onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                  <input
                    type="date"
                    required
                    value={journalForm.entry_date}
                    onChange={(e) => setJournalForm({ ...journalForm, entry_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
              </>
            )}

            {currentSection === 'cheques' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Payee</label>
                  <input
                    type="text"
                    placeholder="Payee name"
                    required
                    value={chequeForm.payee}
                    onChange={(e) => setChequeForm({ ...chequeForm, payee: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Amount (GH₵)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        required
                        value={chequeForm.amount}
                        onChange={(e) => setChequeForm({ ...chequeForm, amount: e.target.value })}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Issued Date</label>
                    <input
                      type="date"
                      required
                      value={chequeForm.issued_date}
                      onChange={(e) => setChequeForm({ ...chequeForm, issued_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Status</label>
                  <select
                    value={chequeForm.status}
                    onChange={(e) => setChequeForm({ ...chequeForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </>
            )}

            {currentSection === 'chart' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Account Code</label>
                  <input
                    type="text"
                    placeholder="1000"
                    required
                    value={chartForm.code}
                    onChange={(e) => setChartForm({ ...chartForm, code: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Name</label>
                  <input
                    type="text"
                    placeholder="Cash"
                    required
                    value={chartForm.name}
                    onChange={(e) => setChartForm({ ...chartForm, name: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Type</label>
                  <select
                    value={chartForm.type}
                    onChange={(e) => setChartForm({ ...chartForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </>
            )}

            {currentSection === 'vouchers' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                  <input
                    type="text"
                    placeholder="Voucher description"
                    required
                    value={voucherForm.description}
                    onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Amount (GH₵)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      required
                      value={voucherForm.amount}
                      onChange={(e) => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Status</label>
                  <select
                    value={voucherForm.status}
                    onChange={(e) => setVoucherForm({ ...voucherForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </>
            )}

            {currentSection === 'bank' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="Bank name"
                    required
                    value={bankForm.name}
                    onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="1234567890"
                    required
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Balance (GH₵)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      required
                      value={bankForm.balance}
                      onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {currentSection === 'payroll' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Month</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="3"
                      required
                      value={payrollForm.month}
                      onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                      className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Year</label>
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="2026"
                      required
                      value={payrollForm.year}
                      onChange={(e) => setPayrollForm({ ...payrollForm, year: e.target.value })}
                      className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Total Amount (GH₵)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      required
                      value={payrollForm.total_amount}
                      onChange={(e) => setPayrollForm({ ...payrollForm, total_amount: e.target.value })}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Employee Count</label>
                  <input
                    type="number"
                    placeholder="0"
                    required
                    value={payrollForm.employee_count}
                    onChange={(e) => setPayrollForm({ ...payrollForm, employee_count: e.target.value })}
                    className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Entry'}
              </button>
              <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Manage Staff Base Salaries"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Update each staff member&apos;s monthly <strong>base salary</strong>. These values are saved to the{' '}
            <code>users.base_salary</code> field and used for payroll calculations.
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Staff</h3>
            </div>
            {salaryLoading ? (
              <div className="p-6 text-center text-slate-500">Loading staff...</div>
            ) : salaryUsers.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No staff found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold text-slate-600">Name</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600">Role</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-600">Base Salary (GH₵)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salaryUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-800">{u.name}</td>
                        <td className="px-4 py-3 text-slate-600">{u.role}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-slate-400 text-xs font-bold">GH₵</span>
                            <input
                              type="number"
                              className="w-28 pl-2 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                              value={u.base_salary ?? 0}
                              onChange={(e) => handleSalaryChange(u.id, e.target.value)}
                              min={0}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {salaryUsers.length > 0 && (
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveAllSalaries}
                disabled={savingSalaries}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-60"
              >
                {savingSalaries ? 'Saving…' : 'Save All Salaries'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        title="Run Payroll"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Month</label>
              <input
                type="number"
                min={1}
                max={12}
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(Math.max(1, Math.min(12, Number(e.target.value))))}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Year</label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={payrollYear}
                onChange={(e) => setPayrollYear(Number(e.target.value))}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Period</label>
              <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                {getPeriodForMonth(payrollMonth, payrollYear).period_start} – {getPeriodForMonth(payrollMonth, payrollYear).period_end}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCalculatePayroll}
              disabled={payrollCalculating || payrollProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all disabled:opacity-60"
            >
              <Calculator size={18} /> {payrollCalculating ? 'Calculating…' : 'Calculate'}
            </button>
            <button
              onClick={handleProcessPayroll}
              disabled={!payrollPreview || payrollCalculating || payrollProcessing}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-60"
            >
              {payrollProcessing ? 'Processing…' : 'Process Payroll'}
            </button>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Info size={14} /> Staff comes from active <strong>users</strong> in the database.
            </div>
          </div>

          {payrollPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">Total gross</p>
                  <p className="text-lg font-bold text-slate-900">GH₵{Number(payrollPreview.total_gross || 0).toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">Total net</p>
                  <p className="text-lg font-bold text-slate-900">GH₵{Number(payrollPreview.total_net || 0).toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">Employees</p>
                  <p className="text-lg font-bold text-slate-900">{(payrollPreview.entries || []).length}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Payroll Preview</h3>
                  <p className="text-xs text-slate-500 mt-1">Base salary + commissions (no deductions yet).</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold text-slate-600">Staff</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-600">Role</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-600">Base</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-600">Commission</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-600">Gross</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-600">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(payrollPreview.entries || []).map((e, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">{e.user_name || e.user_id}</td>
                          <td className="px-4 py-3 text-slate-600">{e.role || '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-700">GH₵{Number(e.base_salary || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-700">GH₵{Number(e.commission_earned || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-900 font-bold">GH₵{Number(e.gross_pay || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-900 font-bold">GH₵{Number(e.net_pay || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AccountsView;
