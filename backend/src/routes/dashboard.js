const express = require('express');
const Policy = require('../models/Policy');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const Account = require('../models/Account');
const SMSLog = require('../models/SMSLog');
const User = require('../models/User');
const { verifyToken } = require('./auth');
const { query } = require('../config/database');

const router = express.Router();

// Get dashboard statistics for different roles
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const role = req.user.role;
    const period = parseInt(req.query.period) || 30; // default 30 days
    let stats = {};

    console.log('Dashboard stats request for role:', role, 'User ID:', req.user.id, 'Period:', period);

    if (role === 'SUPER_ADMIN') {
      // Super Admin stats - comprehensive overview from all tables
      const [policyStats, clientCount, leadStats, accountStats, smsStats, userStats, userPerformances] = await Promise.all([
        Policy.getStats(period),
        Client.getCount(),
        Lead.getStats(period),
        Account.getStats(period),
        SMSLog.getStats(period),
        User.getAll().then(users => ({ totalStaff: users.length, activeStaff: users.filter(u => u.is_active).length })),
        getUserPerformances(period) // Get individual user performances
      ]);

      stats = {
        totalPolicies: parseInt(policyStats.total_policies),
        totalClients: parseInt(clientCount),
        totalRevenue: parseFloat(policyStats.total_premium),
        expiringSoon: await Policy.getExpiringSoon(30).then(policies => policies.length),
        activePolicies: parseInt(policyStats.active_policies),
        expiredPolicies: parseInt(policyStats.expired_policies),
        newLeads: parseInt(leadStats.new_leads),
        convertedLeads: parseInt(leadStats.converted_leads),
        totalMessages: parseInt(smsStats.total_messages),
        sentMessages: parseInt(smsStats.sent_messages),
        pendingMessages: parseInt(smsStats.pending_messages),
        totalIncome: parseFloat(accountStats.total_income || 0),
        totalExpense: parseFloat(accountStats.total_expense || 0),
        netProfit: parseFloat(accountStats.net_profit || 0),
        totalStaff: userStats.totalStaff,
        activeStaff: userStats.activeStaff,
        userPerformances: userPerformances
      };
    } else if (role === 'MARKETER') {
      // Marketer stats - leads and campaigns from leads table
      const leadStats = await Lead.getStats();
      const leads = await Lead.getAll(1000); // Get more leads for better stats
      const assignedLeads = await Lead.getByAssignee(req.user.id);
      
      const recentLeads = leads.slice(0, 10).map(l => ({
        name: l.name,
        source: l.source,
        status: l.status,
        date: new Date(l.created_at).toLocaleDateString()
      }));

      // Calculate leads by source for analytics
      const leadsBySource = {};
      leads.forEach(l => {
        const source = l.source || 'Unknown';
        leadsBySource[source] = (leadsBySource[source] || 0) + 1;
      });

      // Calculate leads by status
      const leadsByStatus = {
        'New': 0,
        'Contacted': 0,
        'Qualified': 0,
        'Converted': 0,
        'Lost': 0
      };
      leads.forEach(l => {
        if (leadsByStatus[l.status] !== undefined) {
          leadsByStatus[l.status]++;
        }
      });

      stats = {
        leadsGenerated: assignedLeads.length,
        totalLeads: leads.length,
        campaignReach: leads.length * 50, // Approximation based on total leads
        convertedClients: parseInt(leadStats.converted_leads),
        followUps: parseInt(leadStats.contacted_leads),
        newLeads: parseInt(leadStats.new_leads),
        qualifiedLeads: parseInt(leadStats.qualified_leads),
        myAssignedLeads: assignedLeads.length,
        recentLeads: recentLeads,
        leadsBySource: Object.keys(leadsBySource).map(source => ({ source, count: leadsBySource[source] })),
        leadsByStatus: Object.keys(leadsByStatus).map(status => ({ status, count: leadsByStatus[status] }))
      };
    } else if (role === 'SALES_AGENT') {
      // Sales Agent stats - clients and policies from policies table
      const policies = await Policy.getByAgent(req.user.id);
      const clients = await Client.getByAgent(req.user.id);
      const expiringSoon = await Policy.getExpiringSoon(30);

      // Calculate actual commission from policies table
      const commissionEarned = policies.reduce((sum, p) => sum + (parseFloat(p.net_comm || 0)), 0);

      // Task Reminders - based on expiring policies and new leads
      const taskReminders = [];
      expiringSoon.filter(p => p.agent_id === req.user.id).forEach(p => {
        taskReminders.push({
          task: `Renew Policy: ${p.policy_number}`,
          time: new Date(p.expiry_date).toLocaleDateString(),
          priority: 'High'
        });
      });

      const myLeads = await Lead.getByAssignee(req.user.id);
      myLeads.filter(l => l.status === 'New').forEach(l => {
        taskReminders.push({
          task: `Call new lead: ${l.name}`,
          time: 'Today',
          priority: 'Medium'
        });
      });

      const assignedLeads = myLeads.map(l => ({
        name: l.name,
        phone: l.phone,
        status: l.status,
        date: new Date(l.created_at).toLocaleDateString()
      }));

      stats = {
        myClients: clients.length,
        activePolicies: policies.filter(p => p.status === 'Active').length,
        commissionEarned: commissionEarned,
        expiringPolicies: expiringSoon.filter(p => p.agent_id === req.user.id).length,
        totalPolicies: policies.length,
        totalPremium: policies.reduce((sum, p) => sum + parseFloat(p.premium || 0), 0),
        taskReminders: taskReminders.length > 0 ? taskReminders.slice(0, 5) : [
          { task: 'Check new leads', time: 'Now', priority: 'High' },
          { task: 'Update daily report', time: '05:00 PM', priority: 'Low' }
        ],
        assignedLeads: assignedLeads
      };
    } else if (role === 'ACCOUNTANT') {
      // Accountant stats - financial data from accounts table
      const accountStats = await Account.getStats();
      const agentStats = await Account.getAgentStats(req.user.id);
      const payrollStats = await getPayrollStats();

      stats = {
        totalCollections: parseFloat(accountStats.total_income || 0),
        pendingPayments: parseFloat(accountStats.total_expense || 0),
        agentCommissions: parseFloat(agentStats.agent_income || 0),
        netProfit: parseFloat(accountStats.net_profit || 0),
        totalIncome: parseFloat(accountStats.total_income || 0),
        totalExpense: parseFloat(accountStats.total_expense || 0),
        totalPayroll: payrollStats.totalPayroll,
        processedPayrolls: payrollStats.processedPayrolls,
        pendingReconciliations: payrollStats.pendingReconciliations
      };
    } else if (role === 'HR' || role === 'PAYROLL') {
      // HR/Payroll stats - staff performance from users and payroll tables
      const userStats = await User.getAll();
      const payrollStats = await getPayrollStats();
      const userPerformances = await getUserPerformances();

      stats = {
        totalStaff: userStats.length,
        activeStaff: userStats.filter(u => u.is_active).length,
        totalPayroll: payrollStats.totalPayroll,
        processedPayrolls: payrollStats.processedPayrolls,
        pendingReconciliations: payrollStats.pendingReconciliations,
        averageSalary: payrollStats.averageSalary,
        totalCommissions: payrollStats.totalCommissions,
        userPerformances: userPerformances
      };
    } else {
      // Default fallback for any other role
      stats = {
        totalPolicies: 0,
        totalClients: 0,
        totalRevenue: 0,
        activePolicies: 0,
        newLeads: 0,
        totalMessages: 0
      };
    }

    console.log('Dashboard stats response:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to get user performances
async function getUserPerformances(period = null) {
  try {
    // Get all users with their performance data
    const users = await User.getAll();
    const userPerformances = [];
    
    let dateFilter = '';
    if (period) {
      dateFilter = ` AND created_at >= CURRENT_DATE - INTERVAL '${period} days'`;
    }

    for (const user of users) {
      let performance = {
        id: user.id,
        name: user.name,
        role: user.role,
        totalPolicies: 0,
        activePolicies: 0,
        commissionEarned: 0,
        totalClients: 0,
        leadsGenerated: 0,
        totalScore: 0
      };

      // Get basic stats for everyone with date filter
      const policiesRes = await query(`SELECT * FROM policies WHERE agent_id = $1${dateFilter}`, [user.id]);
      
      let clientDateFilter = '';
      if (period) {
        clientDateFilter = ` AND c.joined_date >= CURRENT_DATE - INTERVAL '${period} days'`;
      }
      
      const clientsRes = await query(`
        SELECT c.* FROM clients c 
        JOIN policies p ON c.id = p.client_id 
        WHERE p.agent_id = $1${clientDateFilter}
        GROUP BY c.id
      `, [user.id]);
      
      const leadsRes = await query(`SELECT * FROM leads WHERE assigned_to = $1${dateFilter}`, [user.id]);
      
      const policies = policiesRes.rows;
      const leads = leadsRes.rows;
      const clients = clientsRes.rows;
      
      const commissionEarned = policies.reduce((sum, p) => sum + (parseFloat(p.net_comm || 0)), 0);
      const activePolicies = policies.filter(p => p.status === 'Active').length;

      performance.totalPolicies = policies.length;
      performance.activePolicies = activePolicies;
      performance.commissionEarned = commissionEarned;
      performance.totalClients = clients.length;
      performance.leadsGenerated = leads.length;

      if (user.role === 'SALES_AGENT') {
        performance.totalScore = commissionEarned + (activePolicies * 1000);
      } else if (user.role === 'MARKETER') {
        performance.totalScore = leads.length * 100;
      } else {
        performance.totalScore = commissionEarned + (activePolicies * 500) + (leads.length * 50);
      }

      userPerformances.push(performance);
    }

    // Sort by total score descending
    userPerformances.sort((a, b) => b.totalScore - a.totalScore);

    return userPerformances;
  } catch (error) {
    console.error('Error getting user performances:', error);
    return [];
  }
}

// Helper function to get payroll statistics
async function getPayrollStats() {
  try {
    const [payrollRunsRes, payrollEntriesRes, reconciliationsRes] = await Promise.all([
      query('SELECT * FROM payroll_runs'),
      query('SELECT * FROM payroll_entries'),
      query('SELECT * FROM reconciliations')
    ]);

    const payrollRuns = payrollRunsRes.rows;
    const payrollEntries = payrollEntriesRes.rows;
    const reconciliations = reconciliationsRes.rows;

    const totalPayroll = payrollEntries.reduce((sum, entry) => sum + parseFloat(entry.net_pay || 0), 0);
    const processedPayrolls = payrollRuns.filter(run => run.status === 'processed').length;
    const pendingReconciliations = reconciliations.filter(rec => !rec.payroll_run_id).length;
    const averageSalary = payrollEntries.length > 0 ? totalPayroll / payrollEntries.length : 0;
    const totalCommissions = payrollEntries.reduce((sum, entry) => sum + parseFloat(entry.commission_earned || 0), 0);

    return {
      totalPayroll,
      processedPayrolls,
      pendingReconciliations,
      averageSalary,
      totalCommissions
    };
  } catch (error) {
    console.error('Error getting payroll stats:', error);
    return {
      totalPayroll: 0,
      processedPayrolls: 0,
      pendingReconciliations: 0,
      averageSalary: 0,
      totalCommissions: 0
    };
  }
}

// Get recent activities
router.get('/activities', verifyToken, async (req, res) => {
  try {
    const activities = [];
    
    // Get recent policies
    const recentPolicies = await Policy.getAll(5, 0);
    recentPolicies.forEach(policy => {
      activities.push({
        id: `policy-${policy.id}`,
        user: 'System',
        action: 'added a new policy',
        target: policy.policy_number,
        time: policy.created_at,
        icon: 'Plus',
        color: 'text-blue-500 bg-blue-50'
      });
    });

    // Get recent clients
    const recentClients = await Client.getAll(3, 0);
    recentClients.forEach(client => {
      activities.push({
        id: `client-${client.id}`,
        user: 'System',
        action: 'added a new client',
        target: client.name,
        time: client.created_at,
        icon: 'Users',
        color: 'text-purple-500 bg-purple-50'
      });
    });

    // Get expiring policies
    const expiringPolicies = await Policy.getExpiringSoon(7);
    expiringPolicies.forEach(policy => {
      activities.push({
        id: `expiry-${policy.id}`,
        user: 'System',
        action: 'sent renewal reminder',
        target: policy.policy_number,
        time: new Date(),
        icon: 'Clock',
        color: 'text-amber-500 bg-amber-50'
      });
    });

    // Sort by time and return latest 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    res.json(sortedActivities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expiring policies
router.get('/expiring', verifyToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const role = req.user.role;
    const agentId = (role === 'SALES_AGENT') ? req.user.id : null;
    
    const policies = await Policy.getExpiringSoon(days, agentId);
    
    const expiringPolicies = policies.map(policy => {
      const expiryDate = new Date(policy.expiry_date);
      const today = new Date();
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        id: policy.id,
        policyNumber: policy.policy_number,
        clientName: policy.client_name || policy.clientName || 'N/A',
        clientId: policy.client_id,
        insuranceType: policy.insurance_type,
        expiryDate: expiryDate.toISOString().split('T')[0],
        daysUntilExpiry: diffDays,
        status: diffDays <= 7 ? 'critical' : 'warning'
      };
    });

    res.json(expiringPolicies);
  } catch (error) {
    console.error('Get expiring policies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get policy distribution
router.get('/policy-distribution', verifyToken, async (req, res) => {
  try {
    const policies = await Policy.getAll(1000); // Get all policies
    const distribution = {};

    policies.forEach(policy => {
      const type = policy.insurance_type;
      if (distribution[type]) {
        distribution[type]++;
      } else {
        distribution[type] = 1;
      }
    });

    const total = policies.length;
    const distributionData = Object.keys(distribution).map(type => ({
      name: type,
      value: Math.round((distribution[type] / total) * 100),
      count: distribution[type]
    }));

    res.json(distributionData);
  } catch (error) {
    console.error('Get policy distribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue data for charts
router.get('/revenue-data', verifyToken, async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30; // Last 30 days by default
    
    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - period);
    
    // Get policies data by date for revenue
    const policiesRes = await query(`
      SELECT 
        DATE(created_at) as date,
        SUM(premium) as revenue
      FROM policies 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);
    const policiesData = policiesRes.rows;
    
    // Create result array with all dates in range
    const result = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const revenue = parseFloat(policiesData.find(d => {
        const dStr = typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0];
        return dStr === dateStr;
      })?.revenue || 0);
      
      result.push({
        name: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: dateStr,
        revenue: revenue
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get revenue data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chart data for productivity trends (leads and messages)
router.get('/chart-data', verifyToken, async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30; // Last 30 days by default
    
    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - period);
    
    // Get leads data by date
    const leadsRes = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as leads
      FROM leads 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);
    const leadsData = leadsRes.rows;
    
    // Get SMS messages data by date
    const messagesRes = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as messages
      FROM sms_logs 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);
    const messagesData = messagesRes.rows;
    
    // Get policies data by date for revenue
    const policiesRes = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as policies,
        SUM(premium) as revenue
      FROM policies 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);
    const policiesData = policiesRes.rows;
    
    // Combine all data into a unified time series
    const allDates = new Set();
    if (leadsData && Array.isArray(leadsData)) {
      leadsData.forEach(item => {
        const d = typeof item.date === 'string' ? item.date : item.date.toISOString().split('T')[0];
        allDates.add(d);
      });
    }
    if (messagesData && Array.isArray(messagesData)) {
      messagesData.forEach(item => {
        const d = typeof item.date === 'string' ? item.date : item.date.toISOString().split('T')[0];
        allDates.add(d);
      });
    }
    if (policiesData && Array.isArray(policiesData)) {
      policiesData.forEach(item => {
        const d = typeof item.date === 'string' ? item.date : item.date.toISOString().split('T')[0];
        allDates.add(d);
      });
    }
    
    // Create result array with all dates in range
    const result = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const leads = leadsData.find(d => {
        const dStr = typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0];
        return dStr === dateStr;
      })?.leads || 0;
      
      const messages = messagesData.find(d => {
        const dStr = typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0];
        return dStr === dateStr;
      })?.messages || 0;
      
      const policiesCount = policiesData.find(d => {
        const dStr = typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0];
        return dStr === dateStr;
      })?.policies || 0;
      
      const revenue = parseFloat(policiesData.find(d => {
        const dStr = typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0];
        return dStr === dateStr;
      })?.revenue || 0);
      
      result.push({
        name: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: dateStr,
        leads: parseInt(leads),
        messages: parseInt(messages),
        policies: parseInt(policiesCount),
        revenue: revenue
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
