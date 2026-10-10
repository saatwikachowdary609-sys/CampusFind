import React, { useState } from 'react';
import { Item, User, ItemStatus } from '../types';
import {
  X,
  MapPin,
  Calendar,
  Shield,
  Lock,
  Unlock,
  FileQuestion,
  Phone,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenClaimModal: (item: Item) => void;
  onUpdateItemStatus?: (itemId: string, status: ItemStatus, notes?: string) => Promise<void>;
  onToggleAdmin?: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  currentUser,
  onOpenClaimModal,
  onUpdateItemStatus,
  onToggleAdmin,
}) => {
  if (!isOpen || !item) return null;

  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>(item.status);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isOwner = currentUser.id === item.user_id;
  const isPrivileged = isAdmin || currentUser.role === 'security' || isOwner;
  const isFound = item.type === 'found';
  const hasPhoto = Boolean(item.photo_url && item.photo_url.trim().length > 0);

  const getCustodyDisplay = () => {
    if (item.current_custody === 'awaiting_handover' || item.security_desk_location === 'Admin Office') {
      return { label: 'Admin Office (Collect from there)', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    }
    if (item.current_custody === 'with_finder') {
      return {
        label: item.finder_phone ? `With Finder (Phone: ${item.finder_phone})` : "Currently in Finder's Custody",
        color: 'text-blue-800 bg-blue-50 border-blue-200',
      };
    }
    if (item.current_custody === 'approved_for_collection') {
      return { label: 'Approved for Collection', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
    }
    if (item.current_custody === 'returned_to_owner') {
      return { label: 'Returned to Verified Owner', color: 'text-slate-800 bg-slate-100 border-slate-300' };
    }
    return {
      label: item.current_custody.replace(/_/g, ' '),
      color: 'text-slate-700 bg-slate-50 border-slate-200',
    };
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'claimed':
        return { label: 'Claimed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'returned':
        return { label: 'Returned / Closed', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'closed':
        return { label: 'Closed', color: 'bg-slate-200 text-slate-800 border-slate-400' };
      default:
        return { label: 'Active Inquiry', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  const custodyInfo = getCustodyDisplay();
  const statusBadge = getStatusBadge(item.status);

  const handleAdminStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !onUpdateItemStatus) return;

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      await onUpdateItemStatus(item.id, selectedStatus, adminNotes);
      setUpdateSuccess(`Status successfully changed to "${selectedStatus.toUpperCase()}" by Admin.`);
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update item status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide ${
                item.type === 'found' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {item.type.toUpperCase()} ITEM
            </span>
            <span className="font-mono text-xs text-slate-300">
              {item.reference_code}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title & Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Reported by <span className="font-semibold text-slate-700">{item.user_name}</span> ({item.user_email})
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadge.color}`}>
                Status: {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Media & Key Specs: If user did NOT provide photo, do not display any image container */}
          <div className={`flex flex-col ${hasPhoto ? 'sm:flex-row' : ''} gap-4`}>
            {hasPhoto && (
              <div className="w-full sm:w-56 h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <img
                  src={item.photo_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-3 flex-1">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-slate-800">{item.category}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Dominant Color</span>
                  <span className="font-semibold text-slate-800">{item.color}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Brand / Model</span>
                  <span className="font-semibold text-slate-800">{item.brand_model || 'Not Specified'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(item.date_seen_or_found).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {item.location && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Campus Location</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                </div>
              )}

              {item.description && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                    {item.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Custody Chain Status */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-700" />
                Custody Status
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${custodyInfo.color}`}>
                {custodyInfo.label}
              </span>
            </div>

            {item.finder_phone && item.current_custody === 'with_finder' && (
              <div className="text-xs text-blue-900 bg-blue-50/70 p-2 rounded border border-blue-200 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Finder Contact Phone: <strong>{item.finder_phone}</strong></span>
              </div>
            )}
          </div>

          {/* Privacy & Hidden Verification Box */}
          <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-200 text-xs">
            {isPrivileged ? (
              <div className="space-y-1 text-amber-900">
                <div className="font-bold flex items-center gap-1.5 uppercase text-[10px]">
                  <Unlock className="w-3.5 h-3.5 text-amber-700" />
                  Protected Details Recorded:
                </div>
                <div className="text-slate-700 text-[11px]">
                  Identifying characteristics are securely stored to verify claims.
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-slate-600">
                <div className="font-bold flex items-center gap-1.5 text-slate-700 uppercase text-[10px]">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Hidden Verification Characteristics Protected
                </div>
                <p className="text-[11px] text-slate-500">
                  Distinctive internal identifying marks are securely stored. If you are the owner, cite these details when submitting a claim.
                </p>
              </div>
            )}
          </div>

          {/* ================= ADMIN-ONLY STATUS CONTROL PANEL ================= */}
          {isAdmin ? (
            <div className="bg-slate-900 text-white rounded-lg p-4 space-y-3 border-2 border-indigo-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-400">
                    Administrator Authority: Change Item Status
                  </span>
                </div>
                <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-mono">
                  Role: Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Only campus administrators have access to change an item's status to <strong>Claimed</strong>, <strong>Returned</strong>, or <strong>Active</strong>.
              </p>

              {updateSuccess && (
                <div className="p-2.5 bg-emerald-900/90 border border-emerald-500 text-emerald-200 rounded text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              {updateError && (
                <div className="p-2.5 bg-rose-900/90 border border-rose-500 text-rose-200 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{updateError}</span>
                </div>
              )}

              <form onSubmit={handleAdminStatusChange} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Set Status to:
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={e => setSelectedStatus(e.target.value as ItemStatus)}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-md p-2 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="active">Active (Unresolved Inquiry)</option>
                      <option value="claimed">Claimed (Ownership Verified by Admin)</option>
                      <option value="returned">Returned / Closed (Handed Over)</option>
                      <option value="closed">Closed / Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Admin Notes / Reason:
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      placeholder="e.g., Claim verified via student ID & bill proof"
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-md p-2 focus:ring-1 focus:ring-amber-400 focus:outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Current: <strong className="text-white capitalize">{item.status}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={isUpdating || selectedStatus === item.status}
                    className={`py-1.5 px-4 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedStatus === item.status
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                    }`}
                  >
                    {isUpdating ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        Updating Status...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Save Status Change
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-600">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-500">Item Status: </span>
                  <strong className="text-slate-800 uppercase font-bold">{item.status}</strong>
                  <div className="text-[11px] text-slate-400">
                    Only administrators can change status to Claimed or update record status.
                  </div>
                </div>
              </div>
              {onToggleAdmin && (
                <button
                  type="button"
                  onClick={onToggleAdmin}
                  className="px-3 py-1.5 bg-[#0D3B8E] hover:bg-[#0A2D6E] text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shrink-0 shadow-2xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Enable Admin Access
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-4 text-slate-600 hover:bg-slate-200 rounded-md font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>

          {/* Student/User Claim Submission (only registers a claim request for admin review) */}
          {isFound && item.status !== 'returned' && item.status !== 'claimed' && item.user_id !== currentUser.id && (
            <button
              onClick={() => {
                onClose();
                onOpenClaimModal(item);
              }}
              className="py-2 px-4 bg-[#0D3B8E] hover:bg-[#0A2E70] text-white font-bold rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              Submit Ownership Claim (Sends to Admin)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
