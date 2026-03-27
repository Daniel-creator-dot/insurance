import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  DollarSign,
  Car,
  AlertCircle
} from 'lucide-react';
import { Policy, cn } from '../types';
import Modal from '../components/Modal';
import { policyAPI, clientAPI, userAPI, commissionRateAPI, dashboardAPI } from '../services/api';
import { useNotification } from '../components/Notification';
import * as XLSX from 'exceljs';

interface PoliciesViewProps {
  onNavigate?: (tab: string) => void;
}

const PoliciesView: React.FC<PoliciesViewProps> = ({ onNavigate }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [expiringPolicies, setExpiringPolicies] = useState<any[]>([]);
  const [expiringDuration, setExpiringDuration] = useState<number>(30);
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'expiring'>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    pages: 0
  });

  const [commissionRates, setCommissionRates] = useState<any[]>([]);
  const [maxCommissionRate, setMaxCommissionRate] = useState<number | null>(null);

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

  // Use notification hook
  const { showWarning, showError, showSuccess } = useNotification();

  // State for clients dropdown
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // State for users dropdown (staff)
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form state for new policy
  const [newPolicy, setNewPolicy] = useState({
    policyNumber: '',
    clientId: '',
    clientName: '',
    insuranceType: 'Health',
    classOfBusiness: '',
    startDate: '',
    expiryDate: '',
    premium: 0,
    datePaid: '',
    outstandingPremiumPaid: '',
    vehicleNumber: '',
    staffName: '',
    isNewRenewal: '',
    renewalDate: '',
    insuranceCompany: '',
    premiumAmtGhs: 0,
    premiumSticker: 0,
    commissionPercent: 0,
    commissionExpectedGhs: 0,
    with75Percent: 0,
    netComm: 0,
    dateCommissionPaid: '',
    overrider: 0,
    netOverrider: 0,
    dateOverriderPaid: ''
  });

  const fetchPolicies = async (limit = pagination.limit, offset = pagination.offset) => {
    try {
      setLoading(true);
      console.log('Fetching policies...');
      const response = await policyAPI.getAll(limit, offset);
      console.log('Policies response:', response);
      // Backend returns { policies: [...], pagination: {...} }
      setPolicies(response.data.policies || []);
      setPagination(response.data.pagination || {
        total: 0,
        limit: limit,
        offset: offset,
        pages: 0
      });
    } catch (error) {
      console.error('Error fetching policies:', error);
      // Set empty array if there's an error
      setPolicies([]);
      setPagination({
        total: 0,
        limit: limit,
        offset: offset,
        pages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringPolicies = async (days = expiringDuration) => {
    try {
      const response = await dashboardAPI.getExpiringPolicies(days);
      setExpiringPolicies(response.data.expiringPolicies || response.data || []);
    } catch (error) {
      console.error('Error fetching expiring policies:', error);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    fetchExpiringPolicies(expiringDuration);
  }, [expiringDuration]);

  // Load current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('insurify_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        // Set the staff name to the current user's name by default
        setNewPolicy(prev => ({
          ...prev,
          staffName: user.name || ''
        }));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        const response = await clientAPI.getAll(100, 0);
        setClients(response.data.clients || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  // Fetch commission rates for class selection
  useEffect(() => {
    const loadRates = async () => {
      try {
        const resp = await commissionRateAPI.getAll();
        setCommissionRates(resp.data || []);
      } catch (err) {
        console.error('Error loading commission rates', err);
        setCommissionRates([]);
      }
    };

    loadRates();
  }, []);

  // update max rate when class changes
  useEffect(() => {
    if (newPolicy.classOfBusiness && commissionRates.length > 0) {
      const found = commissionRates.find(r => r.class_of_business.toLowerCase() === newPolicy.classOfBusiness.toLowerCase());
      setMaxCommissionRate(found ? parseFloat(found.agreed_rate) : null);
    } else {
      setMaxCommissionRate(null);
    }
  }, [newPolicy.classOfBusiness, commissionRates]);

  // Fetch users for staff dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        console.log('Fetching users...');
        const response = await userAPI.getAll();
        console.log('Users response:', response);
        console.log('Users data:', response.data);
        console.log('Users array:', response.data.users);
        setUsers(response.data.users || []);
        console.log('Set users to:', response.data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'premiumAmtGhs', 'premium', 'commissionPercent', 'commissionExpectedGhs',
      'with75Percent', 'netComm', 'overrider', 'netOverrider'
    ];
    setNewPolicy(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  // Handle form submission for creating new policy
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newPolicy.clientId) {
      showWarning('Validation Error', 'Please select a client');
      return;
    }
    
    if (!newPolicy.startDate || !newPolicy.expiryDate) {
      showWarning('Validation Error', 'Please select both start date and expiry date');
      return;
    }
    
    // Additional validation for date fields to prevent empty strings
    if (newPolicy.startDate === '' || newPolicy.expiryDate === '') {
      showWarning('Validation Error', 'Please select valid start date and expiry date');
      return;
    }
    
    // Validate required date fields to ensure they're not empty strings
    const requiredDateFields = ['startDate', 'expiryDate'];
    for (const field of requiredDateFields) {
      if (newPolicy[field] === '') {
        showWarning('Validation Error', `Please provide a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} date`);
        return;
      }
    }
    
    // For optional date fields, only validate if they have values
    const optionalDateFields = ['datePaid', 'renewalDate', 'dateCommissionPaid', 'dateOverriderPaid'];
    for (const field of optionalDateFields) {
      const fieldValue = newPolicy[field];
      if (fieldValue && fieldValue !== '' && fieldValue !== undefined && fieldValue !== null) {
        // If the field has a value, ensure it's a valid date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) {
          showWarning('Validation Error', `Please provide a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} date`);
          return;
        }
      }
    }
    
    if ((newPolicy.premiumAmtGhs || newPolicy.premium) <= 0) {
      showWarning('Validation Error', 'Please enter a valid premium amount');
      return;
    }

    // Ensure class of business selected and commission does not exceed max
    if (!newPolicy.classOfBusiness) {
      showWarning('Validation Error', 'Please select a class of business');
      return;
    }
    if (maxCommissionRate !== null && newPolicy.commissionPercent > maxCommissionRate) {
      showWarning('Validation Error', `Commission percent cannot exceed ${maxCommissionRate}% for the selected class`);
      return;
    }
    
    // Generate a unique policy number if not provided or if it's a duplicate
    let policyNumber = newPolicy.policyNumber;
    if (!policyNumber) {
      policyNumber = `POL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    } else {
      // If user provided a policy number, append timestamp to make it unique
      policyNumber = `${policyNumber}-${Date.now().toString().slice(-4)}`;
    }
    
    try {
      console.log('Creating policy:', newPolicy);
      
      // Transform form data to match backend API expectations
      const policyData = {
        policy_number: policyNumber,
        client_id: newPolicy.clientId,
        client_name: newPolicy.clientName,
        insurance_type: newPolicy.insuranceType,
        class_of_business: newPolicy.classOfBusiness || null,
        start_date: newPolicy.startDate,
        expiry_date: newPolicy.expiryDate,
        premium: newPolicy.premiumAmtGhs || newPolicy.premium,
        // Additional fields from the comprehensive form
        date_paid: newPolicy.datePaid || null,
        outstanding_premium_paid: newPolicy.outstandingPremiumPaid || null,
        vehicle_number: newPolicy.vehicleNumber || null,
        staff_name: newPolicy.staffName || null,
        is_new_renewal: newPolicy.isNewRenewal || null,
        renewal_date: newPolicy.renewalDate || null,
        insurance_company: newPolicy.insuranceCompany || null,
        premium_amt_ghs: newPolicy.premiumAmtGhs || newPolicy.premium || 0,
        premium_sticker: newPolicy.premiumSticker || 0,
        commission_percent: newPolicy.commissionPercent || 0,
        commission_expected_ghs: newPolicy.commissionExpectedGhs || 0,
        with_75_percent: newPolicy.with75Percent || 0,
        net_comm: newPolicy.netComm || 0,
        date_commission_paid: newPolicy.dateCommissionPaid || null,
        overrider: newPolicy.overrider || 0,
        net_overrider: newPolicy.netOverrider || 0,
        date_overrider_paid: newPolicy.dateOverriderPaid || null
      };
      
      console.log('Sending policy data:', policyData);
      const response = await policyAPI.create(policyData);
      console.log('Policy created:', response);
      
      // Show success notification
      showSuccess('Success', 'Policy created successfully!');
      
      // Refresh the policies list
      fetchPolicies();
      
      // Reset form and close modal
      setNewPolicy({
        policyNumber: '',
        clientId: '',
        clientName: '',
        insuranceType: 'Health',
        startDate: '',
        expiryDate: '',
        premium: 0,
        datePaid: '',
        outstandingPremiumPaid: '',
        vehicleNumber: '',
        staffName: '',
        isNewRenewal: '',
        renewalDate: '',
        insuranceCompany: '',
        premiumAmtGhs: 0,
        premiumSticker: 0,
        commissionPercent: 0,
        commissionExpectedGhs: 0,
        with75Percent: 0,
        netComm: 0,
        dateCommissionPaid: '',
        overrider: 0,
        netOverrider: 0,
        dateOverriderPaid: ''
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating policy:', error);
      // Show error message to user
      showError('Error', 'Error creating policy: ' + (error.response?.data?.message || error.message || 'Please check the form and try again'));
    }
  };

  // Handle view policy
  const handleViewPolicy = (policy: Policy) => {
    console.log('Viewing policy:', policy);
    setViewingPolicy(policy);
    setIsViewModalOpen(true);
  };

  // Handle edit policy
  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setNewPolicy({
      policyNumber: policy.policy_number || policy.policyNumber || '',
      clientId: policy.client_id || '',
      clientName: policy.client_name || policy.clientName || '',
      insuranceType: policy.insurance_type || policy.insuranceType || 'Health',
      classOfBusiness: policy.class_of_business || policy.classOfBusiness || '',
      startDate: policy.start_date || policy.startDate || '',
      expiryDate: policy.expiry_date || policy.expiryDate || '',
      premium: policy.premium || 0,
      datePaid: policy.date_paid || '',
      outstandingPremiumPaid: policy.outstanding_premium_paid || policy.outstandingPremiumPaid || '',
      vehicleNumber: policy.vehicle_number || policy.vehicleNumber || '',
      staffName: policy.staff_name || policy.staffName || '',
      isNewRenewal: policy.is_new_renewal || policy.isNewRenewal || '',
      renewalDate: policy.renewal_date || policy.renewalDate || '',
      insuranceCompany: policy.insurance_company || policy.insuranceCompany || '',
      premiumAmtGhs: policy.premium_amt_ghs || policy.premiumAmtGhs || policy.premium || 0,
      premiumSticker: policy.premium_sticker || policy.premiumSticker || 0,
      commissionPercent: policy.commission_percent || policy.commissionPercent || 0,
      commissionExpectedGhs: policy.commission_expected_ghs || policy.commissionExpectedGhs || 0,
      with75Percent: policy.with_75_percent || policy.with75Percent || 0,
      netComm: policy.net_comm || policy.netComm || 0,
      dateCommissionPaid: policy.date_commission_paid || policy.dateCommissionPaid || '',
      overrider: policy.overrider || 0,
      netOverrider: policy.net_overrider || policy.netOverrider || 0,
      dateOverriderPaid: policy.date_overrider_paid || policy.dateOverriderPaid || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle update policy
  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    
    try {
      console.log('Updating policy:', newPolicy);
      
      // validation for update
      if (!newPolicy.classOfBusiness) {
        showWarning('Validation Error', 'Please select a class of business');
        return;
      }
      if (maxCommissionRate !== null && newPolicy.commissionPercent > maxCommissionRate) {
        showWarning('Validation Error', `Commission percent cannot exceed ${maxCommissionRate}% for the selected class`);
        return;
      }

      // Transform form data to match backend API expectations (snake_case)
      // Only include fields that exist in the database schema
      const policyData = {
        policy_number: newPolicy.policyNumber,
        client_id: newPolicy.clientId,
        insurance_type: newPolicy.insuranceType,
        class_of_business: newPolicy.classOfBusiness || null,
        start_date: newPolicy.startDate,
        expiry_date: newPolicy.expiryDate,
        premium: newPolicy.premiumAmtGhs || newPolicy.premium,
        // Additional fields from the comprehensive form
        date_paid: newPolicy.datePaid || null,
        outstanding_premium_paid: newPolicy.outstandingPremiumPaid || null,
        vehicle_number: newPolicy.vehicleNumber || null,
        staff_name: newPolicy.staffName || null,
        is_new_renewal: newPolicy.isNewRenewal || null,
        renewal_date: newPolicy.renewalDate || null,
        insurance_company: newPolicy.insuranceCompany || null,
        premium_amt_ghs: newPolicy.premiumAmtGhs || newPolicy.premium || 0,
        premium_sticker: newPolicy.premiumSticker || 0,
        commission_percent: newPolicy.commissionPercent || 0,
        commission_expected_ghs: newPolicy.commissionExpectedGhs || 0,
        with_75_percent: newPolicy.with75Percent || 0,
        net_comm: newPolicy.netComm || 0,
        date_commission_paid: newPolicy.dateCommissionPaid || null,
        overrider: newPolicy.overrider || 0,
        net_overrider: newPolicy.netOverrider || 0,
        date_overrider_paid: newPolicy.dateOverriderPaid || null
      };
      
      console.log('Sending policy data:', policyData);
      const response = await policyAPI.update(editingPolicy.id, policyData);
      console.log('Policy updated:', response);
      
      // Show success notification
      showSuccess('Success', 'Policy updated successfully!');
      
      // Refresh the policies list
      fetchPolicies();
      
      // Reset form and close modal
      setEditingPolicy(null);
      setNewPolicy({
        policyNumber: '',
        clientId: '',
        clientName: '',
        insuranceType: 'Health',
        startDate: '',
        expiryDate: '',
        premium: 0,
        datePaid: '',
        outstandingPremiumPaid: '',
        vehicleNumber: '',
        staffName: '',
        isNewRenewal: '',
        renewalDate: '',
        insuranceCompany: '',
        premiumAmtGhs: 0,
        premiumSticker: 0,
        commissionPercent: 0,
        commissionExpectedGhs: 0,
        with75Percent: 0,
        netComm: 0,
        dateCommissionPaid: '',
        overrider: 0,
        netOverrider: 0,
        dateOverriderPaid: ''
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating policy:', error);
      // Show error notification
      showError('Error', 'Error updating policy: ' + (error.response?.data?.message || error.message || 'Please check the form and try again'));
    }
  };

  // Handle delete policy
  const handleDeletePolicy = (policyId: string) => {
    setPolicyToDelete(policyId);
  };

  // Confirm delete policy
  const confirmDeletePolicy = async () => {
    if (!policyToDelete) return;
    
    try {
      console.log('Deleting policy:', policyToDelete);
      const response = await policyAPI.delete(policyToDelete);
      console.log('Policy deleted:', response);
      
      // Show success notification
      showSuccess('Success', 'Policy deleted successfully!');
      
      // Refresh the policies list
      fetchPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error);
      // Show error notification
      showError('Error', 'Error deleting policy: ' + (error.response?.data?.message || error.message || 'Please try again'));
    } finally {
      setPolicyToDelete(null);
    }
  };

  // Cancel delete policy
  const cancelDeletePolicy = () => {
    setPolicyToDelete(null);
  };

  // Export policies to Excel
  const exportToExcel = async () => {
    try {
      // Create a new workbook and worksheet
      const workbook = new XLSX.Workbook();
      const worksheet = workbook.addWorksheet('Policies');

      // Define columns
      worksheet.columns = [
        { header: 'Policy Number', key: 'policyNumber', width: 20 },
        { header: 'Client Name', key: 'clientName', width: 30 },
        { header: 'Insurance Type', key: 'insuranceType', width: 20 },
        { header: 'Class of Business', key: 'classOfBusiness', width: 20 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'Expiry Date', key: 'expiryDate', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Premium Amount (GHS)', key: 'premium', width: 20 },
        { header: 'Insurance Company', key: 'insuranceCompany', width: 25 },
        { header: 'Vehicle Number', key: 'vehicleNumber', width: 20 },
        { header: 'Staff Name', key: 'staffName', width: 20 },
        { header: 'New/Renewal', key: 'isNewRenewal', width: 15 },
        { header: 'Renewal Date', key: 'renewalDate', width: 15 },
        { header: 'Date Paid', key: 'datePaid', width: 15 },
        { header: 'Commission %', key: 'commissionPercent', width: 15 },
        { header: 'Commission Expected (GHS)', key: 'commissionExpectedGhs', width: 25 },
        { header: 'Net Comm (GHS)', key: 'netComm', width: 15 },
        { header: 'Overrider (GHS)', key: 'overrider', width: 15 },
        { header: 'Net Overrider (GHS)', key: 'netOverrider', width: 20 }
      ];

      // Add data rows
      filteredPolicies.forEach(policy => {
        worksheet.addRow({
          policyNumber: policy.policy_number || policy.policyNumber || '',
          clientName: policy.client_name || policy.clientName || '',
          insuranceType: policy.insurance_type || policy.insuranceType || '',
          classOfBusiness: policy.class_of_business || policy.classOfBusiness || '',
          vehicleNumber: policy.vehicle_number || policy.vehicleNumber || '',
          staffName: policy.staff_name || policy.staffName || '',
          isNewRenewal: policy.is_new_renewal || policy.isNewRenewal || '',
          renewalDate: policy.renewal_date || policy.renewalDate || '',
          datePaid: policy.date_paid || policy.datePaid || '',
          commissionPercent: policy.commission_percent || policy.commissionPercent || 0,
          commissionExpectedGhs: policy.commission_expected_ghs || policy.commissionExpectedGhs || 0,
          netComm: policy.net_comm || policy.netComm || 0,
          overrider: policy.overrider || 0,
          netOverrider: policy.net_overrider || policy.netOverrider || 0
        });
      });

      // Add totals row
      const totalPremium = filteredPolicies.reduce((sum, policy) => sum + (policy.premiumAmtGhs || policy.premium || 0), 0);
      const totalCommission = filteredPolicies.reduce((sum, policy) => sum + (policy.commission_expected_ghs || policy.commissionExpectedGhs || 0), 0);
      const totalNetComm = filteredPolicies.reduce((sum, policy) => sum + (policy.net_comm || policy.netComm || 0), 0);
      const totalOverrider = filteredPolicies.reduce((sum, policy) => sum + (policy.overrider || 0), 0);
      const totalNetOverrider = filteredPolicies.reduce((sum, policy) => sum + (policy.net_overrider || policy.netOverrider || 0), 0);

      const totalsRow = worksheet.addRow({
        policyNumber: 'TOTALS',
        clientName: '',
        insuranceType: '',
        classOfBusiness: '',
        startDate: '',
        expiryDate: '',
        status: '',
        premium: totalPremium,
        insuranceCompany: '',
        vehicleNumber: '',
        staffName: '',
        isNewRenewal: '',
        renewalDate: '',
        datePaid: '',
        commissionPercent: '',
        commissionExpectedGhs: totalCommission,
        netComm: totalNetComm,
        overrider: totalOverrider,
        netOverrider: totalNetOverrider
      });

      // Style totals row
      totalsRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1E8FF' }
        };
      });

      // Add headers style
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFf3f4f6' }
        };
      });

      // Generate buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `policies_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);

      showSuccess('Success', 'Policies exported successfully!');
    } catch (error) {
      console.error('Error exporting policies:', error);
      showError('Error', 'Failed to export policies. Please try again.');
    }
  };

  const handlePageChange = (newOffset: number) => {
    const newPage = Math.floor(newOffset / pagination.limit) + 1;
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    if (newOffset >= 0 && newOffset < pagination.total) {
      fetchPolicies(pagination.limit, newOffset);
    }
  };

  const handleNextPage = () => {
    const currentOffset = pagination.offset;
    const newOffset = currentOffset + pagination.limit;
    handlePageChange(newOffset);
  };

  const handlePrevPage = () => {
    const currentOffset = pagination.offset;
    const newOffset = currentOffset - pagination.limit;
    handlePageChange(newOffset);
  };

  const handlePageClick = (pageNumber: number) => {
    const newOffset = (pageNumber - 1) * pagination.limit;
    handlePageChange(newOffset);
  };

  const getStatusBadge = (status: Policy['status']) => {
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

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         policy.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.insurance_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || policy.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const mockPolicies: Policy[] = [
    { id: '1', policyNumber: 'POL-8821', clientName: 'John Doe', insuranceType: 'Health', startDate: '2025-03-15', expiryDate: '2026-03-15', status: 'Active', premium: 1200 },
    { id: '2', policyNumber: 'POL-1029', clientName: 'Kwesi Junior', insuranceType: 'Life', startDate: '2025-03-22', expiryDate: '2026-03-22', status: 'Pending', premium: 2500 },
    { id: '3', policyNumber: 'POL-4432', clientName: 'Michael Scott', insuranceType: 'Auto', startDate: '2025-04-02', expiryDate: '2026-04-02', status: 'Active', premium: 800 },
    { id: '4', policyNumber: 'POL-9910', clientName: 'Pam Beesly', insuranceType: 'Home', startDate: '2025-04-05', expiryDate: '2026-04-05', status: 'Expired', premium: 1500 },
    { id: '5', policyNumber: 'POL-5567', clientName: 'Jim Halpert', insuranceType: 'Health', startDate: '2025-05-10', expiryDate: '2026-05-10', status: 'Active', premium: 1200 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Policy Management</h1>
          <p className="text-slate-500 text-sm">Manage, track and update all insurance policies in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setActiveViewTab('all')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeViewTab === 'all' 
                  ? "bg-white text-brand-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              All Policies
            </button>
            <button
              onClick={() => setActiveViewTab('expiring')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
                activeViewTab === 'expiring' 
                  ? "bg-white text-red-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <AlertCircle size={14} />
              Expiring Soon
              {expiringPolicies.length > 0 && (
                <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">
                  {expiringPolicies.length}
                </span>
              )}
            </button>
          </div>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors hover:text-brand-600"
          >
            <Download size={18} /> Export to Excel
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
          >
            <Plus size={18} /> Add Policy
          </button>
        </div>
      </div>

      {activeViewTab === 'all' ? (
        <>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by policy number or client name..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Expired</option>
          </select>
          <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            <option>All Types</option>
            <option>Health</option>
            <option>Life</option>
            <option>Auto</option>
            <option>Home</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Policy Number</th>
                <th className="px-6 py-4">Insured Name</th>
                <th className="px-6 py-4">Type of Policy</th>
                <th className="px-6 py-4">Class of Business</th>
                <th className="px-6 py-4">Premium Amount (GHS)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-brand-600 bg-brand-50/50 rounded-lg">{policy.policy_number || policy.policyNumber}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{policy.client_name || policy.clientName}</td>
                    <td className="px-6 py-4 text-sm text-purple-600 bg-purple-50/50 rounded-lg">{policy.insurance_type || policy.insuranceType}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{policy.class_of_business || policy.classOfBusiness || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">GH₵{(policy.premiumAmtGhs || policy.premium || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">{getStatusBadge(policy.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewPolicy(policy)}
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditPolicy(policy)}
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeletePolicy(policy.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-slate-500">No policies found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} entries
          </p>
          <div className="flex gap-1">
            <button 
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className={`px-3 py-1 border rounded-lg text-xs font-medium ${
                pagination.offset === 0 
                  ? 'bg-white text-slate-300 cursor-not-allowed border-slate-200' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Previous
            </button>
            
            {(() => {
              const totalPages = Math.ceil(pagination.total / pagination.limit);
              const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
              const pages = [];
              
              // Show first page
              if (totalPages > 0) {
                pages.push(1);
              }
              
              // Show current page and neighbors
              if (currentPage > 2 && currentPage < totalPages) {
                pages.push(currentPage - 1, currentPage, currentPage + 1);
              } else if (currentPage === 2) {
                pages.push(2);
              } else if (currentPage === totalPages - 1) {
                pages.push(totalPages - 1);
              }
              
              // Show last page if different from current
              if (totalPages > 1 && totalPages !== pages[pages.length - 1]) {
                pages.push(totalPages);
              }
              
              return pages.map((page, index) => {
                const isActive = page === currentPage;
                return (
                  <button 
                    key={`page-${page}`}
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-1 border rounded-lg text-xs font-medium ${
                      isActive 
                        ? 'bg-brand-50 text-brand-600 border-brand-200 font-bold' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              });
            })()}
            
            <button 
              onClick={handleNextPage}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className={`px-3 py-1 border rounded-lg text-xs font-medium ${
                pagination.offset + pagination.limit >= pagination.total 
                  ? 'bg-white text-slate-300 cursor-not-allowed border-slate-200' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-800">Expiring Policies</h3>
              <select 
                value={expiringDuration}
                onChange={(e) => setExpiringDuration(parseInt(e.target.value))}
                className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value={7}>Next 7 Days</option>
                <option value={15}>Next 15 Days</option>
                <option value={30}>Next 30 Days (1 Month)</option>
                <option value={60}>Next 60 Days (2 Months)</option>
                <option value={90}>Next 90 Days (3 Months)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase">Critical</span>
              <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase">Warning</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Policy #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Days Left</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expiringPolicies.length > 0 ? (
                  expiringPolicies.map((policy, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-brand-600">{policy.policyNumber}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">{policy.clientName}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{policy.insuranceType || 'Policy'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className={cn(
                            "font-medium",
                            policy.daysUntilExpiry <= 7 ? 'text-red-500' : 'text-amber-600'
                          )}>
                            {policy.expiryDate}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          policy.daysUntilExpiry <= 7 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        )}>
                          {policy.daysUntilExpiry} days
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            const message = `Dear ${policy.clientName},\n\nYour policy No. ${policy.policyNumber} expires on ${policy.expiryDate}. Renewal is required to prevent lapse of benefits. Kindly arrange payment before the due date. You can contact us on marketing@kesbridgebrokers.com and number +233 (0)599 679 991`;
                            localStorage.setItem('sms_prefill', JSON.stringify({
                              clientId: policy.clientId,
                              message: message
                            }));
                            onNavigate?.('sms');
                          }}
                          className="px-4 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          Remind
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="text-slate-200" size={48} />
                        <p>No policies expiring in the next {expiringDuration} days.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          // Reset form when modal is closed
          setNewPolicy({
            policyNumber: '',
            clientId: '',
            clientName: '',
            insuranceType: 'Health',
            startDate: '',
            expiryDate: '',
            premium: 0,
            datePaid: '',
            outstandingPremiumPaid: '',
            vehicleNumber: '',
            staffName: '',
            isNewRenewal: '',
            renewalDate: '',
            insuranceCompany: '',
            premiumAmtGhs: 0,
            premiumSticker: 0,
            commissionPercent: 0,
            commissionExpectedGhs: 0,
            with75Percent: 0,
            netComm: 0,
            dateCommissionPaid: '',
            overrider: 0,
            netOverrider: 0,
            dateOverriderPaid: ''
          });
          setIsAddModalOpen(false);
        }} 
        title="Add New Policy"
        size="xl"
      >
        <form className="space-y-6" onSubmit={handleCreatePolicy}>
          <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-brand-600 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Select Client</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <select 
                        name="clientId"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                        value={newPolicy.clientId}
                        onChange={(e) => {
                          const clientId = e.target.value;
                          const selectedClient = clients.find(c => c.id == clientId);
                          setNewPolicy(prev => ({
                            ...prev,
                            clientId: clientId,
                            clientName: selectedClient ? selectedClient.name : ''
                          }));
                        }}
                      >
                        <option value="">Select a client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name} - {client.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Insured Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="text" 
                        name="clientName"
                        placeholder="Select a client to auto-fill" 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                        value={newPolicy.clientName}
                        onChange={handleInputChange}
                        readOnly={!!newPolicy.clientId}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="date" 
                        name="startDate"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.startDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Expiry Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="date" 
                        name="expiryDate"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.expiryDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Date Paid</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="date" 
                        name="datePaid"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.datePaid}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Outstanding Premium Paid</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="text" 
                        name="outstandingPremiumPaid"
                        placeholder="e.g., Yes/No" 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.outstandingPremiumPaid}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Vehicle Number</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="text" 
                        name="vehicleNumber"
                        placeholder="e.g., GR-1234-23" 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.vehicleNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Policy Number</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="text" 
                        name="policyNumber"
                        placeholder="e.g. POL-1234" 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-500/40 outline-none" 
                        value={newPolicy.policyNumber}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const policyNumber = `POL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
                          setNewPolicy(prev => ({ ...prev, policyNumber }));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Auto-generate
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Staff Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="text" 
                        name="staffName"
                        value={newPolicy.staffName}
                        readOnly
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">New/Renewal</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <select 
                        name="isNewRenewal"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                        value={newPolicy.isNewRenewal || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select...</option>
                        <option value="NEW">NEW</option>
                        <option value="RENEWAL">RENEWAL</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Renewal Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="date" 
                        name="renewalDate"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.renewalDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Insurance Company</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="text" 
                        name="insuranceCompany"
                        placeholder="e.g., Hollard, Enterprise" 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.insuranceCompany}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Type of Policy</label>
                    <select 
                      name="insuranceType"
                      className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                    >
                      <option>Health Insurance</option>
                      <option>Life Insurance</option>
                      <option>Auto Insurance</option>
                      <option>Home Insurance</option>
                    </select>
                  </div>
                </div>
              </div>

            {/* Financial Information */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-4">Financial Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Premium Amount (GHS)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input 
                      type="number" 
                      name="premiumAmtGhs"
                      placeholder="0.00" 
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newPolicy.premiumAmtGhs}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Premium Sticker (45)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input 
                      type="number" 
                      name="premiumSticker"
                      placeholder="45.00" 
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newPolicy.premiumSticker}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Class of Business</label>
                  <select
                    name="classOfBusiness"
                    value={newPolicy.classOfBusiness}
                    onChange={(e) => {
                      handleInputChange(e);
                      // value update triggers effect to set maxCommissionRate
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  >
                    <option value="">Select class...</option>
                    {commissionRates.map((r) => (
                      <option key={r.id} value={r.class_of_business}>{r.class_of_business}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Commission %</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                    <input 
                      type="number" 
                      name="commissionPercent"
                      step="0.01"
                      placeholder="16.5" 
                      className={`w-full pl-8 pr-4 py-2.5 bg-white rounded-xl text-sm outline-none ${
                        maxCommissionRate !== null && newPolicy.commissionPercent > maxCommissionRate
                          ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border border-slate-200 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                      value={newPolicy.commissionPercent}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    {maxCommissionRate !== null && (
                      <p className={`text-xs mt-1 font-medium ${
                        newPolicy.commissionPercent > maxCommissionRate
                          ? 'text-red-600 flex items-center gap-1'
                          : 'text-slate-400'
                      }`}>
                        {newPolicy.commissionPercent > maxCommissionRate && (
                          <AlertCircle size={14} className="inline" />
                        )}
                        Maximum allowed for this class: <span className="font-bold">{maxCommissionRate}%</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Commission Expected (GHS Gross)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input 
                      type="number" 
                      name="commissionExpectedGhs"
                      placeholder="0.00" 
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newPolicy.commissionExpectedGhs}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">With 7.5%</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input 
                      type="number" 
                      name="with75Percent"
                      placeholder="0.00" 
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newPolicy.with75Percent}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Net Comm</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input 
                      type="number" 
                      name="netComm"
                      placeholder="0.00" 
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newPolicy.netComm}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date Commission Paid</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                    <input 
                      type="date" 
                      name="dateCommissionPaid"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newPolicy.dateCommissionPaid}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Overrider</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                      <input 
                        type="number" 
                        name="overrider"
                        placeholder="0.00" 
                        className="w-full pl-17 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.overrider}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Net Overrider</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                    <input 
                      type="number" 
                      name="netOverrider"
                      placeholder="0.00" 
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newPolicy.netOverrider}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date Overrider Paid</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                    <input 
                      type="date" 
                      name="dateOverriderPaid"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      value={newPolicy.dateOverriderPaid}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Create Policy
            </button>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Policy Details"
        size="xl"
      >
        {viewingPolicy && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{viewingPolicy.policy_number || viewingPolicy.policyNumber}</h4>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{viewingPolicy.insurance_type || viewingPolicy.insuranceType}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                {getStatusBadge(viewingPolicy.status)}
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
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.client_name || viewingPolicy.clientName || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Vehicle Number</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Car className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.vehicle_number || viewingPolicy.vehicleNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Insurance Company</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Shield className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.insurance_company || viewingPolicy.insuranceCompany || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Staff Name</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <User className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.staff_name || viewingPolicy.staffName || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Class of Business</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                    </div>
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.class_of_business || viewingPolicy.classOfBusiness || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">New/Renewal</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Shield className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.is_new_renewal || viewingPolicy.isNewRenewal || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Renewal Date</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Calendar className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.renewal_date || viewingPolicy.renewalDate || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Paid</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Calendar className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.date_paid || viewingPolicy.datePaid || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Outstanding Premium Paid</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <DollarSign className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.outstanding_premium_paid || viewingPolicy.outstandingPremiumPaid || 'N/A'}</span>
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
                  <p className="text-lg font-black text-slate-800">GH₵ {(viewingPolicy.premiumAmtGhs || viewingPolicy.premium || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commission (%)</p>
                  <p className="text-lg font-black text-brand-600">{viewingPolicy.commission_percent || viewingPolicy.commissionPercent || 0}%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Comm.</p>
                  <p className="text-lg font-black text-slate-800">GH₵ {(viewingPolicy.commission_expected_ghs || viewingPolicy.commissionExpectedGhs || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Comm.</p>
                  <p className="text-lg font-black text-emerald-600">GH₵ {(viewingPolicy.net_comm || viewingPolicy.netComm || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Overrider</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <DollarSign className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">GH₵ {(viewingPolicy.overrider || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Net Overrider</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <DollarSign className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">GH₵ {(viewingPolicy.net_overrider || viewingPolicy.netOverrider || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Overrider Paid</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Calendar className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.date_overrider_paid || viewingPolicy.dateOverriderPaid || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">With 7.5%</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <DollarSign className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">GH₵ {(viewingPolicy.with_75_percent || viewingPolicy.with75Percent || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Commission Paid</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Calendar className="text-brand-600" size={18} />
                    <span className="text-sm text-slate-700 font-bold">{viewingPolicy.date_commission_paid || viewingPolicy.dateCommissionPaid || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditPolicy(viewingPolicy);
                }}
                className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
              >
                Edit Policy
              </button>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Policy"
        size="xl"
      >
        {editingPolicy && (
          <form className="space-y-6" onSubmit={handleUpdatePolicy}>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative overflow-hidden">
                  {newPolicy.isNewRenewal === 'RENEWAL' && (
                    <div className="absolute top-0 right-0 p-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm z-10">
                      Renewal Mode
                    </div>
                  )}
                  <h4 className="text-sm font-bold text-brand-600 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Insured Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                        <input 
                          type="text" 
                          name="clientName"
                          placeholder="Enter insured name" 
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                          value={newPolicy.clientName}
                          onChange={handleInputChange}
                          readOnly={newPolicy.isNewRenewal === 'RENEWAL'}
                        />
                      </div>
                    </div>
                    {newPolicy.isNewRenewal !== 'RENEWAL' && (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Outstanding Premium Paid</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                          <input 
                            type="text" 
                            name="outstandingPremiumPaid"
                            placeholder="e.g., Yes/No" 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                            value={newPolicy.outstandingPremiumPaid}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Vehicle Number</label>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                        <input 
                          type="text" 
                          name="vehicleNumber"
                          placeholder="e.g., GR-1234-23" 
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 outline-none transition-all ${
                            newPolicy.isNewRenewal === 'RENEWAL' 
                              ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' 
                              : 'bg-white border-slate-200 focus:ring-brand-500/20'
                          }`}
                          value={newPolicy.vehicleNumber}
                          onChange={handleInputChange}
                          readOnly={newPolicy.isNewRenewal === 'RENEWAL'}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Policy Number</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                        <input 
                          type="text" 
                          name="policyNumber"
                          placeholder="e.g. POL-1234" 
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 outline-none transition-all ${
                            newPolicy.isNewRenewal === 'RENEWAL' 
                              ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' 
                              : 'bg-slate-50 border-slate-200 focus:ring-slate-500/40'
                          }`}
                          value={newPolicy.policyNumber}
                          onChange={handleInputChange}
                          readOnly={newPolicy.isNewRenewal === 'RENEWAL'}
                        />
                      </div>
                    </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Staff Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="text" 
                        name="staffName"
                        value={newPolicy.staffName}
                        readOnly
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">New/Renewal</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <select 
                        name="isNewRenewal"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 outline-none transition-all ${
                          newPolicy.isNewRenewal === 'RENEWAL' 
                            ? 'bg-amber-50 border-amber-200 focus:ring-amber-500/20 border-2' 
                            : 'bg-white border-slate-200 focus:ring-brand-500/20 border'
                        }`}
                        value={newPolicy.isNewRenewal}
                        onChange={handleInputChange}
                      >
                        <option value="">Select...</option>
                        <option value="NEW">NEW</option>
                        <option value="RENEWAL">RENEWAL</option>
                      </select>
                    </div>
                  </div>

                  {newPolicy.isNewRenewal === 'RENEWAL' ? (
                    <div className="space-y-2 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl shadow-sm animate-pulse-slow">
                      <label className="text-sm font-black text-amber-700 ml-1 flex items-center gap-2">
                        <Calendar size={16} /> RENEWAL DATE
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" size={18} />
                        <input 
                          type="date" 
                          name="renewalDate"
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-amber-300 rounded-xl text-lg font-bold text-amber-900 focus:ring-4 focus:ring-amber-500/20 outline-none" 
                          value={formatDateForInput(newPolicy.renewalDate)}
                          onChange={handleInputChange}
                        />
                      </div>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1 ml-1">Please set the date for this renewal</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Renewal Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                        <input 
                          type="date" 
                          name="renewalDate"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                          value={formatDateForInput(newPolicy.renewalDate)}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Insurance Company</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <input 
                        type="text" 
                        name="insuranceCompany"
                        placeholder="e.g., Hollard, Enterprise" 
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 outline-none transition-all ${
                          newPolicy.isNewRenewal === 'RENEWAL' 
                            ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' 
                            : 'bg-white border-slate-200 focus:ring-brand-500/20'
                        }`}
                        value={newPolicy.insuranceCompany}
                        onChange={handleInputChange}
                        readOnly={newPolicy.isNewRenewal === 'RENEWAL'}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Type of Policy</label>
                    <select 
                      name="insuranceType"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm focus:ring-2 outline-none transition-all ${
                        newPolicy.isNewRenewal === 'RENEWAL' 
                          ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed appearance-none' 
                          : 'bg-amber-50/50 border-amber-200 focus:ring-amber-500/40'
                      }`}
                      value={newPolicy.insuranceType}
                      onChange={handleInputChange}
                      disabled={newPolicy.isNewRenewal === 'RENEWAL'}
                    >
                      <option>Health Insurance</option>
                      <option>Life Insurance</option>
                      <option>Auto Insurance</option>
                      <option>Home Insurance</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Class of Business</label>
                    <select
                      name="classOfBusiness"
                      value={newPolicy.classOfBusiness}
                      onChange={(e) => {
                        handleInputChange(e);
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm focus:ring-2 outline-none transition-all ${
                        newPolicy.isNewRenewal === 'RENEWAL' 
                          ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed appearance-none' 
                          : 'bg-white border-slate-200 focus:ring-brand-500/20'
                      }`}
                      disabled={newPolicy.isNewRenewal === 'RENEWAL'}
                    >
                      <option value="">Select class...</option>
                      {commissionRates.map((r) => (
                        <option key={r.id} value={r.class_of_business}>{r.class_of_business}</option>
                      ))}
                    </select>
                  </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative overflow-hidden">
                  {newPolicy.isNewRenewal === 'RENEWAL' && (
                    <div className="absolute top-0 right-0 p-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm z-10">
                      Update Premium
                    </div>
                  )}
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Financial Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Premium Amount (GHS)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                        <input 
                          type="number" 
                          name="premiumAmtGhs"
                          placeholder="0.00" 
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                          value={newPolicy.premiumAmtGhs}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Premium Sticker (45)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                        <input 
                          type="number" 
                          name="premiumSticker"
                          placeholder="45.00" 
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                          value={newPolicy.premiumSticker}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Commission %</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                        <input 
                          type="number" 
                          name="commissionPercent"
                          step="0.01"
                          placeholder="16.5" 
                          className={`w-full pl-8 pr-4 py-2.5 bg-white rounded-xl text-sm outline-none ${
                            maxCommissionRate !== null && newPolicy.commissionPercent > maxCommissionRate
                              ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500/20'
                              : 'border border-slate-200 focus:ring-2 focus:ring-brand-500/20'
                          }`}
                          value={newPolicy.commissionPercent}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-1">
                        {maxCommissionRate !== null && (
                          <p className={`text-xs mt-1 font-medium ${
                            newPolicy.commissionPercent > maxCommissionRate
                              ? 'text-red-600 flex items-center gap-1'
                              : 'text-slate-400'
                          }`}>
                            {newPolicy.commissionPercent > maxCommissionRate && (
                              <AlertCircle size={14} className="inline" />
                            )}
                            Maximum allowed for this class: <span className="font-bold">{maxCommissionRate}%</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Commission Expected (GHS Gross)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                        <input 
                          type="number" 
                          name="commissionExpectedGhs"
                          placeholder="0.00" 
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                          value={newPolicy.commissionExpectedGhs}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">With 7.5%</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                        <input 
                          type="number" 
                          name="with75Percent"
                          placeholder="0.00" 
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                          value={newPolicy.with75Percent}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Net Comm</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                        <input 
                          type="number" 
                          name="netComm"
                          placeholder="0.00" 
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                          value={newPolicy.netComm}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Date Commission Paid</label>
                      <input 
                        type="date" 
                        name="dateCommissionPaid"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={formatDateForInput(newPolicy.dateCommissionPaid)}
                        onChange={handleInputChange}
                      />
                    </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Overrider</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" size={18} />
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                      <input 
                        type="number" 
                        name="overrider"
                        placeholder="0.00" 
                        className="w-full pl-17 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={newPolicy.overrider}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Net Overrider</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">GH₵</span>
                        <input 
                          type="number" 
                          name="netOverrider"
                          placeholder="0.00" 
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                          value={newPolicy.netOverrider}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Date Overrider Paid</label>
                      <input 
                        type="date" 
                        name="dateOverriderPaid"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        value={formatDateForInput(newPolicy.dateOverriderPaid)}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className={cn(
                "flex-1 py-3 text-white rounded-xl font-bold transition-all shadow-lg",
                newPolicy.isNewRenewal === 'RENEWAL' 
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" 
                  : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/20"
              )}>
                {newPolicy.isNewRenewal === 'RENEWAL' ? 'Process Renewal' : 'Update Policy'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation Modal for Delete */}
      <Modal 
        isOpen={policyToDelete !== null} 
        onClose={cancelDeletePolicy} 
        title="Confirm Deletion"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600">Are you sure you want to delete this policy? This action cannot be undone.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={confirmDeletePolicy}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Delete Policy
            </button>
            <button 
              onClick={cancelDeletePolicy}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default PoliciesView;
