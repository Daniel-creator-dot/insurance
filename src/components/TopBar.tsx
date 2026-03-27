import React, { useState } from 'react';
import { Bell, Search, User, ChevronDown, Menu, Eye } from 'lucide-react';
import { User as UserType, Role, cn } from '../types';

interface TopBarProps {
  user: UserType;
  onMenuClick?: () => void;
  onRoleSwitch?: (role: Role) => void;
  viewingAsRole?: Role;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ user, onMenuClick, onRoleSwitch, viewingAsRole, onNavigate, onLogout }) => {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const roles: Role[] = ['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT', 'ACCOUNTANT'];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
        >
          <Menu size={20} />
        </button>
        
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search policies, clients, or claims..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {user.role === 'SUPER_ADMIN' && onRoleSwitch && (
          <div className="relative ml-4">
            <button 
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewingAsRole && viewingAsRole !== 'SUPER_ADMIN' 
                  ? "bg-amber-50 text-amber-700 border border-amber-200" 
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              )}
            >
              <Eye size={14} />
              {viewingAsRole ? `Viewing as: ${viewingAsRole.replace('_', ' ')}` : 'Switch View'}
              <ChevronDown size={14} />
            </button>

            {isRoleMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsRoleMenuOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="p-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select View</p>
                  </div>
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleSwitch(role);
                        setIsRoleMenuOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",
                        (viewingAsRole || user.role) === role 
                          ? "bg-brand-50 text-brand-700 font-bold" 
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        
        <div className="relative">
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 p-1 pl-2 hover:bg-slate-50 rounded-full transition-colors group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 border border-brand-200 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={20} />
              )}
            </div>
            <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          
          {isProfileMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 border border-brand-200 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      onNavigate?.('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <User size={16} />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      onLogout?.();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
