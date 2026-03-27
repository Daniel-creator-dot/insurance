import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { dashboardAPI } from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Mock data for fallback when API is not available
const mockData = [
  { name: 'Jan', value: 4000, leads: 2400, revenue: 4000, policies: 10, messages: 50 },
  { name: 'Feb', value: 3000, leads: 1398, revenue: 3000, policies: 8, messages: 45 },
  { name: 'Mar', value: 2000, leads: 9800, revenue: 2000, policies: 15, messages: 60 },
  { name: 'Apr', value: 2780, leads: 3908, revenue: 2780, policies: 12, messages: 55 },
  { name: 'May', value: 1890, leads: 4800, revenue: 1890, policies: 7, messages: 40 },
  { name: 'Jun', value: 2390, leads: 3800, revenue: 2390, policies: 11, messages: 52 },
  { name: 'Jul', value: 3490, leads: 4300, revenue: 3490, policies: 14, messages: 58 },
];

export const RevenueChart = ({ period = 30 }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching revenue data for ${period} days...`);
        const response = await dashboardAPI.getRevenueData(period);
        console.log('Revenue data response:', response);
        
        const data = response.data || [];
        console.log('Revenue data processed:', data);
        
        if (data.length === 0) {
          console.log('No revenue data received, using mock data');
          setChartData(mockData);
        } else {
          setChartData(data);
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        setError(error.message);
        // Use mock data as fallback
        setChartData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period]);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Error loading data: {error}</p>
          <p className="text-sm text-gray-500 mt-2">Using sample data</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>No revenue data available</p>
          <p className="text-sm text-gray-400 mt-2">Add some policies to see revenue trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }} 
          />
          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PerformanceChart = ({ period = 30 }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching performance chart data for ${period} days...`);
        const response = await dashboardAPI.getChartData(period);
        console.log('Performance chart data response:', response);
        
        const data = response.data || [];
        console.log('Performance chart data processed:', data);
        
        if (data.length === 0) {
          console.log('No performance data received, using mock data');
          setChartData(mockData);
        } else {
          setChartData(data);
        }
      } catch (error) {
        console.error('Error fetching performance chart data:', error);
        setError(error.message);
        // Use mock data as fallback
        setChartData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period]);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Error loading data: {error}</p>
          <p className="text-sm text-gray-500 mt-2">Using sample data</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>No performance data available</p>
          <p className="text-sm text-gray-400 mt-2">Add some leads, messages, or policies to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }} 
          />
          <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} name="Leads Generated" />
          <Bar dataKey="messages" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} name="Messages Sent" />
          <Bar dataKey="policies" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} name="Policies Sold" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PolicyDistribution = () => {
  const [distributionData, setDistributionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDistributionData = async () => {
      try {
        console.log('Fetching policy distribution data...');
        const response = await dashboardAPI.getPolicyDistribution();
        console.log('Policy distribution data response:', response);
        
        const data = response.data || [];
        console.log('Policy distribution data processed:', data);
        
        if (data.length === 0) {
          console.log('No policy distribution data received, using mock data');
          const pieData = [
            { name: 'Life', value: 400 },
            { name: 'Health', value: 300 },
            { name: 'Auto', value: 300 },
            { name: 'Home', value: 200 },
          ];
          setDistributionData(pieData);
        } else {
          setDistributionData(data);
        }
      } catch (error) {
        console.error('Error fetching policy distribution:', error);
        setError(error.message);
        // Use mock data as fallback
        const pieData = [
          { name: 'Life', value: 400 },
          { name: 'Health', value: 300 },
          { name: 'Auto', value: 300 },
          { name: 'Home', value: 200 },
        ];
        setDistributionData(pieData);
      } finally {
        setLoading(false);
      }
    };

    fetchDistributionData();
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Error loading data: {error}</p>
          <p className="text-sm text-gray-500 mt-2">Using sample data</p>
        </div>
      </div>
    );
  }

  if (distributionData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>No policy distribution data available</p>
          <p className="text-sm text-gray-400 mt-2">Add some policies to see distribution</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={distributionData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {distributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LeadsSourceChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { source: 'Website', count: 45 },
    { source: 'Referral', count: 32 },
    { source: 'Social Media', count: 28 },
    { source: 'Cold Call', count: 15 },
    { source: 'Other', count: 10 }
  ];

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="source" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LeadsStatusChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data.map(d => ({ name: d.status, value: d.count })) : [
    { name: 'New', value: 40 },
    { name: 'Contacted', value: 30 },
    { name: 'Qualified', value: 20 },
    { name: 'Converted', value: 10 }
  ];

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
