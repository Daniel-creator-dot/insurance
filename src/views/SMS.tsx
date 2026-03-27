import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  History, 
  Settings, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Trash2,
  Copy,
  Edit,
  Key,
  Save,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { SMSLog, Role } from '../types';
import { smsAPI, clientAPI, smsConfigAPI, smsTemplateAPI } from '../services/api';
import { useNotification } from '../components/Notification';
import Modal from '../components/Modal';

interface SMSViewProps {
  role: Role;
}


const SMSView: React.FC<SMSViewProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'templates' | 'send'>('logs');
  const [apiStatus, setApiStatus] = useState<'Connected' | 'Disconnected' | 'Testing'>('Disconnected');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [templateToUse, setTemplateToUse] = useState<string | null>(null);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smsConfigs, setSmsConfigs] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All Status' | 'Sent' | 'Failed' | 'Pending'>('All Status');
  
  // Import notification hooks
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const fetchSMSLogs = async () => {
      try {
        setLoading(true);
        console.log('Fetching SMS logs...');
        const response = await smsAPI.getAll(20, 0);
        console.log('SMS logs response:', response);
        
        // Handle different response structures
        let logsData;
        if (response.data && response.data.sms_logs) {
          // Backend returns { sms_logs: [...], pagination: {...} }
          logsData = response.data.sms_logs;
        } else if (Array.isArray(response.data)) {
          // Backend returns array directly
          logsData = response.data;
        } else {
          // Fallback to empty array if response structure is unexpected
          console.warn('Unexpected SMS logs response structure, using empty array');
          logsData = [];
        }
        
        setSmsLogs(logsData);
      } catch (error) {
        console.error('Error fetching SMS logs:', error);
        // Use empty array as fallback
        setSmsLogs([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchClients = async () => {
      try {
        console.log('Fetching clients for SMS...');
        const response = await clientAPI.getAll(100, 0);
        console.log('Clients response:', response);
        
        // Handle different response structures
        let clientsData;
        if (response.data && response.data.clients) {
          // Backend returns { clients: [...], pagination: {...} }
          clientsData = response.data.clients;
        } else if (Array.isArray(response.data)) {
          // Backend returns array directly
          clientsData = response.data;
        } else {
          // Fallback to empty array if response structure is unexpected
          console.warn('Unexpected clients response structure, using empty array');
          clientsData = [];
        }
        
        console.log('Loaded clients:', clientsData);
        
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
        // Use empty array as fallback
        setClients([]);
      }
    };

    const fetchSMSConfigs = async () => {
      try {
        console.log('Fetching SMS configs...');
        const response = await smsConfigAPI.getAll();
        console.log('SMS configs response:', response);
        
        // Handle different response structures
        let configsData;
        if (response.data && response.data.sms_configs) {
          // Backend returns { sms_configs: [...], pagination: {...} }
          configsData = response.data.sms_configs;
        } else if (Array.isArray(response.data)) {
          // Backend returns array directly
          configsData = response.data;
        } else {
          // Fallback to empty array if response structure is unexpected
          console.warn('Unexpected SMS configs response structure, using empty array');
          configsData = [];
        }
        
        setSmsConfigs(configsData);
        
        // Check if any config is active
        const activeConfig = configsData.find(config => config.is_active);
        if (activeConfig) {
          setApiStatus('Connected');
        } else {
          setApiStatus('Disconnected');
        }
      } catch (error) {
        console.error('Error fetching SMS configs:', error);
        // Use empty array as fallback
        setSmsConfigs([]);
        setApiStatus('Disconnected');
      }
    };

    const fetchTemplates = async () => {
      try {
        const response = await smsTemplateAPI.getAll();
        setTemplates(response.data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates([]);
      }
    };

    fetchSMSLogs();
    fetchClients();
    fetchSMSConfigs();
    fetchTemplates();
  }, []);

  // Handle prefilled data from Dashboard
  useEffect(() => {
    if (clients.length > 0) {
      const prefill = localStorage.getItem('sms_prefill');
      if (prefill) {
        try {
          const { clientId, message } = JSON.parse(prefill);
          if (clientId) {
            console.log('Applying prefill clientId:', clientId);
            setSelectedClient(clientId.toString());
          }
          if (message) {
            setMessageContent(message);
            setMessageCount(Math.ceil(message.length / 160));
          }
          setActiveTab('send');
          // Clear prefill after reading
          localStorage.removeItem('sms_prefill');
        } catch (e) {
          console.error('Error parsing SMS prefill data:', e);
        }
      }
    }
  }, [clients]);

  const getStatusBadge = (status: SMSLog['status']) => {
    switch (status) {
      case 'Sent':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase flex items-center gap-1 w-fit"><CheckCircle2 size={10} /> Sent</span>;
      case 'Pending':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase flex items-center gap-1 w-fit"><Clock size={10} /> Pending</span>;
      case 'Failed':
        return <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase flex items-center gap-1 w-fit"><XCircle size={10} /> Failed</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded uppercase flex items-center gap-1 w-fit">Unknown</span>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      console.log('Formatting timestamp:', timestamp, 'Type:', typeof timestamp);
      
      // Handle different timestamp formats
      let date;
      
      // If it's already a valid date string
      if (timestamp && timestamp.includes('T')) {
        date = new Date(timestamp);
      } 
      // If it's a PostgreSQL timestamp with timezone (e.g., "2026-03-04 15:33:25.269495+00")
      else if (timestamp && timestamp.includes(' ')) {
        // Remove microseconds and timezone, keep only date and time
        const cleanTimestamp = timestamp.split('.')[0];
        console.log('Cleaned timestamp:', cleanTimestamp);
        const [datePart, timePart] = cleanTimestamp.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        console.log('Parsed parts:', { year, month, day, hour, minute, second });
        date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)));
      } 
      // If it's just a date
      else if (timestamp) {
        date = new Date(timestamp);
      } else {
        return 'N/A';
      }

      console.log('Created date object:', date, 'Time:', date.getTime());
      
      if (isNaN(date.getTime())) {
        console.log('Date is NaN, returning original timestamp');
        return timestamp;
      }

      const formatted = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      console.log('Formatted timestamp:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error formatting timestamp:', error, 'Input:', timestamp);
      return timestamp;
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return;
    try {
      await smsTemplateAPI.create({ name: newTemplateName, content: newTemplateContent });
      const response = await smsTemplateAPI.getAll();
      setTemplates(response.data || []);
      setNewTemplateName('');
      setNewTemplateContent('');
      setShowCreateTemplate(false);
      showSuccess('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      showError('Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (editingTemplate === null || !newTemplateName.trim() || !newTemplateContent.trim()) return;
    
    // Find the template being edited to get its actual ID from the database
    const templateToEdit = templates[editingTemplate as number];
    if (!templateToEdit || !templateToEdit.id) {
      showError('Could not find template to update');
      return;
    }

    try {
      await smsTemplateAPI.update(templateToEdit.id, { name: newTemplateName, content: newTemplateContent });
      const response = await smsTemplateAPI.getAll();
      setTemplates(response.data || []);
      setEditingTemplate(null);
      setNewTemplateName('');
      setNewTemplateContent('');
      showSuccess('Template updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      showError('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: number | string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await smsTemplateAPI.delete(id);
      const response = await smsTemplateAPI.getAll();
      setTemplates(response.data || []);
      showSuccess('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Failed to delete template');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SMS Center</h1>
          <p className="text-slate-500 text-sm">Automated reminders and manual messaging system.</p>
        </div>
        <button 
          onClick={() => setActiveTab('send')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          <Send size={18} /> Send Manual SMS
        </button>
      </div>

      <div className="flex border-b border-slate-200 gap-8">
        {[
          { id: 'logs', label: 'SMS Logs', icon: History },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'send', label: 'Compose', icon: Send },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-4 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      {/* SMS Configuration Status */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {apiStatus === 'Connected' ? (
              <Wifi className="text-emerald-600" size={20} />
            ) : (
              <WifiOff className="text-red-600" size={20} />
            )}
            <div>
              <p className="font-bold text-slate-800">SMS Gateway Status</p>
              <p className="text-sm text-slate-400">Currently {apiStatus.toLowerCase()}</p>
            </div>
          </div>
          {apiStatus === 'Disconnected' && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl">
              <AlertCircle size={16} />
              <span className="text-sm font-bold">Configure SMS settings in Settings</span>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search logs by recipient or message..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            >
              <option>All Status</option>
              <option>Sent</option>
              <option>Failed</option>
              <option>Pending</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {smsLogs
                  .filter((log) => {
                    const matchesSearch = 
                      log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      log.message.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = statusFilter === 'All Status' || log.status === statusFilter;
                    return matchesSearch && matchesStatus;
                  })
                  .map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{log.recipient}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{log.message}</td>
                    <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatTimestamp(log.sent_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(log.message);
                          showSuccess('Message copied to clipboard');
                        }}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Copy message"
                      >
                        <Copy size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Create Template Modal */}
          <Modal 
            isOpen={showCreateTemplate} 
            onClose={() => setShowCreateTemplate(false)}
            title="Create New Template"
            size="sm"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Template Name</label>
                <input 
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Policy Renewal Reminder"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Template Content</label>
                <textarea 
                  rows={4}
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  placeholder="e.g., Hello {client_name}, your policy expires on {expiry_date}..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
                <p className="text-xs text-slate-400">Use placeholders like &#123;client_name&#125;, &#123;policy_number&#125;, &#123;expiry_date&#125;</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Create Template
              </button>
              <button 
                onClick={() => setShowCreateTemplate(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </Modal>

          {/* Edit Template Modal */}
          <Modal
            isOpen={editingTemplate !== null}
            onClose={() => {
              setEditingTemplate(null);
              setNewTemplateName('');
              setNewTemplateContent('');
            }}
            title="Edit Template"
            size="sm"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Template Name</label>
                <input 
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Template Content</label>
                <textarea 
                  rows={4}
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
                <p className="text-xs text-slate-400">Use placeholders like &#123;client_name&#125;, &#123;policy_number&#125;, &#123;expiry_date&#125;</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleUpdateTemplate}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all"
              >
                Save Changes
              </button>
              <button 
                onClick={() => {
                  setEditingTemplate(null);
                  setNewTemplateName('');
                  setNewTemplateContent('');
                }}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </Modal>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, i) => (
              <div key={template.id || i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">{template.name}</h3>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingTemplate(i);
                        setNewTemplateName(template.name);
                        setNewTemplateContent(template.content);
                      }}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1 italic">
                  "{template.content}"
                </p>
                <button 
                  onClick={() => {
                    setMessageContent(template.content);
                    setMessageCount(Math.ceil(template.content.length / 160));
                    setActiveTab('send');
                  }}
                  className="mt-4 w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                >
                  Use Template
                </button>
              </div>
            ))}
            <button 
              onClick={() => {
                setNewTemplateName('');
                setNewTemplateContent('');
                setShowCreateTemplate(true);
              }}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-brand-600 hover:border-brand-300 transition-all bg-white/50"
            >
              <Plus size={32} className="mb-2" />
              <span className="font-bold text-sm">Create New Template</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Send Manual Message</h3>
          
          {/* SMS Gateway Status Warning */}
          {apiStatus === 'Disconnected' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-amber-600" size={20} />
                <div>
                  <p className="font-bold text-amber-900">SMS Gateway Not Configured</p>
                  <p className="text-sm text-amber-700">Please configure your SMS gateway settings in Settings to send messages.</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Recipient</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.phone})
                  </option>
                ))}
              </select>
            </div>
            {templates.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Use Template (Optional)</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                  value={templateToUse || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setTemplateToUse(selectedId);
                    const template = templates.find(t => t.id.toString() === selectedId);
                    if (template) {
                      let content = template.content;
                      // Simple placeholder replacement if client is selected
                      if (selectedClient) {
                        const client = clients.find(c => c.id.toString() === selectedClient);
                        if (client) {
                          content = content.replace(/{client_name}/g, client.name);
                          content = content.replace(/{clientName}/g, client.name);
                        }
                      }
                      setMessageContent(content);
                      setMessageCount(Math.ceil(content.length / 160));
                    }
                  }}
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-700">Message</label>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{messageContent.length} / 160 characters</span>
              </div>
              <textarea 
                rows={4}
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => {
                  setMessageContent(e.target.value);
                  setMessageCount(Math.ceil(e.target.value.length / 160));
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              ></textarea>
            </div>
            <div className="flex gap-3">
              <button 
                className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  apiStatus === 'Connected' 
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20 flex items-center justify-center gap-2'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
                disabled={apiStatus !== 'Connected' || !selectedClient || !messageContent.trim()}
                onClick={async () => {
                  if (apiStatus !== 'Connected') {
                    alert('Please configure SMS gateway settings first.');
                    return;
                  }
                  
                  if (!selectedClient || !messageContent.trim()) {
                    alert('Please select a recipient and enter a message.');
                    return;
                  }

                  try {
                    console.log('Attempting to send SMS...');
                    console.log('Selected client ID:', selectedClient);
                    console.log('Selected client ID type:', typeof selectedClient);
                    console.log('Available clients:', clients);

                    // Find the selected client
                    let client = clients.find(c => c.id === selectedClient);
                    if (!client) {
                      // Try converting to number if it's a string
                      const numericId = Number(selectedClient);
                      client = clients.find(c => c.id === numericId);
                      if (client) {
                        console.log('Found client by numeric ID:', client);
                      } else {
                        alert('Client not found.');
                        console.error('Client lookup failed. Selected ID:', selectedClient, 'Available clients:', clients);
                        return;
                      }
                    }

                    console.log('Selected client:', client);
                    console.log('Active configs:', smsConfigs);

                    // Find the active SMS config
                    const activeConfig = smsConfigs.find(config => config.is_active);
                    if (!activeConfig) {
                      alert('No active SMS configuration found.');
                      return;
                    }

                    console.log('Using config:', activeConfig);

                    // Send the SMS
                    const response = await smsAPI.send({
                      recipient: client.phone,
                      message: messageContent,
                      config_id: activeConfig.id
                    });

                    console.log('SMS sent successfully:', response);

                    // Refresh the logs to show the new message
                    const logsResponse = await smsAPI.getAll(20, 0);
                    let logsData;
                    if (logsResponse.data && logsResponse.data.sms_logs) {
                      logsData = logsResponse.data.sms_logs;
                    } else if (Array.isArray(logsResponse.data)) {
                      logsData = logsResponse.data;
                    } else {
                      logsData = [];
                    }
                    
                    console.log('Updated SMS logs:', logsData);
                    setSmsLogs(logsData);

                    // Reset form
                    setSelectedClient('');
                    setMessageContent('');
                    setMessageCount(0);

                    // Show success notification
                    showSuccess('SMS Sent', 'Your message has been sent successfully!', 3000);
                  } catch (error) {
                    console.error('Error sending SMS:', error);
                    // Show error notification
                    showError('SMS Failed', 'There was an error sending your message. Please try again.', 5000);
                  }
                }}
              >
                <Send size={18} /> Send Message
              </button>
              <button 
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                onClick={() => {
                  setSelectedClient('');
                  setMessageContent('');
                  setMessageCount(0);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SMSView;
