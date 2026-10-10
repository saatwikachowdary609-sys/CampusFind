import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { SiddharthaLogo } from './SiddharthaLogo';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Building,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => Promise<User>;
  onRegister: (data: Partial<User>) => Promise<User>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (!email) throw new Error('Email is required');
        await onLogin(email);
      } else {
        if (!email || !fullName) throw new Error('Name and email are required');
        // College domain check reminder
        await onRegister({
          email,
          full_name: fullName,
          role,
          department,
          student_or_staff_id: studentId || 'SAHE-' + Math.floor(1000 + Math.random() * 9000),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header with College Crest */}
        <div className="px-6 py-5 bg-[#0A2558] text-white flex flex-col items-center justify-center text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 text-slate-300 hover:text-white rounded-md transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="bg-white p-2 rounded-md mb-2 shadow-xs">
            <SiddharthaLogo maxWidth={260} />
          </div>
          <div className="text-[10px] text-blue-200 uppercase tracking-widest mt-1">
            Single Sign-On & Property Registry Portal
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-slate-200 text-xs font-semibold bg-slate-50">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2.5 transition cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#0D3B8E] border-b-2 border-[#0D3B8E]' : 'text-slate-500'
            }`}
          >
            Sign In with Email
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2.5 transition cursor-pointer ${
              mode === 'register' ? 'bg-white text-[#0D3B8E] border-b-2 border-[#0D3B8E]' : 'text-slate-500'
            }`}
          >
            Register New Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Saatwika Chowdary K."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
                  >
                    <option value="student">Student</option>
                    <option value="security">Security Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Roll / Staff ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    placeholder="e.g. 221FA04001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              College Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. student@siddhartha.ac.in or saatwikachowdary609@gmail.com"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Supports college domains: @siddhartha.ac.in / @sahe.ac.in
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#0D3B8E] hover:bg-[#0A2E70] text-white font-bold rounded-md transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Sign In to CampusFind'
              : 'Create Verified Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
