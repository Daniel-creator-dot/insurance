import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Calculator
} from 'lucide-react';
import { cn } from '../types';
import { Role } from '../types';

interface SidebarProps {
  role: Role;
  activeTab: string;
  // new optional props for submenu handling
  activeSubTab?: string;
  setActiveTab: (tab: string) => void;
  setActiveSubTab?: (sub: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeTab,
  activeSubTab,
  setActiveTab,
  setActiveSubTab,
  collapsed,
  setCollapsed,
  onLogout
}) => {
  const [expandedTabs, setExpandedTabs] = useState<string[]>([]);

  const toggleExpand = (tabId: string) => {
    setExpandedTabs(prev => 
      prev.includes(tabId) 
        ? prev.filter(id => id !== tabId) 
        : [...prev, tabId]
    );
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT', 'ACCOUNTANT'] },
    { id: 'policies', label: 'Policies', icon: FileText, roles: ['SUPER_ADMIN', 'SALES_AGENT'] },
    { id: 'clients', label: 'Clients', icon: Users, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT'] },
    { id: 'leads', label: 'Leads', icon: TrendingUp, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT'] },
    { id: 'sms', label: 'SMS Center', icon: MessageSquare, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT'] },
    { id: 'hr', label: 'HR & Payroll', icon: Calculator, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT', 'ACCOUNTANT'] },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: Wallet,
      roles: ['SUPER_ADMIN', 'ACCOUNTANT'],
      subItems: [
        { id: 'reconciliation', label: 'Reconciliation' },
        { id: 'journal', label: 'Journal Entries' },
        { id: 'cheques', label: 'Cheques' },
        { id: 'chart', label: 'Chart of Accounts' },
        { id: 'vouchers', label: 'Payment Vouchers' },
        { id: 'bank', label: 'Bank' },
        { id: 'payroll', label: 'Payroll' },
        { id: 'profitloss', label: 'Profit & Loss' },
      ]
    },
    { id: 'performance', label: 'Performance', icon: UserCheck, roles: ['SUPER_ADMIN'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT', 'ACCOUNTANT'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Kesbridge</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto">K</div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => {
                if (item.subItems && item.subItems.length > 0) {
                  toggleExpand(item.id);
                  // only switch tab if it's not already expanded or if we want to show the first subitem
                  if (!expandedTabs.includes(item.id)) {
                    setActiveTab(item.id);
                    setActiveSubTab && setActiveSubTab(item.subItems[0].id);
                  }
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                activeTab === item.id
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0",
                activeTab === item.id ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {!collapsed && <span>{item.label}</span>}
              {item.subItems && !collapsed && (
                <div className="ml-auto">
                  <ChevronRight size={14} className={cn(
                    "transition-transform duration-200",
                    expandedTabs.includes(item.id) && "rotate-90"
                  )} />
                </div>
              )}
            </button>

            {item.subItems && expandedTabs.includes(item.id) && !collapsed && (
              <div className="pl-8 space-y-1">
                {item.subItems.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setActiveSubTab && setActiveSubTab(sub.id);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                      activeSubTab === sub.id
                        ? "bg-brand-50 text-brand-700 font-medium"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 mt-2 rounded-xl text-red-500 hover:bg-red-50 transition-all",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
