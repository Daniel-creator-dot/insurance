import React, { useState, useEffect } from 'react';
import {
  User, 
  Users,
  Shield, 
  Bell, 
  Lock, 
  Globe, 
  Mail, 
  Building, 
  Save,
  ChevronRight,
  CreditCard,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Camera,
  RefreshCw,
  XCircle,
  Wifi,
  WifiOff,
  Tag
} from 'lucide-react';
import { cn, Role } from '../types';
import Modal from '../components/Modal';
import { useNotification } from '../components/Notification';
import { smsConfigAPI, userAPI, commissionRateAPI, authAPI, settingsAPI } from '../services/api';

interface SettingsProps {
  role: Role;
}

const SettingsView: React.FC<SettingsProps> = ({ role }) => {
  const { showSuccess, showError } = useNotification();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    timezone: 'Accra (GMT+00:00)'
  });

  const [companyForm, setCompanyForm] = useState({
    company_name: 'Kesbridge',
    tax_id: 'TX-99281-B',
    office_address: 'Mathehko-Acca Prime care'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const profile = response.data;
        setProfileForm({
          name: profile.name || '',
          email: profile.email || '',
          phone_number: profile.phone_number || '',
          timezone: 'Accra (GMT+00:00)'
        });
        if (profile.avatar) {
          setSelectedAvatar(profile.avatar);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const [smsConfigs, setSmsConfigs] = useState([]);
  const [isAddSmsModalOpen, setIsAddSmsModalOpen] = useState(false);
  const [isEditSmsModalOpen, setIsEditSmsModalOpen] = useState(false);
  const [editingSmsConfig, setEditingSmsConfig] = useState(null);
  const [smsForm, setSmsForm] = useState({
    provider: '',
    apiKey: '',
    apiSecret: '',
    phoneNumber: '',
    senderId: '',
    isActive: false
  });

  // Commission rate management state
  const [commissionRates, setCommissionRates] = useState([]);
  const [isAddCommissionModalOpen, setIsAddCommissionModalOpen] = useState(false);
  const [isEditCommissionModalOpen, setIsEditCommissionModalOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [commissionForm, setCommissionForm] = useState({
    class_of_business: '',
    agreed_rate: ''
  });
  const [users, setUsers] = useState([]);


  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT', 'ACCOUNTANT'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['SUPER_ADMIN'] },
    { id: 'company', label: 'Company Info', icon: Building, roles: ['SUPER_ADMIN'] },
    { id: 'security', label: 'Security & Auth', icon: Lock, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT', 'ACCOUNTANT'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT', 'ACCOUNTANT'] },
    { id: 'sms-config', label: 'SMS Configuration', icon: SettingsIcon, roles: ['SUPER_ADMIN'] },
    { id: 'commission-rates', label: 'Commission Rates', icon: Tag, roles: ['SUPER_ADMIN'] },
  ].filter(s => s.roles.includes(role));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSection === 'profile') {
      try {
        const response = await authAPI.updateProfile({
          ...profileForm,
          avatar: selectedAvatar
        });
        
        // Update local storage with new user data
        const updatedUser = response.data.user;
        const storedUser = JSON.parse(localStorage.getItem('insurify_user') || '{}');
        const newUser = {
          ...storedUser,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${updatedUser.avatar}`
        };
        localStorage.setItem('insurify_user', JSON.stringify(newUser));

        setIsSaved(true);
        showSuccess('Success', 'Profile updated successfully!');
        setTimeout(() => setIsSaved(false), 3000);
      } catch (error) {
        console.error('Failed to update profile:', error);
        showError('Update Failed', 'Unable to update profile. Please try again.');
      }
    } else if (activeSection === 'company') {
      try {
        await settingsAPI.updateCompanyInfo(companyForm);
        setIsSaved(true);
        showSuccess('Success', 'Company info updated successfully!');
        setTimeout(() => setIsSaved(false), 3000);
      } catch (error) {
        console.error('Failed to update company info:', error);
        showError('Update Failed', 'Unable to update company information.');
      }
    } else {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleEditUser = async (user) => {
    try {
      // Fetch the complete user data from the API
      const response = await userAPI.getById(user.id);
      const userData = response.data || response;
      
      setEditingUser(userData);
      setUserForm({
        name: userData.name,
        email: userData.email,
        phone_number: userData.phone_number || '',
        role: userData.role,
        is_active: userData.is_active
      });
      setIsEditUserModalOpen(true);
    } catch (error) {
      console.error('Failed to load user data for editing:', error);
      showError('Load Failed', 'Unable to load user data. Please try again.');
    }
  };

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    role: '',
    is_active: false
  });

  const handleDeleteUser = async (userId) => {
    // Set the user ID to delete and open the confirmation modal
    setDeletingUserId(userId);
    setIsDeleteUserModalOpen(true);
  };

  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const confirmDeleteUser = async () => {
    if (deletingUserId) {
      try {
        await userAPI.delete(deletingUserId);
        // Reload users after deletion
        loadUsers();
        // Close the modal
        setIsDeleteUserModalOpen(false);
        setDeletingUserId(null);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      console.log('Loaded users response:', response);
      const userList = response?.data || response || [];
      console.log('Extracted users:', userList);
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  // Load users when user management section is active
  useEffect(() => {
    if (activeSection === 'users') {
      loadUsers();
    }
  }, [activeSection]);

  // Load SMS configs when SMS config section is active
  useEffect(() => {
    if (activeSection === 'sms-config') {
      loadSmsConfigs();
    }
    if (activeSection === 'commission-rates') {
      loadCommissionRates();
    }
    if (activeSection === 'company') {
      loadCompanyInfo();
    }
  }, [activeSection]);

  const loadCompanyInfo = async () => {
    try {
      const res = await settingsAPI.getCompanyInfo();
      if (res.data) {
        setCompanyForm({
          company_name: res.data.company_name || '',
          tax_id: res.data.tax_id || '',
          office_address: res.data.office_address || ''
        });
      }
    } catch (error) {
      console.error('Failed to load company info:', error);
    }
  };

  const loadSmsConfigs = async () => {
    try {
      const response = await smsConfigAPI.getAll();
      console.log('Loaded SMS configs response:', response);
      const configList = response?.data || response || [];
      console.log('Extracted SMS configs:', configList);
      setSmsConfigs(Array.isArray(configList) ? configList : []);
    } catch (error) {
      console.error('Failed to load SMS configs:', error);
      setSmsConfigs([]);
    }
  };

  const loadCommissionRates = async () => {
    try {
      const response = await commissionRateAPI.getAll();
      const rates = response?.data || response || [];
      setCommissionRates(Array.isArray(rates) ? rates : []);
    } catch (error) {
      console.error('Failed to load commission rates:', error);
      setCommissionRates([]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500 text-sm">Manage your account preferences and system configurations.</p>
        </div>
        {isSaved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={18} />
            Settings saved successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeSection === section.id 
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" 
                  : "text-slate-500 hover:bg-white hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <section.icon size={18} />
                {section.label}
              </div>
              <ChevronRight size={16} className={cn(activeSection === section.id ? "opacity-100" : "opacity-0")} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                {sections.find(s => s.id === activeSection)?.label}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  {/* Avatar Selection */}
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 border-2 border-brand-100 relative group cursor-pointer overflow-hidden shadow-inner">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <RefreshCw size={20} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Profile Picture</h4>
                      <p className="text-xs text-slate-400 mt-1">Choose from available avatars or upload your own.</p>
                      <div className="flex gap-2 mt-3">
                        <button 
                          type="button" 
                          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700"
                        >
                          Choose Avatar
                        </button>
                        <button type="button" className="text-xs font-bold text-brand-600 hover:text-brand-700">Upload new</button>
                        <button 
                          type="button" 
                          onClick={() => setSelectedAvatar('avatar1')}
                          className="text-xs font-bold text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Avatar Picker Modal */}
                  <Modal
                    isOpen={showAvatarPicker}
                    onClose={() => setShowAvatarPicker(false)}
                    title="Choose Avatar"
                    size="sm"
                  >
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6'].map((avatar, index) => (
                        <button
                          key={avatar}
                          onClick={() => {
                            setSelectedAvatar(avatar);
                            setShowAvatarPicker(false);
                          }}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedAvatar === avatar 
                              ? 'border-brand-600 bg-brand-50' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar}`} 
                            alt={avatar}
                            className="w-full h-16 object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-xs text-slate-500 mt-2 capitalize">Avatar {index + 1}</p>
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowAvatarPicker(false)}
                        className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all"
                      >
                        Select Avatar
                      </button>
                      <button 
                        onClick={() => setShowAvatarPicker(false)}
                        className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </Modal>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                      <input 
                        type="text" 
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="email" 
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Timezone</label>
                      <select 
                        value={profileForm.timezone}
                        onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                      >
                        <option>Accra (GMT+00:00)</option>
                        <option>UTC (GMT+00:00)</option>
                        <option>EST (GMT-05:00)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Manage System Users</h4>
                      <p className="text-xs text-slate-400 mt-1">Create and manage staff accounts and permissions.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                    >
                      <Plus size={16} /> Add New User
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <tr>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.map((user, i) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                  <p className="text-[10px] text-slate-400">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                user.is_active ? 'text-emerald-600' : 'text-slate-400'
                              )}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  type="button" 
                                  onClick={() => handleEditUser(user)}
                                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'company' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Company Name</label>
                      <input 
                        type="text" 
                        value={companyForm.company_name} 
                        onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Tax ID / Registration</label>
                      <input 
                        type="text" 
                        value={companyForm.tax_id} 
                        onChange={(e) => setCompanyForm({ ...companyForm, tax_id: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Office Address</label>
                      <textarea 
                        rows={3} 
                        value={companyForm.office_address}
                        onChange={(e) => setCompanyForm({ ...companyForm, office_address: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none resize-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Two-Factor Authentication</p>
                      <p className="text-xs text-amber-700 mt-1">Add an extra layer of security to your account by enabling 2FA.</p>
                      <button type="button" className="mt-2 text-xs font-bold text-amber-900 underline">Enable now</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800">Change Password</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Current Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-4">
                  {[
                    { title: 'Email Notifications', desc: 'Receive daily summaries and alerts via email.' },
                    { title: 'Push Notifications', desc: 'Get real-time updates in your browser.' },
                    { title: 'SMS Alerts', desc: 'Critical policy expiry alerts via SMS.' },
                    { title: 'Marketing Updates', desc: 'News about system updates and new features.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'sms-config' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">SMS Gateway Configuration</h4>
                      <p className="text-xs text-slate-400 mt-1">Configure your SMS service provider settings.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setSmsForm({
                          provider: '',
                          apiKey: '',
                          apiSecret: '',
                          phoneNumber: '',
                          senderId: '',
                          isActive: false
                        });
                        setIsAddSmsModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                    >
                      <Plus size={16} /> Add Configuration
                    </button>
                  </div>

                  {Array.isArray(smsConfigs) && smsConfigs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <SettingsIcon size={24} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm">No SMS configurations found. Add your first SMS gateway configuration to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(smsConfigs) && smsConfigs.map((config) => (
                        <div key={config.id} className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{config.provider} Configuration</p>
                              <p className="text-xs text-slate-400">
                                {config.is_active ? 'Active SMS gateway' : 'Inactive configuration'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {config.is_active ? (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">Active</span>
                              ) : (
                                <button 
                                  type="button" 
                                  onClick={async () => {
                                    try {
                                      await smsConfigAPI.activate(config.id);
                                      loadSmsConfigs();
                                    } catch (error) {
                                      console.error('Failed to activate config:', error);
                                    }
                                  }}
                                  className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200"
                                >
                                  Activate
                                </button>
                              )}
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingSmsConfig(config);
                                  setSmsForm({
                                    provider: config.provider,
                                    apiKey: config.api_key,
                                    apiSecret: config.api_secret,
                                    phoneNumber: config.phone_number,
                                    senderId: config.sender_id,
                                    isActive: config.is_active
                                  });
                                  setIsEditSmsModalOpen(true);
                                }}
                                className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200"
                              >
                                Edit
                              </button>
                              <button 
                                type="button" 
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this SMS configuration?')) {
                                    try {
                                      await smsConfigAPI.delete(config.id);
                                      loadSmsConfigs();
                                    } catch (error) {
                                      console.error('Failed to delete config:', error);
                                    }
                                  }
                                }}
                                className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                            <div>
                              <span className="font-bold">Provider:</span> {config.provider}
                            </div>
                            <div>
                              <span className="font-bold">Phone Number:</span> {config.phone_number}
                            </div>
                            <div>
                              <span className="font-bold">Sender ID:</span> {config.sender_id}
                            </div>
                            <div>
                              <span className="font-bold">Status:</span> 
                              <span className={cn(
                                "ml-1",
                                config.is_active ? 'text-emerald-600' : 'text-slate-400'
                              )}>
                                {config.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold">API Key:</span> {config.api_key ? '••••••••••••••••' : 'Not set'}
                            </div>
                            <div>
                              <span className="font-bold">API Secret:</span> {config.api_secret ? '••••••••••••••••' : 'Not set'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeSection === 'commission-rates' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Commission Rates</h4>
                      <p className="text-xs text-slate-400 mt-1">Manage maximum agreed commission rates by class of business.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCommissionForm({ class_of_business: '', agreed_rate: '' });
                        setIsAddCommissionModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                    >
                      <Plus size={16} /> Add Rate
                    </button>
                  </div>

                  {Array.isArray(commissionRates) && commissionRates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Tag size={24} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm">No commission rates configured. Add the agreed rates for each class of business.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(commissionRates) && commissionRates.map((rate) => (
                        <div key={rate.id} className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{rate.class_of_business}</p>
                              <p className="text-xs text-slate-400">Agreed rate: {rate.agreed_rate}%</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommission(rate);
                                  setCommissionForm({
                                    class_of_business: rate.class_of_business,
                                    agreed_rate: rate.agreed_rate.toString()
                                  });
                                  setIsEditCommissionModalOpen(true);
                                }}
                                className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm('Delete this rate?')) {
                                    try {
                                      await commissionRateAPI.delete(rate.id);
                                      loadCommissionRates();
                                    } catch (err) {
                                      console.error('Failed to delete rate', err);
                                    }
                                  }
                                }}
                                className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </form>

          {activeSection === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4">Account Status</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Verified Professional</p>
                    <p className="text-xs text-slate-400">Your identity has been verified by the system.</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-slate-400 cursor-not-allowed">Verified</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Create New User"
        size="md"
      >
        <form className="space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          try {
            const formData = new FormData(e.target as HTMLFormElement);
            const userData = {
              name: formData.get('name') as string,
              email: formData.get('email') as string,
              phone_number: formData.get('phone_number') as string,
              role: formData.get('role') as string,
              password: formData.get('password') as string
            };
            
            await userAPI.create(userData);
            loadUsers();
            setIsAddUserModalOpen(false);
            
            showSuccess('User Created', `${userData.name} has been successfully added to the system.`);
          } catch (error) {
            console.error('Failed to create user:', error);
            showError('Creation Failed', 'Unable to create user. Please try again.');
          }
        }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <input 
                type="text" 
                name="name"
                placeholder="e.g. Jane Doe" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  name="email"
                  placeholder="jane@insurify.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
              <input 
                type="tel" 
                name="phone_number"
                placeholder="+233..." 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  name="role"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none appearance-none" 
                  required
                >
                  <option value="MARKETER">Marketer</option>
                  <option value="SALES_AGENT">Sales Agent</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Temporary Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  name="password"
                  value="zxcv123$$"
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none cursor-not-allowed" 
                  required 
                />
              </div>
              <p className="text-xs text-slate-400">Password is set to zxcv123$$ for all new users</p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Create User
            </button>
            <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Add SMS Configuration Modal */}
      <Modal
        isOpen={isAddSmsModalOpen}
        onClose={() => setIsAddSmsModalOpen(false)}
        title="Add SMS Configuration"
        size="md"
      >
        <form className="space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await smsConfigAPI.create(smsForm);
            loadSmsConfigs();
            setIsAddSmsModalOpen(false);
            setSmsForm({
              provider: '',
              apiKey: '',
              apiSecret: '',
              phoneNumber: '',
              senderId: '',
              isActive: false
            });
          } catch (error) {
            console.error('Failed to create SMS config:', error);
          }
        }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Provider</label>
              <input 
                type="text" 
                placeholder="e.g. Twilio, Nexmo" 
                value={smsForm.provider}
                onChange={(e) => setSmsForm({...smsForm, provider: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">API Key</label>
              <input 
                type="password" 
                placeholder="Your API key" 
                value={smsForm.apiKey}
                onChange={(e) => setSmsForm({...smsForm, apiKey: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">API Secret</label>
              <input 
                type="password" 
                placeholder="Your API secret" 
                value={smsForm.apiSecret}
                onChange={(e) => setSmsForm({...smsForm, apiSecret: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="+1234567890" 
                value={smsForm.phoneNumber}
                onChange={(e) => setSmsForm({...smsForm, phoneNumber: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Sender ID</label>
              <input 
                type="text" 
                placeholder="e.g. Insurify" 
                value={smsForm.senderId}
                onChange={(e) => setSmsForm({...smsForm, senderId: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
              />
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="isActive"
                checked={smsForm.isActive}
                onChange={(e) => setSmsForm({...smsForm, isActive: e.target.checked})}
                className="w-4 h-4 text-brand-600 bg-slate-100 border-slate-300 rounded focus:ring-brand-500"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Set as Active Configuration</label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Create Configuration
            </button>
            <button type="button" onClick={() => setIsAddSmsModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Commission Rate Modal */}
      <Modal
        isOpen={isAddCommissionModalOpen}
        onClose={() => setIsAddCommissionModalOpen(false)}
        title="Add Commission Rate"
        size="md"
      >
        <form className="space-y-6" onSubmit={async (e) => {
          e.preventDefault();

          // prevent duplicates locally so user gets immediate feedback
          if (commissionRates.some(r => r.class_of_business.toLowerCase() === commissionForm.class_of_business.trim().toLowerCase())) {
            showError('Duplicate Rate', 'A commission rate for that class already exists.');
            return;
          }

          try {
            await commissionRateAPI.create({
              class_of_business: commissionForm.class_of_business,
              agreed_rate: parseFloat(commissionForm.agreed_rate)
            });
            loadCommissionRates();
            setIsAddCommissionModalOpen(false);
            setCommissionForm({ class_of_business: '', agreed_rate: '' });

            showSuccess('Rate Added', 'Commission rate has been successfully created.');
          } catch (err) {
            console.error('Failed to create commission rate', err);
            showError('Creation Failed', err.response?.data?.error || err.message || 'Unable to add rate');
          }
        }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Class of Business</label>
              <input
                type="text"
                placeholder="e.g. Fire, Motor Comprehensive"
                value={commissionForm.class_of_business}
                onChange={(e) => setCommissionForm({ ...commissionForm, class_of_business: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Agreed Rate (%)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 20"
                value={commissionForm.agreed_rate}
                onChange={(e) => setCommissionForm({ ...commissionForm, agreed_rate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Create Rate
            </button>
            <button type="button" onClick={() => setIsAddCommissionModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Commission Rate Modal */}
      <Modal
        isOpen={isEditCommissionModalOpen}
        onClose={() => setIsEditCommissionModalOpen(false)}
        title="Edit Commission Rate"
        size="md"
      >
        <form className="space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          if (!editingCommission) return;
          try {
            await commissionRateAPI.update(editingCommission.id, {
              class_of_business: commissionForm.class_of_business,
              agreed_rate: parseFloat(commissionForm.agreed_rate)
            });
            loadCommissionRates();
            setIsEditCommissionModalOpen(false);
            setEditingCommission(null);
            setCommissionForm({ class_of_business: '', agreed_rate: '' });
          } catch (err) {
            console.error('Failed to update commission rate', err);
          }
        }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Class of Business</label>
              <input
                type="text"
                placeholder="e.g. Fire, Motor Comprehensive"
                value={commissionForm.class_of_business}
                onChange={(e) => setCommissionForm({ ...commissionForm, class_of_business: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Agreed Rate (%)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 20"
                value={commissionForm.agreed_rate}
                onChange={(e) => setCommissionForm({ ...commissionForm, agreed_rate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Save Changes
            </button>
            <button type="button" onClick={() => setIsEditCommissionModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {/* Edit User Modal */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        title="Edit User"
        size="md"
      >
        <form className="space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await userAPI.update(editingUser.id, userForm);
            loadUsers();
            setIsEditUserModalOpen(false);
            setEditingUser(null);
            showSuccess('Success', 'User updated successfully');
          } catch (error) {
            console.error('Failed to update user:', error);
            showError('Error', 'Failed to update user. Please try again.');
          }
        }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Jane Doe" 
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="jane@insurify.com" 
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="+233..." 
                value={userForm.phone_number}
                onChange={(e) => setUserForm({...userForm, phone_number: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none appearance-none" 
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  required
                >
                  <option value="MARKETER">Marketer</option>
                  <option value="SALES_AGENT">Sales Agent</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="editIsActiveUser"
                checked={userForm.is_active}
                onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                className="w-4 h-4 text-brand-600 bg-slate-100 border-slate-300 rounded focus:ring-brand-500"
              />
              <label htmlFor="editIsActiveUser" className="text-sm font-bold text-slate-700">Active User</label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Update User
            </button>
            <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteUserModalOpen}
        onClose={() => setIsDeleteUserModalOpen(false)}
        title="Delete User"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-amber-900">Confirm User Deletion</p>
              <p className="text-xs text-amber-700 mt-1">This action cannot be undone. The user will be permanently removed from the system.</p>
            </div>
          </div>
          
          {deletingUserId && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-800 mb-2">User Details:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div><span className="font-bold">Name:</span> {users.find(u => u.id === deletingUserId)?.name}</div>
                <div><span className="font-bold">Email:</span> {users.find(u => u.id === deletingUserId)?.email}</div>
                <div><span className="font-bold">Role:</span> {users.find(u => u.id === deletingUserId)?.role}</div>
                <div><span className="font-bold">Status:</span> {users.find(u => u.id === deletingUserId)?.is_active ? 'Active' : 'Inactive'}</div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={confirmDeleteUser}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
            >
              Delete User
            </button>
            <button 
              type="button" 
              onClick={() => {
                setIsDeleteUserModalOpen(false);
                setDeletingUserId(null);
              }}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit SMS Configuration Modal */}
      <Modal
        isOpen={isEditSmsModalOpen}
        onClose={() => setIsEditSmsModalOpen(false)}
        title="Edit SMS Configuration"
        size="md"
      >
        <form className="space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await smsConfigAPI.update(editingSmsConfig.id, smsForm);
            loadSmsConfigs();
            setIsEditSmsModalOpen(false);
            setEditingSmsConfig(null);
          } catch (error) {
            console.error('Failed to update SMS config:', error);
          }
        }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Provider</label>
              <input 
                type="text" 
                placeholder="e.g. Twilio, Nexmo" 
                value={smsForm.provider}
                onChange={(e) => setSmsForm({...smsForm, provider: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">API Key</label>
              <input 
                type="password" 
                placeholder="Your API key" 
                value={smsForm.apiKey}
                onChange={(e) => setSmsForm({...smsForm, apiKey: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">API Secret</label>
              <input 
                type="password" 
                placeholder="Your API secret" 
                value={smsForm.apiSecret}
                onChange={(e) => setSmsForm({...smsForm, apiSecret: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="+1234567890" 
                value={smsForm.phoneNumber}
                onChange={(e) => setSmsForm({...smsForm, phoneNumber: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Sender ID</label>
              <input 
                type="text" 
                placeholder="e.g. Insurify" 
                value={smsForm.senderId}
                onChange={(e) => setSmsForm({...smsForm, senderId: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" 
              />
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="editIsActive"
                checked={smsForm.isActive}
                onChange={(e) => setSmsForm({...smsForm, isActive: e.target.checked})}
                className="w-4 h-4 text-brand-600 bg-slate-100 border-slate-300 rounded focus:ring-brand-500"
              />
              <label htmlFor="editIsActive" className="text-sm font-bold text-slate-700">Set as Active Configuration</label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              Update Configuration
            </button>
            <button type="button" onClick={() => setIsEditSmsModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsView;
