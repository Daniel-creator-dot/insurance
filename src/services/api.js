import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://insuranceapi-9r4t.onrender.com/api';

// Create axios instance with timeout and retry settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,  // 30 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('insurify_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add retry count
    config.retryCount = config.retryCount || 0;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors with retry logic
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config;

    // Handle 401 - Unauthorized
    // Skip redirect for login requests — let the login page show the error inline
    if (error.response?.status === 401) {
      const requestUrl = config?.url || '';
      const isLoginRequest = requestUrl.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('insurify_token');
        localStorage.removeItem('insurify_user');
        window.location.href = '/';
      }
      return Promise.reject(error);
    }

    // Handle 429 - Too Many Requests (Rate Limiting)
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, waiting before retry...');
      // Wait 5 seconds before retrying
      return new Promise(resolve => {
        setTimeout(() => {
          config.retryCount = (config.retryCount || 0) + 1;
          resolve(api(config));
        }, 5000);
      });
    }

    // Handle 503 (timeout) and 5xx errors with retry
    const shouldRetry = error.code === 'ECONNABORTED' ||
      error.response?.status >= 500 ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT';

    if (shouldRetry && config && config.retryCount < 3) {
      config.retryCount += 1;
      const delay = Math.pow(2, config.retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s

      console.warn(`Request failed, retrying (attempt ${config.retryCount}/3) after ${delay}ms`, {
        url: config.url,
        status: error.response?.status,
        code: error.code
      });

      return new Promise(resolve => {
        setTimeout(() => resolve(api(config)), delay);
      });
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  getUsers: () => api.get('/auth/users'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Users endpoints
export const userAPI = {
  getAll: () => api.get('/auth/users'),
  getById: (id) => api.get(`/auth/users/${id}`),
  create: (userData) => api.post('/auth/register', userData),
  update: (id, userData) => api.put(`/auth/users/${id}`, userData),
  delete: (id) => api.delete(`/auth/users/${id}`),
  bulkUpdateSalaries: (updates) => api.post('/auth/users/salaries-bulk', { updates }),
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: (period = 30) => api.get(`/dashboard/stats?period=${period}`),
  getActivities: () => api.get('/dashboard/activities'),
  getExpiringPolicies: (days = 30) => api.get(`/dashboard/expiring?days=${days}`),
  getPolicyDistribution: () => api.get('/dashboard/policy-distribution'),
  getRevenueData: (period = 7) => api.get(`/dashboard/revenue-data?period=${period}`),
  getChartData: (period = 30) => api.get(`/dashboard/chart-data?period=${period}`),
};

// Policy endpoints
export const policyAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/policies?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/policies/${id}`),
  create: (policyData) => api.post('/policies', policyData),
  update: (id, policyData) => api.put(`/policies/${id}`, policyData),
  delete: (id) => api.delete(`/policies/${id}`),
  search: (term) => api.get(`/policies/search/${term}`),
  getByAgent: (agentId) => api.get(`/policies/agent/${agentId}`),
  getByClient: (clientId) => api.get(`/policies/client/${clientId}`),
  getExpiringSoon: (days = 30) => api.get(`/policies/expiring/${days}`),
  getByType: (type) => api.get(`/policies/type/${type}`),
  getStats: () => api.get('/policies/stats'),
  getMaxCommissionRate: (classOfBusiness) => api.get(`/policies/commission/max/${encodeURIComponent(classOfBusiness)}`),
};

// Client endpoints
export const clientAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/clients?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/clients/${id}`),
  create: (clientData) => api.post('/clients', clientData),
  update: (id, clientData) => api.put(`/clients/${id}`, clientData),
  delete: (id) => api.delete(`/clients/${id}`),
  search: (term) => api.get(`/clients/search/${term}`),
  getByAgent: (agentId) => api.get(`/clients/agent/${agentId}`),
  getCount: () => api.get('/clients/count'),
};

// Lead endpoints
export const leadAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/leads?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/leads/${id}`),
  create: (leadData) => api.post('/leads', leadData),
  update: (id, leadData) => api.put(`/leads/${id}`, leadData),
  delete: (id) => api.delete(`/leads/${id}`),
  updateStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }),
  search: (term) => api.get(`/leads/search/${term}`),
  getByAssignee: (assigneeId) => api.get(`/leads/assignee/${assigneeId}`),
  getStats: () => api.get('/leads/stats'),
  getCount: () => api.get('/leads/count'),
};

// Account endpoints
export const accountAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/accounts?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (accountData) => api.post('/accounts', accountData),
  update: (id, accountData) => api.put(`/accounts/${id}`, accountData),
  delete: (id) => api.delete(`/accounts/${id}`),
  search: (term) => api.get(`/accounts/search/${term}`),
  getByAgent: (agentId) => api.get(`/accounts/agent/${agentId}`),
  getByType: (type) => api.get(`/accounts/type/${type}`),
  getStats: () => api.get('/accounts/stats'),
  getMonthlyStats: (month, year) => api.get(`/accounts/stats/monthly/${month}/${year}`),
  getAgentStats: (agentId) => api.get(`/accounts/stats/agent/${agentId}`),
  getCount: () => api.get('/accounts/count'),
  // accounting-specific
  getReconciliation: (limit = 50, offset = 0) => api.get(`/accounts/reconciliation?limit=${limit}&offset=${offset}`),
  getProfitLoss: (month, year) => {
    if (month && year) {
      return api.get(`/accounts/profitloss?month=${month}&year=${year}`);
    }
    return api.get('/accounts/profitloss');
  }
};

// Journal entries endpoints
export const journalAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/journal?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/journal/${id}`),
  create: (data) => api.post(`/journal`, data),
  update: (id, data) => api.put(`/journal/${id}`, data),
  delete: (id) => api.delete(`/journal/${id}`),
};

