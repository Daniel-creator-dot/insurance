import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  TrendingUp, 
  Award, 
  Target, 
  Users, 
  Shield, 
  ArrowUpRight,
  MoreVertical,
  Star,
  DollarSign,
  Calendar,
  TrendingDown
} from 'lucide-react';
import { PerformanceChart } from '../components/Charts';
import { cn } from '../types';
import { dashboardAPI } from '../services/api';

const PerformanceView: React.FC = () => {
  const [performanceData, setPerformanceData] = useState({
    salesTarget: { progress: 72, amount: 72000, target: 100000 },
    retentionRate: { progress: 94, rate: 94 },
    topPerformer: { name: 'John Doe', policies: 12 },
    leaderboard: [
      { name: 'John Doe', score: 98, rank: 1, trend: 'up' },
      { name: 'Sarah Smith', score: 92, rank: 2, trend: 'up' },
      { name: 'Michael Scott', score: 85, rank: 3, trend: 'down' },
      { name: 'Jim Halpert', score: 82, rank: 4, trend: 'up' },
      { name: 'Pam Beesly', score: 78, rank: 5, trend: 'down' },
    ]
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        console.log('Fetching performance data for period:', period);
        const response = await dashboardAPI.getStats(period);
        console.log('Performance data response:', response);
        console.log('Response data structure:', JSON.stringify(response.data, null, 2));
        
        // Backend returns different data based on user role
        // Super Admin: totalPolicies, totalClients, totalRevenue, expiringSoon, activePolicies, etc.
        // Sales Agent: myClients, activePolicies, commissionEarned, expiringPolicies, totalPolicies
        // Accountant: totalCollections, pendingPayments, agentCommissions, netProfit, etc.
        // Marketer: leadsGenerated, campaignReach, convertedClients, followUps, etc.
        
        const backendData = response.data || {};
        
        // Debug: Check what data we actually received
        console.log('Backend data keys:', Object.keys(backendData));
        console.log('Backend data values:', backendData);
        
        // Transform backend data to frontend performance format based on available data
        const transformedData = transformBackendDataToPerformance(backendData);
        
        console.log('Final transformed data:', transformedData);
        setPerformanceData(transformedData);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        console.error('Error details:', error.response?.data || error.message);
        // Set fallback data if there's an error
        setPerformanceData({
          salesTarget: { progress: 72, amount: 72000, target: 100000 },
          retentionRate: { progress: 94, rate: 94 },
          topPerformer: { name: 'John Doe', policies: 12 },
          leaderboard: [
            { name: 'John Doe', score: 98, rank: 1, trend: 'up' },
            { name: 'Sarah Smith', score: 92, rank: 2, trend: 'up' },
            { name: 'Michael Scott', score: 85, rank: 3, trend: 'down' },
            { name: 'Jim Halpert', score: 82, rank: 4, trend: 'up' },
            { name: 'Pam Beesly', score: 78, rank: 5, trend: 'down' },
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [period]);

  // Transform backend data to frontend performance format
  const transformBackendDataToPerformance = (backendData: any) => {
    console.log('Transforming backend data:', backendData);
    
    const transformed = {
      salesTarget: { progress: 0, amount: 0, target: 100000 },
      retentionRate: { progress: 0, rate: 0 },
      topPerformer: { name: 'N/A', policies: 0 },
      leaderboard: [] as any[],
      userPerformances: [] as any[]
    };

    // Handle different role data structures based on database tables
    if (backendData.totalRevenue !== undefined) {
      // Super Admin data - comprehensive overview
      console.log('Processing Super Admin data');
      transformed.salesTarget.amount = backendData.totalRevenue || 0;
      transformed.salesTarget.progress = Math.min(100, Math.round((backendData.totalRevenue || 0) / 1000));
      
      // Calculate retention rate based on active vs total policies from policies table
      const totalPolicies = backendData.totalPolicies || 1;
      const activePolicies = backendData.activePolicies || 0;
      transformed.retentionRate.rate = Math.round((activePolicies / totalPolicies) * 100);
      transformed.retentionRate.progress = transformed.retentionRate.rate;
      
      // Show top performer from user performances if available
      if (backendData.userPerformances && backendData.userPerformances.length > 0) {
        const topUser = backendData.userPerformances[0];
        transformed.topPerformer.name = topUser.name;
        transformed.topPerformer.policies = Math.round(topUser.totalScore || 0);
      } else {
        transformed.topPerformer.name = 'System';
        transformed.topPerformer.policies = backendData.totalPolicies || 0;
      }
      
      // Copy user performances to transformed data
      transformed.userPerformances = backendData.userPerformances || [];
      
      // Create leaderboard based on database metrics
      transformed.leaderboard = [
        { name: 'Total Policies', score: backendData.totalPolicies || 0, rank: 1, trend: 'up' },
        { name: 'Active Policies', score: backendData.activePolicies || 0, rank: 2, trend: 'up' },
        { name: 'Clients', score: backendData.totalClients || 0, rank: 3, trend: 'up' },
        { name: 'Leads', score: backendData.newLeads || 0, rank: 4, trend: 'up' },
        { name: 'Messages', score: backendData.totalMessages || 0, rank: 5, trend: 'up' },
      ];
    } else if (backendData.activePolicies !== undefined) {
      // Sales Agent data - individual performance
      console.log('Processing Sales Agent data');
      transformed.salesTarget.amount = backendData.commissionEarned || 0;
      transformed.salesTarget.progress = Math.min(100, Math.round((backendData.commissionEarned || 0) / 1000));
      
      // Calculate retention based on active vs total policies from policies table
      const totalPolicies = backendData.totalPolicies || 1;
      const activePolicies = backendData.activePolicies || 0;
      transformed.retentionRate.rate = Math.round((activePolicies / totalPolicies) * 100);
      transformed.retentionRate.progress = transformed.retentionRate.rate;
      
      transformed.topPerformer.name = 'You';
      transformed.topPerformer.policies = backendData.activePolicies || 0;
      
      // Sales agent specific leaderboard using policies table data
      transformed.leaderboard = [
        { name: 'My Clients', score: backendData.myClients || 0, rank: 1, trend: 'up' },
        { name: 'Active Policies', score: backendData.activePolicies || 0, rank: 2, trend: 'up' },
        { name: 'Commission Earned', score: Math.round(backendData.commissionEarned || 0), rank: 3, trend: 'up' },
        { name: 'Expiring Policies', score: backendData.expiringPolicies || 0, rank: 4, trend: 'down' },
        { name: 'Total Policies', score: backendData.totalPolicies || 0, rank: 5, trend: 'up' },
      ];
    } else if (backendData.totalCollections !== undefined) {
      // Accountant data - financial performance
      console.log('Processing Accountant data');
      transformed.salesTarget.amount = backendData.totalCollections || 0;
      transformed.salesTarget.progress = Math.min(100, Math.round((backendData.totalCollections || 0) / 1000));
      
      // Calculate retention based on commissions vs collections from accounts/payroll tables
      transformed.retentionRate.rate = Math.round((backendData.agentCommissions || 0) / Math.max(1, backendData.totalCollections || 1) * 100);
      transformed.retentionRate.progress = transformed.retentionRate.rate;
      
      // Show top performer from user performances if available
      if (backendData.userPerformances && backendData.userPerformances.length > 0) {
        const topUser = backendData.userPerformances[0];
        transformed.topPerformer.name = topUser.name;
        transformed.topPerformer.policies = Math.round(topUser.totalScore || 0);
      } else {
        transformed.topPerformer.name = 'Finance Team';
        transformed.topPerformer.policies = Math.round(backendData.netProfit || 0);
      }
      
      // Accountant specific leaderboard using accounts table data
      transformed.leaderboard = [
        { name: 'Total Collections', score: Math.round(backendData.totalCollections || 0), rank: 1, trend: 'up' },
        { name: 'Net Profit', score: Math.round(backendData.netProfit || 0), rank: 2, trend: 'up' },
        { name: 'Agent Commissions', score: Math.round(backendData.agentCommissions || 0), rank: 3, trend: 'up' },
        { name: 'Pending Payments', score: Math.round(backendData.pendingPayments || 0), rank: 4, trend: 'down' },
        { name: 'Total Income', score: Math.round(backendData.totalIncome || 0), rank: 5, trend: 'up' },
      ];
    } else if (backendData.leadsGenerated !== undefined) {
      // Marketer data - lead generation performance
      console.log('Processing Marketer data');
      transformed.salesTarget.amount = backendData.leadsGenerated || 0;
      transformed.salesTarget.progress = Math.min(100, Math.round((backendData.leadsGenerated || 0) / 50 * 100));
      
      // Calculate retention based on conversion rate from leads table
      transformed.retentionRate.rate = Math.round((backendData.convertedClients || 0) / Math.max(1, backendData.leadsGenerated || 1) * 100);
      transformed.retentionRate.progress = transformed.retentionRate.rate;
      
      transformed.topPerformer.name = 'Marketing Team';
      transformed.topPerformer.policies = backendData.leadsGenerated || 0;
      
      // Marketer specific leaderboard using leads table data
      transformed.leaderboard = [
        { name: 'Leads Generated', score: backendData.leadsGenerated || 0, rank: 1, trend: 'up' },
        { name: 'Converted Clients', score: backendData.convertedClients || 0, rank: 2, trend: 'up' },
        { name: 'Campaign Reach', score: Math.round((backendData.campaignReach || 0) / 100), rank: 3, trend: 'up' },
        { name: 'Follow-ups', score: backendData.followUps || 0, rank: 4, trend: 'up' },
        { name: 'Qualified Leads', score: backendData.qualifiedLeads || 0, rank: 5, trend: 'up' },
      ];
    } else if (backendData.totalStaff !== undefined) {
      // HR/Payroll data - staff performance
      console.log('Processing HR/Payroll data');
      transformed.salesTarget.amount = backendData.totalPayroll || 0;
      transformed.salesTarget.progress = Math.min(100, Math.round((backendData.totalPayroll || 0) / 5000));
      
      // Calculate retention based on active staff from users table
      const totalStaff = backendData.totalStaff || 1;
      const activeStaff = backendData.activeStaff || 0;
      transformed.retentionRate.rate = Math.round((activeStaff / totalStaff) * 100);
      transformed.retentionRate.progress = transformed.retentionRate.rate;
      
      // Show top performer from user performances if available
      if (backendData.userPerformances && backendData.userPerformances.length > 0) {
        const topUser = backendData.userPerformances[0];
        transformed.topPerformer.name = topUser.name;
        transformed.topPerformer.policies = Math.round(topUser.totalScore || 0);
      } else {
        transformed.topPerformer.name = 'HR Team';
        transformed.topPerformer.policies = backendData.totalStaff || 0;
      }
      
      // HR specific leaderboard using user performances
      if (backendData.userPerformances && backendData.userPerformances.length > 0) {
        transformed.leaderboard = backendData.userPerformances.slice(0, 5).map((user: any, index: number) => ({
          name: user.name,
          score: Math.round(user.totalScore || 0),
          rank: index + 1,
          trend: 'up'
        }));
      } else {
        transformed.leaderboard = [
          { name: 'Total Staff', score: backendData.totalStaff || 0, rank: 1, trend: 'up' },
          { name: 'Active Employees', score: backendData.activeStaff || 0, rank: 2, trend: 'up' },
          { name: 'Total Payroll', score: Math.round(backendData.totalPayroll || 0), rank: 3, trend: 'up' },
          { name: 'Processed Payrolls', score: backendData.processedPayrolls || 0, rank: 4, trend: 'up' },
          { name: 'Pending Reconciliations', score: backendData.pendingReconciliations || 0, rank: 5, trend: 'down' },
        ];
      }
    } else {
      // Fallback for unknown data structure
      console.log('Using fallback data structure');
      transformed.salesTarget.amount = backendData.totalPolicies || 0;
      transformed.salesTarget.progress = 50;
      transformed.retentionRate.rate = 85;
      transformed.retentionRate.progress = 85;
      transformed.topPerformer.name = 'Team';
      transformed.topPerformer.policies = backendData.totalPolicies || 0;
      transformed.leaderboard = [
        { name: 'Total', score: backendData.totalPolicies || 0, rank: 1, trend: 'up' },
        { name: 'Active', score: backendData.activePolicies || 0, rank: 2, trend: 'up' },
        { name: 'Clients', score: backendData.totalClients || 0, rank: 3, trend: 'up' },
        { name: 'Leads', score: backendData.newLeads || 0, rank: 4, trend: 'up' },
        { name: 'Messages', score: backendData.totalMessages || 0, rank: 5, trend: 'up' },
      ];
    }

    console.log('Transformed performance data:', transformed);
    return transformed;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Analytics</h1>
          <p className="text-slate-500 text-sm">Monitor agent productivity, sales targets, and rankings.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Sales Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Progress</span>
              <span className="font-bold text-slate-800">{performanceData.salesTarget.progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full" style={{ width: `${performanceData.salesTarget.progress}%` }}></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">GH₵{performanceData.salesTarget.amount.toLocaleString()} generated</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Retention Rate</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Progress</span>
              <span className="font-bold text-slate-800">{performanceData.retentionRate.progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${performanceData.retentionRate.progress}%` }}></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Client retention rate</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Award size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Top Performer</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">{performanceData.topPerformer.name.charAt(0)}{performanceData.topPerformer.name.split(' ')[1]?.charAt(0) || ''}</div>
            <div>
              <p className="text-sm font-bold text-slate-800">{performanceData.topPerformer.name}</p>
              <p className="text-xs text-slate-500">{performanceData.topPerformer.policies} achievements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Productivity Trends</h3>
          <PerformanceChart period={parseInt(period)} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Agent Leaderboard</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {performanceData.leaderboard.map((agent) => (
              <div key={agent.rank} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                  agent.rank === 1 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                )}>
                  {agent.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{agent.name}</p>
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] text-slate-400 font-medium">{agent.score} Productivity Score</span>
                  </div>
                </div>
                <div className={cn(
                  "text-xs font-bold",
                  agent.trend === 'up' ? "text-emerald-600" : "text-red-500"
                )}>
                  {agent.trend === 'up' ? '▲' : '▼'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Users Performance Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">All Users Performance</h3>
          <p className="text-sm text-slate-500 mt-1">Complete performance overview for all team members</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-sm font-semibold text-slate-600 pb-3">Rank</th>
                  <th className="text-left text-sm font-semibold text-slate-600 pb-3">User</th>
                  <th className="text-left text-sm font-semibold text-slate-600 pb-3">Role</th>
                  <th className="text-left text-sm font-semibold text-slate-600 pb-3">Total Policies</th>
                  <th className="text-left text-sm font-semibold text-slate-600 pb-3">Active Policies</th>
                  <th className="text-left text-sm font-semibold text-slate-600 pb-3">Commission Earned</th>
                  <th className="text-left text-sm font-semibold text-slate-600 pb-3">Leads Generated</th>
                  <th className="text-left text-sm font-semibold text-slate-600 pb-3">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Access userPerformances from the performanceData state
                  // The userPerformances should be available in the transformed data
                  const userPerformances = performanceData.userPerformances || [];
                  
                  if (userPerformances.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No user performance data available
                        </td>
                      </tr>
                    );
                  }

                  return userPerformances.map((user, index) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-sm font-bold text-slate-600">{index + 1}</td>
                      <td className="py-4 text-sm font-bold text-slate-800">{user.name}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          user.role === 'SUPER_ADMIN' ? 'bg-slate-100 text-slate-700' :
                          user.role === 'SALES_AGENT' ? 'bg-emerald-100 text-emerald-700' :
                          user.role === 'MARKETER' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'ACCOUNTANT' ? 'bg-amber-100 text-amber-700' :
                          user.role === 'HR' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-slate-600">{user.totalPolicies}</td>
                      <td className="py-4 text-sm text-slate-600">{user.activePolicies}</td>
                      <td className="py-4 text-sm text-slate-600">GH₵{user.commissionEarned.toLocaleString()}</td>
                      <td className="py-4 text-sm text-slate-600">{user.leadsGenerated}</td>
                      <td className="py-4 text-sm font-bold text-slate-800">{user.totalScore.toLocaleString()}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceView;
