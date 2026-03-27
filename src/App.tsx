import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AIChatbot from './components/AIChatbot';
import AuthView from './views/Auth';
import Dashboard from './views/Dashboard';
import PoliciesView from './views/Policies';
import ClientsView from './views/Clients';
import SMSView from './views/SMS';
import AccountsView from './views/Accounts';
import LeadsView from './views/Leads';
import PerformanceView from './views/Performance';
import SettingsView from './views/Settings';
import HRView from './views/HR';
import { User, Role, cn } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [viewingAsRole, setViewingAsRole] = useState<Role | null>(null);
  // default to dashboard so it appears after page reload
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('insurify_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setViewingAsRole(null);
    localStorage.setItem('insurify_user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setViewingAsRole(null);
    localStorage.removeItem('insurify_user');
  };

  const handleRoleSwitch = (role: Role) => {
    setViewingAsRole(role);
    setActiveTab('dashboard');
  };

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  const effectiveRole = viewingAsRole || user.role;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard role={effectiveRole} onNavigate={setActiveTab} />;
      case 'policies':
        return <PoliciesView onNavigate={setActiveTab} />;
      case 'clients':
        return <ClientsView />;
      case 'leads':
        return <LeadsView />;
      case 'performance':
        return <PerformanceView />;
      case 'sms':
        return <SMSView role={effectiveRole} />;
      case 'hr':
        return <HRView user={user} />;
      case 'accounts':
        return <AccountsView activeSubTab={activeSubTab} />;
      case 'settings':
        return <SettingsView role={effectiveRole} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <p className="text-lg font-medium">This module is coming soon!</p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-4 text-brand-600 font-bold hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          role={effectiveRole}
          activeTab={activeTab}
          activeSubTab={activeSubTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            // reset subtab when leaving accounts
            if (tab !== 'accounts') {
              setActiveSubTab('');
            }
          }}
          setActiveSubTab={setActiveSubTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onLogout={handleLogout}
        />
      </div>

      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-[70] lg:hidden"
            >
              <Sidebar
                role={effectiveRole}
                activeTab={activeTab}
                activeSubTab={activeSubTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  // keep mobile behavior consistent
                  setIsMobileMenuOpen(false);
                  if (tab !== 'accounts') {
                    setActiveSubTab('');
                  }
                }}
                setActiveSubTab={(sub) => setActiveSubTab(sub)}
                collapsed={false}
                setCollapsed={() => { }}
                onLogout={handleLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen flex flex-col",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <TopBar
          user={user}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          onRoleSwitch={user.role === 'SUPER_ADMIN' ? handleRoleSwitch : undefined}
          viewingAsRole={viewingAsRole || undefined}
          onNavigate={setActiveTab}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={activeTab + "-" + activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pb-12"
          >
            {renderContent()}
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400 font-medium tracking-tight">
            &copy; 2026 Insurify Broker Systems. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 font-medium">Privacy Policy</a>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 font-medium">Terms of Service</a>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 font-medium">Support</a>
          </div>
        </footer>

        {/* AI Chatbot */}
        <AIChatbot role={effectiveRole} />
      </main>
    </div>
  );
}
