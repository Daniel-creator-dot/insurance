import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  User,
  MessageSquare,
  FileText,
  ExternalLink,
  MapPin,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Car,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { Client } from '../types';
import Modal from '../components/Modal';
import { clientAPI, policyAPI, smsAPI } from '../services/api';

const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeModal, setActiveModal] = useState<'policies' | 'sms' | 'profile' | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [clientPolicies, setClientPolicies] = useState<any[]>([]);
  const [clientSMSLogs, setClientSMSLogs] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [viewingPolicyDetails, setViewingPolicyDetails] = useState<any>(null);
  const [isPolicyDetailsModalOpen, setIsPolicyDetailsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [limit] = useState(9); // Number of clients per page

  // Form state for new client
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    joinedDate: ''
  });

  // Form state for editing client
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        console.log('Fetching clients...');
        const offset = (currentPage - 1) * limit;
        const response = await clientAPI.getAll(limit, offset);
        console.log('Clients response:', response);
        
        // Backend returns { clients: [...], pagination: { total, limit, offset, pages } }
        const data = response.data;
        setClients(data.clients || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalClients(data.pagination?.total || 0);
      } catch (error) {
        console.error('Error fetching clients:', error);
        // Set empty array if there's an error
        setClients([]);
        setTotalPages(1);
        setTotalClients(0);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [currentPage, limit]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenu]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to format date for display
  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    // Ensure the date is in YYYY-MM-DD format for the input field
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if not a valid date
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Handle edit client
  const handleEditClient = (client: Client) => {
    console.log('Editing client:', client);
    setEditingClient(client);
    
    setNewClient({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      dateOfBirth: formatDateForInput(client.dateOfBirth),
      joinedDate: formatDateForInput(client.joinedDate)
    });
    setIsEditModalOpen(true);
  };

  // Handle update client
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    
    try {
      console.log('Updating client:', newClient);
      
      // Transform form data to match backend API expectations
      // Filter out empty date fields to avoid PostgreSQL date parsing errors
      const clientData: any = {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address
      };
      
      // Only include date fields if they have values
      if (newClient.dateOfBirth) {
        clientData.date_of_birth = newClient.dateOfBirth;
      }
      if (newClient.joinedDate) {
        clientData.joined_date = newClient.joinedDate;
      }
      
      console.log('Sending client data:', clientData);
      const response = await clientAPI.update(editingClient.id, clientData);
      console.log('Client updated:', response);
      
      // Show success notification
      setNotification({ show: true, message: 'Client updated successfully!', type: 'success' });
      
      // Refresh the clients list
      const fetchClients = async () => {
        const response = await clientAPI.getAll(20, 0);
        setClients(response.data.clients || []);
      };
      fetchClients();
      
      // Reset form and close modal
      setEditingClient(null);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        joinedDate: ''
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating client:', error);
      // Show error notification
      setNotification({ show: true, message: 'Error updating client. Please try again.', type: 'error' });
    }
  };

  // Handle form submission for creating new client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating client:', newClient);
      
      // Transform form data to match backend API expectations
      const clientData = {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        date_of_birth: newClient.dateOfBirth,
        joined_date: newClient.joinedDate
      };
      
      console.log('Sending client data:', clientData);
      const response = await clientAPI.create(clientData);
      console.log('Client created:', response);
      
      // Show success notification
      setNotification({ show: true, message: 'Client created successfully!', type: 'success' });
      
      // Refresh the clients list
      const fetchClients = async () => {
        const response = await clientAPI.getAll(20, 0);
        setClients(response.data.clients || []);
      };
      fetchClients();
      
      // Reset form and close modal
      setNewClient({
        name: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        joinedDate: ''
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating client:', error);
      // You could show an error message here
    }
  };

  // Handle client action with policy fetching
  const handleClientAction = async (client: Client, action: 'policies' | 'sms' | 'profile') => {
    setSelectedClient(client);
    setActiveModal(action);
    
    // If viewing policies, fetch client's policies
    if (action === 'policies') {
      setLoadingPolicies(true);
      try {
        // Use the proper API service to fetch policies by client
        const response = await policyAPI.getByClient(client.id);
        console.log('Client policies response:', response);
        // Backend returns { policies: [...] }
        // If response.data.policies exists, use it, otherwise use response.data if it's an array
        const policiesData = response.data.policies || response.data || [];
        setClientPolicies(policiesData);
      } catch (error) {
        console.error('Error fetching client policies:', error);
        setClientPolicies([]);
      } finally {
        setLoadingPolicies(false);
      }
    }
    
    // If viewing SMS history, fetch client's SMS logs
    if (action === 'sms') {
      setLoadingPolicies(true);
      try {
        // Use the proper API service to fetch SMS logs by client phone number
        // The backend searches by recipient field which stores phone numbers
        const response = await smsAPI.getByClient(client.phone);
        console.log('Client SMS logs response:', response);
        // Backend returns { sms_logs: [...] }
        // If response.data.sms_logs exists, use it, otherwise use response.data if it's an array
        const smsLogsData = response.data.sms_logs || response.data || [];
        setClientSMSLogs(smsLogsData);
      } catch (error) {
        console.error('Error fetching client SMS logs:', error);
        setClientSMSLogs([]);
      } finally {
        setLoadingPolicies(false);
      }
    }
  };

  // Handle view policy details
  const handleViewPolicy = (policy: any) => {
    setViewingPolicyDetails(policy);
    setIsPolicyDetailsModalOpen(true);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedClient(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase flex items-center gap-1 w-fit"><CheckCircle2 size={10} /> Active</span>;
      case 'Pending':
        return <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase flex items-center gap-1 w-fit"><Clock size={10} /> Pending</span>;
      case 'Expired':
        return <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase flex items-center gap-1 w-fit"><XCircle size={10} /> Expired</span>;
      default:
        return <span className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded uppercase flex items-center gap-1 w-fit">Unknown</span>;
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    return matchesSearch;
  });

  const mockClients: Client[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '+233 24 123 4567', address: '123 Maple St, Springfield', dateOfBirth: '1985-06-15', joinedDate: '2024-01-15' },
    { id: '2', name: 'Robert Brown', email: 'robert@example.com', phone: '+233 55 987 6543', address: '456 Oak Ave, Metropolis', dateOfBirth: '1978-03-22', joinedDate: '2024-02-20' },
    { id: '3', name: 'Michael Scott', email: 'michael@dundermifflin.com', phone: '+233 20 555 0100', address: '1725 Slough Ave, Scranton', dateOfBirth: '1964-09-05', joinedDate: '2023-11-05' },
    { id: '4', name: 'Pam Beesly', email: 'pam@dundermifflin.com', phone: '+233 27 555 0101', address: 'Scranton, PA', dateOfBirth: '1980-03-25', joinedDate: '2023-12-10' },
    { id: '5', name: 'Jim Halpert', email: 'jim@dundermifflin.com', phone: '+233 50 555 0102', address: 'Scranton, PA', dateOfBirth: '1979-10-01', joinedDate: '2024-01-05' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Directory</h1>
          <p className="text-slate-500 text-sm">Manage your client relationships and view their history.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-lg shadow-brand-500/10 group-hover:text-brand-700 transition-all">
                    <User size={24} />
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === client.id ? null : client.id);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === client.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                        <div className="py-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClient(client);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                          >
                            <Edit size={16} />
                            Edit Client
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClientAction(client, 'profile');
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                          >
                            <ExternalLink size={16} />
                            View Profile
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1">{client.name}</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-4">Joined {client.joined_date}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleClientAction(client, 'policies')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 transition-colors border border-transparent hover:border-emerald-200"
                  >
                    <FileText size={16} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase">Policies</span>
                  </button>
                  <button 
                    onClick={() => handleClientAction(client, 'sms')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors border border-transparent hover:border-blue-200"
                  >
                    <MessageSquare size={16} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase">SMS</span>
                  </button>
                  <button 
                    onClick={() => handleClientAction(client, 'profile')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 transition-colors border border-transparent hover:border-purple-200"
                  >
                    <ExternalLink size={16} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase">Profile</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-slate-500">
            <User size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-bold">No clients found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalClients > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalClients)} of {totalClients} clients
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Back
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
                  Forward
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Client"
        size="lg"
      >
        <form className="space-y-6" onSubmit={handleCreateClient}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  name="name"
                  placeholder="e.g. John Doe" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.name}                  onChange={handleInputChange}
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
                  placeholder="john@example.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.email}
                  onChange={handleInputChange}
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
                  placeholder="+233 24 000 0000" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Joined Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  name="joinedDate"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.joinedDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      name="dateOfBirth"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newClient.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  name="address"
                  placeholder="123 Main St, City, Country" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Save Client
            </button>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Policies Modal */}
      <Modal 
        isOpen={activeModal === 'policies' && selectedClient !== null} 
        onClose={closeModal} 
        title={`${selectedClient?.name} - Policies`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Client Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Name:</span>
                <p className="font-bold">{selectedClient?.name}</p>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-bold">{selectedClient?.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <p className="font-bold">{selectedClient?.phone}</p>
              </div>
              <div>
                <span className="text-slate-500">Joined:</span>
                <p className="font-bold">{selectedClient?.joined_date}</p>
              </div>
            </div>
          </div>
          
          {clientPolicies.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-brand-600 px-1">Active Policies ({clientPolicies.length})</h4>
              <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientPolicies.map((policy) => (
                    <div 
                      key={policy.id} 
                      onClick={() => handleViewPolicy(policy)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                            <Shield size={16} />
                          </div>
                          <h4 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{policy.policy_number}</h4>
                        </div>
                        {getStatusBadge(policy.status)}
                      </div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{policy.insurance_type}</div>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Expiry Date</span>
                          <span className="font-bold text-slate-700">{policy.expiry_date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Premium</span>
                          <span className="font-bold text-slate-700">GH₵{policy.premium.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                        <span className="text-[10px] font-bold text-brand-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                          View Details <ExternalLink size={10} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-bold">No policies found for this client</p>
              <p className="text-sm">This client currently has no active policies</p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={closeModal}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* SMS Modal */}
      <Modal 
        isOpen={activeModal === 'sms' && selectedClient !== null} 
        onClose={closeModal} 
        title={`${selectedClient?.name} - SMS History`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Client Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Name:</span>
                <p className="font-bold">{selectedClient?.name}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <p className="font-bold">{selectedClient?.phone}</p>
              </div>
            </div>
          </div>
          
          {clientSMSLogs.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-brand-600 px-1">SMS Messages ({clientSMSLogs.length})</h4>
              <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <div className="space-y-3">
                  {clientSMSLogs.map((sms) => (
                    <div 
                      key={sms.id} 
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <MessageSquare size={16} />
                          </div>
                          <h4 className="font-bold text-slate-800">{sms.recipient}</h4>
                        </div>
                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                          sms.status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : 
                          sms.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {sms.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sent {new Date(sms.sent_at || sms.created_at).toLocaleDateString()}</div>
                      <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        {sms.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-bold">No SMS history available</p>
              <p className="text-sm">No messages have been sent to this client yet</p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={closeModal}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal 
        isOpen={activeModal === 'profile' && selectedClient !== null} 
        onClose={closeModal} 
        title={`${selectedClient?.name} - Profile`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400">
              <User size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{selectedClient?.name}</h3>
            <p className="text-slate-500">{selectedClient?.email}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-bold">{selectedClient?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-bold">{selectedClient?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="font-bold">{selectedClient?.address}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800">Account Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Client ID</p>
                  <p className="font-bold">#{selectedClient?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Member Since</p>
                  <p className="font-bold">{selectedClient?.joined_date}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={closeModal}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Client Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Client"
        size="lg"
      >
        <form className="space-y-6" onSubmit={handleUpdateClient}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  name="name"
                  placeholder="e.g. John Doe" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.name}                  onChange={handleInputChange}
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
                  placeholder="john@example.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.email}
                  onChange={handleInputChange}
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
                  placeholder="+233 24 000 0000" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Joined Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  name="joinedDate"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.joinedDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      name="dateOfBirth"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newClient.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  name="address"
                  placeholder="123 Main St, City, Country" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  value={newClient.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Update Client
            </button>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
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

      {/* Policy Details Modal */}
      <Modal 
        isOpen={isPolicyDetailsModalOpen} 
        onClose={() => setIsPolicyDetailsModalOpen(false)} 
        title="Policy Details"
        size="xl"
      >
        {viewingPolicyDetails && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{viewingPolicyDetails.policy_number || viewingPolicyDetails.policyNumber}</h4>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{viewingPolicyDetails.insurance_type || viewingPolicyDetails.insuranceType}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                {getStatusBadge(viewingPolicyDetails.status)}
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-brand-600 px-1">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Insured Name</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <User className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.client_name || viewingPolicyDetails.clientName || selectedClient?.name || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Vehicle Number</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Car className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.vehicle_number || viewingPolicyDetails.vehicleNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Insurance Company</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Shield className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.insurance_company || viewingPolicyDetails.insuranceCompany || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Staff Name</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <User className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.staff_name || viewingPolicyDetails.staffName || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Class of Business</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                    </div>
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.class_of_business || viewingPolicyDetails.classOfBusiness || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">New/Renewal</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Shield className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.is_new_renewal || viewingPolicyDetails.isNewRenewal || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Renewal Date</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Calendar className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.renewal_date || viewingPolicyDetails.renewalDate || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Paid</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Calendar className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.date_paid || viewingPolicyDetails.datePaid || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Outstanding Premium Paid</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <DollarSign className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.outstanding_premium_paid || viewingPolicyDetails.outstandingPremiumPaid || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-brand-600 px-1">Financial Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Premium (GHS)</p>
                  <p className="text-lg font-black text-slate-800">GH₵ {(viewingPolicyDetails.premiumAmtGhs || viewingPolicyDetails.premium || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commission (%)</p>
                  <p className="text-lg font-black text-brand-600">{viewingPolicyDetails.commission_percent || viewingPolicyDetails.commissionPercent || 0}%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Comm.</p>
                  <p className="text-lg font-black text-slate-800">GH₵ {(viewingPolicyDetails.commission_expected_ghs || viewingPolicyDetails.commissionExpectedGhs || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Comm.</p>
                  <p className="text-lg font-black text-emerald-600">GH₵ {(viewingPolicyDetails.net_comm || viewingPolicyDetails.netComm || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Overrider</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <DollarSign className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">GH₵ {(viewingPolicyDetails.overrider || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Net Overrider</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <DollarSign className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">GH₵ {(viewingPolicyDetails.net_overrider || viewingPolicyDetails.netOverrider || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Overrider Paid</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Calendar className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicyDetails.date_overrider_paid || viewingPolicyDetails.dateOverriderPaid || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setIsPolicyDetailsModalOpen(false)} 
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientsView;
