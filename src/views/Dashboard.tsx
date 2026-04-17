import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Filter,
  Download,
  Plus,
  Wallet,
  Calculator,
  Calendar,
  Tag,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { RevenueChart, PerformanceChart, PolicyDistribution, LeadsSourceChart, LeadsStatusChart } from '../components/Charts';
import { Role, Policy, cn } from '../types';
import Modal from '../components/Modal';
import { dashboardAPI, policyAPI, clientAPI, leadAPI, accountAPI, smsAPI } from '../services/api';

interface DashboardProps {
  role: Role;
  onNavigate?: (tab: string) => void;
}

const LEGEND_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500'];

const PolicyDistributionLegend: React.FC = () => {
  const [legendData, setLegendData] = useState<{label: string; value: string; color: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getPolicyDistribution();
        const data = response.data || [];
        if (data.length > 0) {
          const total = data.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
          setLegendData(data.map((item: any, index: number) => ({
            label: item.name || 'Unknown',
            value: total > 0 ? `${Math.round((item.value / total) * 100)}%` : '0%',
            color: LEGEND_COLORS[index % LEGEND_COLORS.length],
          })));
        } else {
          setLegendData([]);
        }
      } catch {
        setLegendData([]);
      }
    };
    fetchData();
  }, []);

  if (legendData.length === 0) {
    return <p className="text-xs text-slate-400 mt-4 text-center">No distribution data available</p>;
  }

  return (
    <div className="space-y-3 mt-4">
      {legendData.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-xs text-slate-500">{item.label}</span>
          </div>
          <span className="text-xs font-bold text-slate-700">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate }) => {
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [expiringPolicies, setExpiringPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState(7);
  const [performancePeriod, setPerformancePeriod] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching dashboard data for role:', role);
        
        // Fetch dashboard stats for all roles
        const statsResponse = await dashboardAPI.getStats(30);
        console.log('Dashboard stats response:', statsResponse);
        // Backend returns { stats: {...} }
        // If response.data.stats exists, use it, otherwise use response.data if it's an object
        setStats(statsResponse.data.stats || statsResponse.data || null);

        // Fetch recent activities for Super Admin only
        if (role === 'SUPER_ADMIN') {
          const activitiesResponse = await dashboardAPI.getActivities();
          console.log('Activities response:', activitiesResponse);
          // Backend returns { activities: [...] }
          // If response.data.activities exists, use it, otherwise use response.data if it's an array
          setActivities(activitiesResponse.data.activities || activitiesResponse.data || []);
        }

        // Fetch expiring policies for Super Admin, Marketer, and Sales Agent
        if (['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT'].includes(role)) {
          const expiringResponse = await dashboardAPI.getExpiringPolicies(30);
          console.log('Expiring policies response:', expiringResponse);
          // Backend returns { expiringPolicies: [...] }
          // If response.data.expiringPolicies exists, use it, otherwise use response.data if it's an array
          setExpiringPolicies(expiringResponse.data.expiringPolicies || expiringResponse.data || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  const renderExpiringPoliciesTable = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Expiring Policies</h3>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase">Critical</span>
          <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase">Warning</span>
        </div>
      </div>
      <div className="p-0">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-3">Policy #</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Expiry</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {expiringPolicies.length > 0 ? (
              expiringPolicies.map((policy, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{policy.policyNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{policy.clientName}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={policy.daysUntilExpiry <= 7 ? 'text-red-500 font-bold' : 'text-amber-600 font-medium'}>
                      {policy.expiryDate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => {
                        const message = `Dear ${policy.clientName},\n\nYour policy No. ${policy.policyNumber} expires on ${policy.expiryDate}. Renewal is required to prevent lapse of benefits. Kindly arrange payment before the due date. You can contact us on marketing@kesbridgebrokers.com and number +233 (0)599 679 991`;
                        localStorage.setItem('sms_prefill', JSON.stringify({
                          clientId: policy.clientId,
                          message: message
                        }));
                        onNavigate?.('sms');
                      }}
                      className="text-brand-600 hover:text-brand-700 text-xs font-bold"
                    >
                      Remind
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-slate-500">No expiring policies</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSuperAdmin = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Policies" 
          value={stats?.totalPolicies || "0"} 
          icon={Shield} 
          trend={{ value: 12, isPositive: true }} 
          color="blue" 
        />
        <StatCard 
          title="Total Clients" 
          value={stats?.totalClients || "0"} 
          icon={Users} 
          trend={{ value: 8, isPositive: true }} 
          color="purple" 
        />
        <StatCard 
          title="Total Revenue" 
          value={`GH₵${stats?.totalRevenue || "0"}`} 
          icon={TrendingUp} 
          trend={{ value: 15, isPositive: true }} 
          color="green" 
        />
        <StatCard 
          title="Expiring Soon" 
          value={stats?.expiringSoon || "0"} 
          icon={AlertCircle} 
          color="red" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Revenue Overview</h3>
            <select 
              className="text-sm border-slate-200 rounded-lg bg-slate-50 px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500/20"
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(parseInt(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
          <RevenueChart period={revenuePeriod} />
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Policy Distribution</h3>
          <PolicyDistribution />
          <PolicyDistributionLegend />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Recent Activities</h3>
            <button 
              onClick={() => setIsActivitiesModalOpen(true)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {activities.length > 0 ? (
              activities.map((activity, i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500">
                    <Plus size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">
                      <span className="font-bold text-slate-800">{activity.user}</span> {activity.action} <span className="font-medium text-brand-600">{activity.target}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500">No recent activities</div>
            )}
          </div>
        </div>

        {renderExpiringPoliciesTable()}
      </div>
    </div>
  );

  const renderMarketer = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Leads Generated" value={stats?.leadsGenerated || "0"} icon={TrendingUp} trend={{ value: 18, isPositive: true }} color="blue" />
        <StatCard title="Total Leads" value={stats?.totalLeads || "0"} icon={Users} color="purple" />
        <StatCard title="Converted Clients" value={stats?.convertedClients || "0"} icon={CheckCircle2} trend={{ value: 2, isPositive: true }} color="green" />
        <StatCard title="Follow-ups" value={stats?.followUps || "0"} icon={Clock} color="orange" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Lead Sources Analytics</h3>
          <LeadsSourceChart data={stats?.leadsBySource || []} />
          <button 
            onClick={() => onNavigate?.('leads')}
            className="w-full mt-6 py-2.5 text-sm font-bold text-brand-600 hover:text-brand-700 border border-brand-100 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Detailed Lead Analytics
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Leads Status Distribution</h3>
          <LeadsStatusChart data={stats?.leadsByStatus || []} />
          <div className="space-y-3 mt-4">
            {(stats?.leadsByStatus || [
              { status: 'New', count: 0 },
              { status: 'Contacted', count: 0 },
              { status: 'Qualified', count: 0 },
              { status: 'Converted', count: 0 }
            ]).map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-brand-500`}></div>
                  <span className="text-xs text-slate-500">{item.status}</span>
                </div>
                <span className="text-xs font-bold text-slate-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Recent Leads</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(stats?.recentLeads || []).slice(0, 3).map((lead, i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-xl hover:border-brand-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">{lead.name}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    lead.status === 'New' ? "bg-blue-50 text-blue-600" : 
                    lead.status === 'Qualified' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  )}>{lead.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Source</p>
                    <p className="text-sm font-bold text-slate-700">{lead.source}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Date</p>
                    <p className="text-sm font-bold text-slate-700">{lead.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate?.('leads')}
            className="w-full mt-4 py-2 text-sm font-bold text-brand-600 hover:text-brand-700 border border-brand-100 rounded-xl hover:bg-brand-50 transition-colors"
          >
            View All Leads
          </button>
      </div>
      {renderExpiringPoliciesTable()}
    </div>
  );

  const renderSalesAgent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Clients" value={stats?.myClients || "0"} icon={Users} color="blue" />
        <StatCard title="Active Policies" value={stats?.activePolicies || "0"} icon={Shield} color="green" />
        <StatCard title="Commission Earned" value={`GH₵${stats?.commissionEarned || "0"}`} icon={TrendingUp} color="purple" />
        <StatCard title="Expiring Policies" value={stats?.expiringPolicies || "0"} icon={AlertCircle} color="red" />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">My Assigned Leads</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(stats?.assignedLeads && stats.assignedLeads.length > 0) ? (
                  stats.assignedLeads.slice(0, 10).map((lead, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{lead.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{lead.phone}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          lead.status === 'New' ? "bg-blue-50 text-blue-600" : 
                          lead.status === 'Contacted' ? "bg-amber-50 text-amber-600" :
                          lead.status === 'Converted' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}>{lead.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{lead.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">No leads assigned yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button 
            onClick={() => onNavigate?.('leads')}
            className="w-full mt-4 py-2 text-sm font-bold text-brand-600 hover:text-brand-700 border border-brand-100 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Manage All Leads
          </button>
        </div>
      </div>
      {renderExpiringPoliciesTable()}
    </div>
  );

  const renderAccountant = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Collections" value={`GH₵${stats?.totalCollections || "0"}`} icon={Wallet} color="blue" />
        <StatCard title="Pending Payments" value={`GH₵${stats?.pendingPayments || "0"}`} icon={Clock} color="orange" />
        <StatCard title="Agent Commissions" value={`GH₵${stats?.agentCommissions || "0"}`} icon={TrendingUp} color="purple" />
        <StatCard title="Net Profit" value={`GH₵${stats?.netProfit || "0"}`} icon={CheckCircle2} color="green" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Company Revenue Overview</h3>
            <select 
              className="text-sm border-slate-200 rounded-lg bg-slate-50 px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500/20"
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(parseInt(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
          <RevenueChart period={revenuePeriod} />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-3 p-4 bg-brand-50 text-brand-700 rounded-xl font-bold hover:bg-brand-100 transition-colors"
            >
              <Plus size={20} /> Record Payment
            </button>
            <button 
              onClick={() => onNavigate?.('hr')}
              className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-left"
            >
              <Calculator size={20} /> Calculate Salaries
            </button>
            <button 
              onClick={() => onNavigate?.('accounts')}
              className="flex items-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-xl font-bold hover:bg-purple-100 transition-colors text-left"
            >
              <Download size={20} /> Monthly Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {role.replace('_', ' ')}!</h1>
          <p className="text-slate-500 text-sm">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={18} /> Filters
          </button>
          <button 
            onClick={() => onNavigate?.('policies')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
          >
            <Plus size={18} /> New Policy
          </button>
          <button 
            onClick={() => onNavigate?.('sms')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
          >
            <MessageSquare size={18} /> SMS Center
          </button>
        </div>
      </div>

      {role === 'SUPER_ADMIN' && renderSuperAdmin()}
      {role === 'MARKETER' && renderMarketer()}
      {role === 'SALES_AGENT' && renderSalesAgent()}
      {role === 'ACCOUNTANT' && renderAccountant()}

      <Modal 
        isOpen={isAddPolicyModalOpen} 
        onClose={() => setIsAddPolicyModalOpen(false)} 
        title="Add New Policy"
        size="lg"
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsAddPolicyModalOpen(false); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Policy Number</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="e.g. POL-1234" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Client Name</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none">
                <option>Select Client...</option>
                <option>Alice Johnson</option>
                <option>Robert Brown</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Insurance Type</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none">
                <option>Health Insurance</option>
                <option>Life Insurance</option>
                <option>Auto Insurance</option>
                <option>Home Insurance</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Premium Amount (GH₵)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                <input type="number" placeholder="0.00" className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="date" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Expiry Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="date" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Create Policy
            </button>
            <button type="button" onClick={() => setIsAddPolicyModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isRecordModalOpen} 
        onClose={() => setIsRecordModalOpen(false)} 
        title="Record Financial Entry"
        size="md"
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsRecordModalOpen(false); }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Entry Type</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none">
                  <option>Credit (Income)</option>
                  <option>Debit (Expense)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none appearance-none">
                    <option>Policy Premium</option>
                    <option>Commission</option>
                    <option>Salary</option>
                    <option>Office Expense</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Amount (GH₵)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                <input type="number" placeholder="0.00" className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="date" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
              <textarea rows={3} placeholder="Enter transaction details..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"></textarea>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Save Transaction
            </button>
            <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isActivitiesModalOpen} 
        onClose={() => setIsActivitiesModalOpen(false)} 
        title="Recent Activities"
        size="lg"
      >
        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {activities.length > 0 ? (
            activities.map((activity, i) => (
              <div key={i} className="py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors px-2 rounded-xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <Plus size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-800">{activity.user}</span> {activity.action} <span className="font-medium text-brand-600">{activity.target}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-500 italic">No recent activities to display</div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => setIsActivitiesModalOpen(false)}
            className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
