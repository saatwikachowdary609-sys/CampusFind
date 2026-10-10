import React, { useState } from 'react';
import { SiddharthaLogo } from './SiddharthaLogo';
import { User, NotificationItem } from '../types';
import {
  Search,
  UserCheck,
  Bell,
  ChevronDown,
  CheckCircle2,
  Shield,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  notifications: NotificationItem[];
  onOpenAuthModal: () => void;
  onMarkNotificationRead: (id: string) => void;
  onToggleAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeTab,
  onSelectTab,
  notifications,
  onOpenAuthModal,
  onMarkNotificationRead,
  onToggleAdmin,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Main Header with Logo & Role Controls */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* College Logo & Portal Title */}
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => onSelectTab('browse')}>
          <div className="bg-white p-1 rounded-sm border border-slate-200/60 shadow-2xs">
            <SiddharthaLogo maxWidth={280} />
          </div>
          <div className="hidden xl:block border-l border-slate-200 pl-3.5">
            <div className="font-bold tracking-tight text-slate-900 text-lg leading-none">
              CampusFind
            </div>
            <div className="text-[11px] text-slate-600 font-semibold tracking-wide uppercase mt-0.5">
              Smart Lost & Found System
            </div>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-2.5">
          {/* Admin Access Quick Button / Badge */}
          {onToggleAdmin && (
            <button
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition border cursor-pointer ${
                currentUser.role === 'admin'
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400 shadow-2xs'
                  : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border-slate-300 hover:border-indigo-300'
              }`}
              title={
                currentUser.role === 'admin'
                  ? 'Admin access active. Click to toggle role.'
                  : 'Click to enable Admin Access and unlock claiming permissions'
              }
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${currentUser.role === 'admin' ? 'text-amber-600' : 'text-slate-500'}`} />
              <span>{currentUser.role === 'admin' ? 'Admin Access: ON' : 'Enable Admin Access'}</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md relative transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Notifications
                  </span>
                  <span className="text-[11px] text-slate-500">{unreadCount} unread</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onMarkNotificationRead(notif.id);
                          onSelectTab('my-activity');
                          setShowNotifMenu(false);
                        }}
                        className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition ${
                          !notif.is_read ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                          <span>{notif.title}</span>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pl-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition text-left cursor-pointer"
            >
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.full_name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0D3B8E]">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{currentUser.full_name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                  <div className="text-[10px] text-blue-800 font-semibold mt-1">
                    ID: {currentUser.student_or_staff_id} · {currentUser.department}
                  </div>
                </div>

                {/* Quick Admin Access Toggle */}
                {onToggleAdmin && (
                  <div className="p-2 border-b border-slate-100 bg-amber-50/50">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onToggleAdmin();
                      }}
                      className={`w-full px-2.5 py-2 rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        currentUser.role === 'admin'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                          : 'bg-[#0D3B8E] text-white hover:bg-[#0A2D6E]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span>{currentUser.role === 'admin' ? 'Revoke Admin Role' : 'Grant Admin Access'}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/40">
                        {currentUser.role === 'admin' ? 'Active' : 'Turn On'}
                      </span>
                    </button>
                  </div>
                )}

                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role
                </div>
                {allUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 transition cursor-pointer ${
                      u.id === currentUser.id ? 'bg-blue-50/50 font-semibold text-[#0D3B8E]' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{u.role} · {u.department.split('&')[0]}</div>
                    </div>
                    {u.id === currentUser.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0D3B8E]" />
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuthModal();
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-[#0D3B8E] hover:bg-blue-50 font-semibold cursor-pointer"
                  >
                    Register / Sign In with College Email...
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar Tabs - ONLY Browse & Search and My Reports & Claims */}
      <nav className="bg-slate-50/90 border-t border-slate-200/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 py-1.5">
          <button
            onClick={() => onSelectTab('browse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-white text-[#0D3B8E] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Browse & Search
          </button>

          <button
            onClick={() => onSelectTab('my-activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === 'my-activity'
                ? 'bg-white text-[#0D3B8E] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            My Reports & Claims
          </button>
        </div>
      </nav>
    </header>
  );
};
