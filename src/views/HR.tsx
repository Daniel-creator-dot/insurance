import React, { useState, useEffect } from 'react';
import { Calculator, Wallet, Calendar, Download, Building } from 'lucide-react';
import StatCard from '../components/StatCard';
import { User } from '../types';
import { payrollAPI } from '../services/api';

interface HRViewProps {
  user: User;
}

const HRView: React.FC<HRViewProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // Fetch payroll_entries which hold the actual gross/net/commission values
        const response = await payrollAPI.getByUser(user.id);

        if (isMounted) {
          const data = response.data || [];
          setPayrollData(Array.isArray(data) ? data : []);
        }
      } catch (error: any) {
        if (isMounted && error?.name !== 'CanceledError') {
          console.error('Error fetching HR & Payroll data:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user?.id]);

  const exportToCsv = () => {
    if (!payrollData || payrollData.length === 0) {
      alert('No data to export.');
      return;
    }
    const filename = `payroll-history-${new Date().toISOString().slice(0, 10)}.csv`;
    const rows = payrollData.map((e: any) => ({
      Month: `${e.month || e.period_start || ''}`,
      BaseSalary: Number(e.base_salary || e.basic_salary || 0).toFixed(2),
      Commission: Number(e.commission_earned || e.commission || 0).toFixed(2),
      GrossPay: Number(e.gross_pay || e.total_earnings || 0).toFixed(2),
      NetPay: Number(e.net_pay || e.net_salary || 0).toFixed(2),
    }));

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => headers.map((field) => `"${row[field as keyof typeof row]}"`).join(','))
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

  const totalEarned = payrollData.reduce((acc, curr) => acc + Number(curr.net_pay || curr.net_salary || 0), 0);
  const latestSalary = payrollData.length > 0 ? Number(payrollData[0].base_salary || payrollData[0].basic_salary || 0) : 0;
  const totalCommission = payrollData.reduce((acc, curr) => acc + Number(curr.commission_earned || curr.commission || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR & Payroll</h1>
          <p className="text-slate-500 text-sm">View your personal salary, commissions, and slip history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={18} /> Export History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Latest Base Salary" value={`GH₵${latestSalary.toFixed(2)}`} icon={Wallet} color="blue" />
        <StatCard title="Total YTD Earnings" value={`GH₵${totalEarned.toFixed(2)}`} icon={Calculator} color="green" />
        <StatCard title="Total Commissions" value={`GH₵${totalCommission.toFixed(2)}`} icon={Building} color="purple" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Payroll Slip History</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading payroll history...</div>
          ) : payrollData.length > 0 ? (
            payrollData.map((slip, i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-brand-600 bg-brand-50">
                  <Calendar size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    {slip.month ? `Month: ${slip.month}` : `Period: ${slip.period_start || ''}`}
                    {slip.year ? ` / ${slip.year}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Base: GH₵{Number(slip.base_salary || slip.basic_salary || 0).toFixed(2)} | Commission: GH₵{Number(slip.commission_earned || slip.commission || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">GH₵{Number(slip.net_pay || slip.net_salary || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Net Pay</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500">No payroll history found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRView;
