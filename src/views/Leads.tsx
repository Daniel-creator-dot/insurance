import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Plus, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Filter
} from 'lucide-react';
import Modal from '../components/Modal';
import { leadAPI, authAPI, clientAPI } from '../services/api';
import { Lead, Message, User } from '../types';



const LeadsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadStats, setLeadStats] = useState<any>(null);
  const [newNote, setNewNote] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close dropdown if clicking outside of any dropdown content
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load current user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('insurify_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    }
  }, []);

  // Helper function to map backend lead data to frontend format
  const mapBackendLeadToFrontend = (lead: any): Lead => {
    return {
      ...lead,
      // Map backend fields to frontend convenience properties
      assignedTo: lead.assigned_to_name || (lead.assigned_to ? `User ${lead.assigned_to}` : null),
      date: lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
      progress: lead.status === 'Qualified' ? 100 : lead.status === 'Contacted' ? 50 : 10,
      communicationHistory: lead.communication_history || []
    };
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [limit] = useState(10); // Number of leads per page

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        console.log('Fetching leads...');
        const offset = (currentPage - 1) * limit;
        const response = await leadAPI.getAll(limit, offset);
        console.log('Leads response:', response);
        
        // Handle different response structures
        let leadsData;
        let paginationData;
        
        if (response.data && response.data.leads) {
          leadsData = response.data.leads.map(mapBackendLeadToFrontend);
          paginationData = response.data.pagination;
        } else if (Array.isArray(response.data)) {
          leadsData = response.data.map(mapBackendLeadToFrontend);
          try {
            const countResponse = await leadAPI.getCount();
            const totalCount = countResponse.data?.count || leadsData.length;
            paginationData = {
              total: totalCount,
              limit,
              offset,
              pages: Math.ceil(totalCount / limit)
            };
          } catch (countError) {
            console.warn('Could not fetch lead count:', countError);
            paginationData = {
              total: leadsData.length,
              limit,
              offset,
              pages: 1
            };
          }
        } else {
          console.warn('Unexpected response structure');
          leadsData = [];
          paginationData = { total: 0, limit, offset: 0, pages: 1 };
        }
        
        setLeads(leadsData);
        setTotalPages(paginationData.pages || 1);
        setTotalLeads(paginationData.total || leadsData.length);
      } catch (error) {
        console.error('Error fetching leads:', error);
        setLeads([]);
        setTotalPages(1);
        setTotalLeads(0);
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await authAPI.getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchLeadStats = async () => {
      try {
        const response = await leadAPI.getStats();
        setLeadStats(response.data);
      } catch (error) {
        console.error('Error fetching lead stats:', error);
      }
    };

    fetchLeads();
    fetchUsers();
    fetchLeadStats();
  }, [currentPage, limit]);

  const handleStatusChange = async (id: string, newStatus: Lead['status']) => {
    try {
      const currentLead = leads.find(l => l.id === id) || selectedLead;
      if (!currentLead) return;

      const newProgress = newStatus === 'Qualified' ? 100 : newStatus === 'Contacted' ? 50 : 10;
      const historyEntry: Message = {
        id: `m-${Date.now()}`,
        type: 'Note',
        content: `Status updated to ${newStatus}.`,
        date: new Date().toLocaleString(),
        sender: currentUser?.name || 'System'
      };

      const updatedHistory = [...(currentLead.communicationHistory || []), historyEntry];
      
      const updateData = {
        status: newStatus,
        communication_history: updatedHistory
      };

      await leadAPI.update(id, updateData);

      // If status is changed to Qualified, add to clients
      if (newStatus === 'Qualified') {
        try {
          // Check if client already exists by phone
          const clientSearch = await clientAPI.search(currentLead.phone);
          const existingClients = clientSearch.data.clients || clientSearch.data || [];
          
          if (existingClients.length === 0) {
            await clientAPI.create({
              name: currentLead.name,
              email: currentLead.email,
              phone: currentLead.phone,
              address: 'Lead Conversion',
              joined_date: new Date().toISOString()
            });
            console.log('Lead converted to client successfully');
          }
        } catch (clientError) {
          console.error('Error creating client from qualified lead:', clientError);
        }
      }

      const updateFrontendLead = (l: Lead) => ({ 
        ...l, 
        status: newStatus, 
        progress: newProgress, 
        communicationHistory: updatedHistory 
      });

      setLeads(prev => prev.map(l => l.id === id ? updateFrontendLead(l) : l));
      if (selectedLead?.id === id) {
        setSelectedLead(prev => prev ? updateFrontendLead(prev) : null);
      }
      setNotification({ show: true, message: `Status updated to ${newStatus}`, type: 'success' });
    } catch (error) {
      console.error('Error updating lead status:', error);
      setNotification({ show: true, message: 'Error updating status', type: 'error' });
    }
  };

  const handleAssignChange = async (id: string, assigneeId: string) => {
    try {
      const currentLead = leads.find(l => l.id === id) || selectedLead;
      if (!currentLead) return;

      const user = users.find(u => u.id.toString() === assigneeId);
      const assigneeName = user ? user.name : 'Unassigned';

      const historyEntry: Message = {
        id: `m-${Date.now()}`,
        type: 'Note',
        content: `Lead assigned to ${assigneeName}.`,
        date: new Date().toLocaleString(),
        sender: currentUser?.name || 'System'
      };

      const updatedHistory = [...(currentLead.communicationHistory || []), historyEntry];
      
      const updateData = {
        assigned_to: assigneeId ? parseInt(assigneeId) : null,
        communication_history: updatedHistory
      };

      await leadAPI.update(id, updateData);

      const updateFrontendLead = (l: Lead) => ({ 
        ...l, 
        assigned_to: assigneeId ? parseInt(assigneeId) : null,
        assignedTo: assigneeName,
        communicationHistory: updatedHistory 
      });

      setLeads(prev => prev.map(l => l.id === id ? updateFrontendLead(l) : l));
      if (selectedLead?.id === id) {
        setSelectedLead(prev => prev ? updateFrontendLead(prev) : null);
      }
      setNotification({ show: true, message: `Assigned to ${assigneeName}`, type: 'success' });
    } catch (error) {
      console.error('Error updating lead assignment:', error);
      setNotification({ show: true, message: 'Error updating assignment', type: 'error' });
    }
  };

  const handleAddNote = async () => {
    try {
      if (!selectedLead || !newNote.trim()) return;
      
      const historyEntry: Message = {
        id: `m-${Date.now()}`,
        type: 'Note',
        content: newNote,
        date: new Date().toLocaleString(),
        sender: currentUser?.name || 'Current User'
      };

      const updatedHistory = [...(selectedLead.communicationHistory || []), historyEntry];

      // Update the lead in the backend
      await leadAPI.update(selectedLead.id, {
        communication_history: updatedHistory
      });

      const updateLead = (l: Lead) => ({ ...l, communicationHistory: updatedHistory });
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updateLead(l) : l));
      setSelectedLead(prev => prev ? updateLead(prev) : null);
      setNewNote('');
      setNotification({ show: true, message: 'Note added successfully', type: 'success' });
    } catch (error) {
      console.error('Error adding note:', error);
      setNotification({ show: true, message: 'Error adding note', type: 'error' });
    }
  };

  // Form state for new lead
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Website',
    status: 'New',
    assigned_to: '',
    created_at: new Date().toISOString().split('T')[0]
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLead(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission for creating new lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating lead:', newLead);
      
      // Transform form data to match backend API expectations
      const leadData = {
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        source: newLead.source,
        status: newLead.status,
        assigned_to: newLead.assigned_to ? parseInt(newLead.assigned_to) : null,
        created_at: newLead.created_at
      };
      
      console.log('Sending lead data:', leadData);
      const response = await leadAPI.create(leadData);
      console.log('Lead created:', response);
      
      // Show success notification
      setNotification({ show: true, message: 'Lead created successfully!', type: 'success' });
      
      // Refresh the leads list
      const fetchLeads = async () => {
        const offset = (currentPage - 1) * limit;
        const response = await leadAPI.getAll(limit, offset);
        let leadsData;
        if (response.data && response.data.leads) {
          leadsData = response.data.leads.map(mapBackendLeadToFrontend);
        } else if (Array.isArray(response.data)) {
          leadsData = response.data.map(mapBackendLeadToFrontend);
        } else {
          leadsData = [];
        }
        setLeads(leadsData);
      };
      fetchLeads();
      
      // Reset form and close modal
      setNewLead({
        name: '',
        email: '',
        phone: '',
        source: 'Website',
        status: 'New',
        assigned_to: '',
        created_at: new Date().toISOString().split('T')[0]
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating lead:', error);
      // Show error notification
      setNotification({ show: true, message: 'Error creating lead. Please try again.', type: 'error' });
    }
  };

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'New':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">New</span>;
      case 'Contacted':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase">Contacted</span>;
      case 'Qualified':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase">Qualified</span>;
      case 'Lost':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">Lost</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads Management</h1>
          <p className="text-slate-500 text-sm">Track and convert potential clients into policy holders.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus size={18} /> Add New Lead
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Leads</p>
          <h3 className="text-2xl font-bold text-slate-900">{leadStats?.totalLeads ?? totalLeads}</h3>
          <p className="text-xs text-slate-400 mt-2">All time</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">New Leads</p>
          <h3 className="text-2xl font-bold text-slate-900">{leadStats?.newLeads ?? 0}</h3>
          <p className="text-xs text-slate-400 mt-2">Awaiting contact</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Contacted</p>
          <h3 className="text-2xl font-bold text-slate-900">{leadStats?.contactedLeads ?? 0}</h3>
          <p className="text-xs text-slate-400 mt-2">In progress</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Qualified</p>
          <h3 className="text-2xl font-bold text-slate-900">{leadStats?.qualifiedLeads ?? 0}</h3>
          <p className="text-xs text-slate-400 mt-2">Converted to clients</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search leads by name, email or phone..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Source:</span>
            <select 
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="All">All Sources</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Social Media">Social Media</option>
              <option value="Direct Call">Direct Call</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Lead Name</th>
              <th className="px-6 py-4">Contact Info</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Status & Progress</th>
              <th className="px-6 py-4">Date Added</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.filter(l => {
              const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    l.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    l.phone.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
              const matchesSource = sourceFilter === 'All' || l.source === sourceFilter;
              return matchesSearch && matchesStatus && matchesSource;
            }).map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setSelectedLead(lead); setIsDetailsModalOpen(true); }}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <UserIcon size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{lead.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail size={12} /> {lead.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={12} /> {lead.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700">
                      {lead.assignedTo?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <span className="text-sm text-slate-600">{lead.assignedTo || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    {getStatusBadge(lead.status)}
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          lead.status === 'Qualified' ? "bg-emerald-500" : lead.status === 'Lost' ? "bg-slate-300" : "bg-brand-500"
                        }`} 
                        style={{ width: `${lead.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{lead.date}</td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button 
                      onClick={() => setDropdownOpen(dropdownOpen === lead.id ? null : lead.id)}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {dropdownOpen === lead.id && (
                      <div className="dropdown-container absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                        <div className="p-2">
                          <button 
                            onClick={() => { setSelectedLead(lead); setIsDetailsModalOpen(true); setDropdownOpen(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => { setSelectedLead(lead); setIsDetailsModalOpen(true); setDropdownOpen(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            Edit Lead
                          </button>
                          <button 
                            onClick={() => { handleStatusChange(lead.id, 'Contacted'); setDropdownOpen(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            Mark Contacted
                          </button>
                          <button 
                            onClick={() => { handleStatusChange(lead.id, 'Qualified'); setDropdownOpen(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            Mark Qualified
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalLeads)} of {totalLeads} leads
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {(() => {
                  const pages = [];
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalPages, currentPage + 2);
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          i === currentPage
                            ? 'bg-brand-600 text-white hover:bg-brand-700'
                            : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Lead"
        size="lg"
      >
        <form className="space-y-6" onSubmit={handleCreateLead}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  name="name"
                  value={newLead.name}
                  onChange={handleInputChange}
                  placeholder="e.g. David Wallace" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={newLead.email}
                  onChange={handleInputChange}
                  placeholder="david@example.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  name="phone"
                  value={newLead.phone}
                  onChange={handleInputChange}
                  placeholder="+233 24 000 0000" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Lead Source</label>
              <select 
                name="source"
                value={newLead.source}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Direct Call">Direct Call</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Initial Status</label>
              <select 
                name="status"
                value={newLead.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Assign To</label>
              <select 
                name="assigned_to"
                value={newLead.assigned_to}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Date Added</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  name="created_at"
                  value={newLead.created_at}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  required 
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Save Lead
            </button>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => { setIsDetailsModalOpen(false); setSelectedLead(null); }}
        title="Lead Details"
        size="xl"
      >
        {selectedLead && (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <UserIcon size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedLead.name}</h2>
                  <p className="text-slate-500">Lead from {selectedLead.source}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                  <Mail size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                  <Phone size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Conversion Progress</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase">Current Status</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(selectedLead.status)}
                          <span className="text-sm font-bold text-slate-800">{selectedLead.progress}% Complete</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatusChange(selectedLead.id, 'Contacted')}
                          disabled={selectedLead.status === 'Contacted' || selectedLead.status === 'Qualified'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedLead.status === 'Contacted' ? "bg-amber-100 text-amber-600" : "bg-white border border-slate-200 text-slate-600 hover:border-amber-200 hover:text-amber-600"
                          }`}
                        >
                          Mark Contacted
                        </button>
                        <button 
                          onClick={() => handleStatusChange(selectedLead.id, 'Qualified')}
                          disabled={selectedLead.status === 'Qualified'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedLead.status === 'Qualified' ? "bg-emerald-100 text-emerald-600" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-600"
                          }`}
                        >
                          Mark Qualified
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-white rounded-full border border-slate-200 overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          selectedLead.status === 'Qualified' ? "bg-emerald-500" : selectedLead.status === 'Lost' ? "bg-slate-300" : "bg-brand-500"
                        }`} 
                        style={{ width: `${selectedLead.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">Communication & Activity Log</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedLead.communicationHistory.slice().reverse().map((msg) => (
                      <div key={msg.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              msg.type === 'SMS' ? "bg-blue-50 text-blue-600" : msg.type === 'Email' ? "bg-purple-50 text-purple-600" : "bg-slate-50 text-slate-600"
                            }`}>
                              {msg.type}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{msg.sender}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{msg.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea 
                      placeholder="Add a note or record a call/message..." 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                      rows={3}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    ></textarea>
                    <button 
                      onClick={handleAddNote}
                      className="absolute bottom-3 right-3 px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition-all"
                    >
                      Post Record
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Assignment</h3>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned To</label>
                    <select 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                      value={selectedLead.assigned_to || ''}
                      onChange={(e) => handleAssignChange(selectedLead.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                        {selectedLead.assignedTo?.split(' ').map(n => n[0]).join('') || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selectedLead.assignedTo || 'No one assigned'}</p>
                        <p className="text-[10px] text-slate-400">Lead Owner</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Contact Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                      <p className="text-sm font-medium text-slate-700">{selectedLead.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                      <p className="text-sm font-medium text-slate-700">{selectedLead.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Added On</p>
                      <p className="text-sm font-medium text-slate-700">{selectedLead.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Success/Error Notification Modal */}
      <Modal 
        isOpen={notification.show} 
        onClose={() => setNotification({ ...notification, show: false })} 
        title={notification.type === 'success' ? 'Success' : 'Error'}
        size="sm"
      >
        <div className="text-center py-4">
          <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
            notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {notification.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className="text-sm text-slate-600">{notification.message}</p>
          <button 
            onClick={() => setNotification({ ...notification, show: false })}
            className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LeadsView;