// Chart of accounts endpoints
export const chartAPI = {
  getAll: (limit = 100, offset = 0) => api.get(`/chart?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/chart/${id}`),
  create: (data) => api.post(`/chart`, data),
  update: (id, data) => api.put(`/chart/${id}`, data),
  delete: (id) => api.delete(`/chart/${id}`),
};

// Cheque endpoints
export const chequeAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/cheques?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/cheques/${id}`),
  create: (data) => api.post(`/cheques`, data),
  update: (id, data) => api.put(`/cheques/${id}`, data),
  delete: (id) => api.delete(`/cheques/${id}`),
};

// Payment voucher endpoints
export const paymentVoucherAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/payment-vouchers?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/payment-vouchers/${id}`),
  create: (data) => api.post(`/payment-vouchers`, data),
  update: (id, data) => api.put(`/payment-vouchers/${id}`, data),
  delete: (id) => api.delete(`/payment-vouchers/${id}`),
};

// Bank endpoints
export const bankAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/banks?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/banks/${id}`),
  create: (data) => api.post(`/banks`, data),
  update: (id, data) => api.put(`/banks/${id}`, data),
  delete: (id) => api.delete(`/banks/${id}`),
};

// SMS endpoints
export const smsAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/sms?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/sms/${id}`),
  getByClient: (clientId) => api.get(`/sms/client/${encodeURIComponent(clientId)}`),
  send: (smsData) => api.post('/sms/send', smsData),
  updateStatus: (id, status) => api.patch(`/sms/${id}/status`, { status }),
  delete: (id) => api.delete(`/sms/${id}`),
  getStats: () => api.get('/sms/stats'),
  getCount: () => api.get('/sms/count'),
};

// SMS Template endpoints
export const smsTemplateAPI = {
  getAll: () => api.get('/sms/templates/all'),
  create: (templateData) => api.post('/sms/templates', templateData),
  update: (id, templateData) => api.put(`/sms/templates/${id}`, templateData),
  delete: (id) => api.delete(`/sms/templates/${id}`),
};

// SMS Configuration endpoints
export const smsConfigAPI = {
  getAll: () => api.get('/sms-config'),
  getActive: () => api.get('/sms-config/active'),
  getById: (id) => api.get(`/sms-config/${id}`),
  getByProvider: (provider) => api.get(`/sms-config/provider/${provider}`),
  create: (configData) => api.post('/sms-config', configData),
  update: (id, configData) => api.put(`/sms-config/${id}`, configData),
  activate: (id) => api.patch(`/sms-config/${id}/activate`),
  deactivate: (id) => api.patch(`/sms-config/${id}/deactivate`),
  delete: (id) => api.delete(`/sms-config/${id}`),
};

// Commission rate endpoints
export const commissionRateAPI = {
  getAll: () => api.get('/commission-rates'),
  create: (data) => api.post('/commission-rates', data),
  update: (id, data) => api.put(`/commission-rates/${id}`, data),
  delete: (id) => api.delete(`/commission-rates/${id}`),
};

// AI endpoints
export const aiAPI = {
  chat: (message, role) => api.post('/ai/chat', { message, role }),
  getInsights: () => api.get('/ai/insights'),
  getPolicyRecommendations: () => api.get('/ai/policy-recommendations'),
};

// Payroll endpoints
export const payrollAPI = {
  getAll: (limit = 10, offset = 0) => api.get(`/payroll?limit=${limit}&offset=${offset}`),
  getById: (id) => api.get(`/payroll/${id}`),
  calculate: (period_start, period_end) => api.post('/payroll/calculate', { period_start, period_end }),
  process: (period_start, period_end) => api.post('/payroll/process', { period_start, period_end }),
  // Get staff specific payroll entries (which holds the actual gross/net payload)
  getByUser: (userId, limit = 10, offset = 0) => api.get(`/payroll/user/${userId}?limit=${limit}&offset=${offset}`),
  // Reconciliation endpoints
  getReconciliation: (limit = 10, offset = 0) => api.get(`/payroll/reconciliation?limit=${limit}&offset=${offset}`),
  getReconciliationByStaff: (staffId, limit = 10, offset = 0) => api.get(`/payroll/reconciliation/staff/${staffId}?limit=${limit}&offset=${offset}`),
  getReconciliationByMonth: (month) => api.get(`/payroll/reconciliation/month/${month}`),
  getReconciliationByStaffAndMonth: (staffId, month) => api.get(`/payroll/reconciliation/${staffId}/${month}`),
};

// Settings / Company Settings endpoints
export const settingsAPI = {
  getCompanyInfo: () => api.get('/company-settings'),
  updateCompanyInfo: (data) => api.put('/company-settings', data),
};

export default api;