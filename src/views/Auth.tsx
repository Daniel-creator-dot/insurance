import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Role, User, cn } from '../types';
import { authAPI } from '../services/api';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'forgot' | 'otp' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email,
        password
      });

      const userData: User = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role as Role,
        avatar: response.data.user.avatar ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.data.user.avatar}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.data.user.name}`
      };

      localStorage.setItem('insurify_token', response.data.token);
      localStorage.setItem('insurify_user', JSON.stringify(userData));
      onLogin(userData);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      setUserId(response.data.user_id);
      setView('otp');
      setSuccess('OTP sent to your phone number.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authAPI.verifyOTP({ user_id: userId, otp });
      setView('reset');
      setSuccess('OTP verified. Please enter your new password.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authAPI.resetPassword({ 
        user_id: userId, 
        otp, 
        password: newPassword 
      });
      setView('login');
      setSuccess('Password reset successful. Please login with your new password.');
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl text-white shadow-xl shadow-brand-500/20 mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Insurify</h1>
          <p className="text-slate-500 mt-2">Professional Broker Management System</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} />
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setSuccess('');
                      setError('');
                    }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}


              <div className="flex items-center gap-2 ml-1">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                <label htmlFor="remember" className="text-sm text-slate-600 font-medium">Remember me</label>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 group",
                  isLoading 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <>
                    Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </form>
          ) : view === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
                <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send an OTP to your phone.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Send OTP'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setView('login');
                  setSuccess('');
                  setError('');
                }}
                className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 text-center"
              >
                Back to login
              </button>
            </form>
          ) : view === 'otp' ? (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">Enter OTP</h2>
                <p className="text-sm text-slate-500 mt-1">Please enter the 6-digit code sent to your phone.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">One-Time Password</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Verify OTP'}
              </button>
              <button 
                type="button"
                onClick={() => setView('forgot')}
                className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 text-center"
              >
                Resend OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">Set New Password</h2>
                <p className="text-sm text-slate-500 mt-1">Please enter your new secure password.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs mt-8">
          &copy; 2026 Insurify Broker Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthView;
