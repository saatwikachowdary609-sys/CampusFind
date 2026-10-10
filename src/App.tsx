import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import {
  User,
  Item,
  Claim,
  NotificationItem,
  ItemStatus,
} from './types';
import { Navbar } from './components/Navbar';
import { BrowseView } from './components/BrowseView';
import { MyActivityView } from './components/MyActivityView';
import { ReportLostModal } from './components/ReportLostModal';
import { ReportFoundModal } from './components/ReportFoundModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ClaimModal } from './components/ClaimModal';
import { AuthModal } from './components/AuthModal';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-activity'>('browse');

  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isReportLostOpen, setIsReportLostOpen] = useState(false);
  const [isReportFoundOpen, setIsReportFoundOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<Item | null>(null);

  // Initial load
  const loadData = async (userId?: string) => {
    try {
      setLoading(true);
      const [uRes, usersRes, iRes, cRes, nRes] = await Promise.all([
        api.getCurrentUser(userId),
        api.getUsers(),
        api.getItems(),
        api.getClaims({ all: true }, userId),
        api.getNotifications(userId),
      ]);

      setCurrentUser(uRes.user);
      setAllUsers(usersRes.users);
      setItems(iRes.items);
      setClaims(cRes.claims);
      setNotifications(nRes.notifications);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectUser = async (user: User) => {
    setCurrentUser(user);
    await loadData(user.id);
  };

  // Actions
  const handleReportLostSubmit = async (itemData: any) => {
    if (!currentUser) return;
    const res = await api.createItem(itemData, currentUser.id);
    await loadData(currentUser.id);
    setActiveTab('my-activity');
    alert(`Report registered successfully! Reference: ${res.item.reference_code}`);
  };

  const handleReportFoundSubmit = async (itemData: any) => {
    if (!currentUser) return;
    const res = await api.createItem(itemData, currentUser.id);
    await loadData(currentUser.id);
    setActiveTab('browse');
    alert(`Found item registered! Reference: ${res.item.reference_code}`);
  };

  const handleClaimSubmit = async (claimData: any) => {
    if (!currentUser) return;
    await api.createClaim(claimData, currentUser.id);
    await loadData(currentUser.id);
    setActiveTab('my-activity');
  };

  const handleReviewClaim = async (claimId: string, decision: 'approved' | 'rejected', notes: string) => {
    if (!currentUser) return;
    await api.reviewClaim(claimId, decision, notes, currentUser.id);
    await loadData(currentUser.id);
  };

  const handleUpdateItemStatus = async (
    itemId: string,
    status: ItemStatus,
    notes?: string
  ) => {
    if (!currentUser) return;
    await api.updateItemStatus(itemId, { status, notes }, currentUser.id);
    await loadData(currentUser.id);
    // Refresh currently selected item modal if open
    setSelectedItemForDetail(prev => (prev && prev.id === itemId ? { ...prev, status } : prev));
  };

  const handleMarkNotifRead = async (id: string) => {
    await api.markNotificationRead(id);
    if (currentUser) {
      const nRes = await api.getNotifications(currentUser.id);
      setNotifications(nRes.notifications);
    }
  };

  const handleLogin = async (email: string) => {
    const res = await api.login(email);
    setCurrentUser(res.user);
    await loadData(res.user.id);
    return res.user;
  };

  const handleRegister = async (data: Partial<User>) => {
    const res = await api.register(data);
    setCurrentUser(res.user);
    await loadData(res.user.id);
    return res.user;
  };

  const handleToggleAdmin = async () => {
    if (!currentUser) return;
    try {
      const res = await api.toggleAdmin(currentUser.id);
      setCurrentUser(res.user);
      await loadData(res.user.id);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle admin role');
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <RotateCcw className="w-8 h-8 text-[#0D3B8E] animate-spin mb-3" />
        <div className="font-serif font-black text-xl text-slate-800">CampusFind</div>
        <div className="text-xs text-slate-500 mt-1">Siddhartha Academy of Higher Education · Connecting to Registry...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Top Navbar */}
      {currentUser && (
        <Navbar
          currentUser={currentUser}
          allUsers={allUsers}
          onSelectUser={handleSelectUser}
          activeTab={activeTab}
          onSelectTab={tab => setActiveTab(tab as 'browse' | 'my-activity')}
          notifications={notifications}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onMarkNotificationRead={handleMarkNotifRead}
          onToggleAdmin={handleToggleAdmin}
        />
      )}

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {currentUser && activeTab === 'browse' && (
          <BrowseView
            items={items}
            currentUser={currentUser}
            onSelectItem={setSelectedItemForDetail}
            onOpenReportLost={() => setIsReportLostOpen(true)}
            onOpenReportFound={() => setIsReportFoundOpen(true)}
            onOpenClaimModal={setSelectedItemForClaim}
          />
        )}

        {currentUser && activeTab === 'my-activity' && (
          <MyActivityView
            currentUser={currentUser}
            items={items}
            claims={claims}
            onSelectItem={setSelectedItemForDetail}
            onOpenReportLost={() => setIsReportLostOpen(true)}
            onOpenReportFound={() => setIsReportFoundOpen(true)}
            onOpenClaimModal={setSelectedItemForClaim}
            onReviewClaim={handleReviewClaim}
            onUpdateItemStatus={handleUpdateItemStatus}
            onToggleAdmin={handleToggleAdmin}
          />
        )}
      </main>

      {/* Footer with Siddhartha Information */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-bold text-slate-800">SIDDHARTHA ACADEMY OF HIGHER EDUCATION</span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span>Deemed to be University u/s 3 of UGC Act, 1956</span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="italic">ఆత్మదీపోభవ (Atma Deepo Bhava)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Administrative Office & Campus Registry</span>
            <span>·</span>
            <span>Helpdesk: +91 866 2582333</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {currentUser && (
        <>
          <ReportLostModal
            isOpen={isReportLostOpen}
            onClose={() => setIsReportLostOpen(false)}
            onSubmit={handleReportLostSubmit}
            currentUser={currentUser}
          />

          <ReportFoundModal
            isOpen={isReportFoundOpen}
            onClose={() => setIsReportFoundOpen(false)}
            onSubmit={handleReportFoundSubmit}
            currentUser={currentUser}
          />

          <ItemDetailModal
            isOpen={!!selectedItemForDetail}
            item={selectedItemForDetail}
            onClose={() => setSelectedItemForDetail(null)}
            currentUser={currentUser}
            onOpenClaimModal={setSelectedItemForClaim}
            onUpdateItemStatus={handleUpdateItemStatus}
            onToggleAdmin={handleToggleAdmin}
          />

          <ClaimModal
            isOpen={!!selectedItemForClaim}
            item={selectedItemForClaim}
            onClose={() => setSelectedItemForClaim(null)}
            currentUser={currentUser}
            onSubmit={handleClaimSubmit}
          />

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        </>
      )}
    </div>
  );
}
