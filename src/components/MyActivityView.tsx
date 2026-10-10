import React, { useState } from 'react';
import { Item, Claim, User, ItemStatus } from '../types';
import {
  FileText,
  FileQuestion,
  Eye,
  PlusCircle,
  Phone,
  Shield,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Check,
  AlertCircle,
} from 'lucide-react';

interface MyActivityViewProps {
  currentUser: User;
  items: Item[];
  claims: Claim[];
  matches?: any[];
  onSelectItem: (item: Item) => void;
  onOpenReportLost: () => void;
  onOpenReportFound: () => void;
  onOpenClaimModal: (item: Item) => void;
  onReviewClaim?: (claimId: string, decision: 'approved' | 'rejected', notes: string) => Promise<void>;
  onUpdateItemStatus?: (itemId: string, status: ItemStatus, notes?: string) => Promise<void>;
  onToggleAdmin?: () => void;
}

export const MyActivityView: React.FC<MyActivityViewProps> = ({
  currentUser,
  items,
  claims,
  onSelectItem,
  onOpenReportLost,
  onOpenReportFound,
  onReviewClaim,
  onUpdateItemStatus,
  onToggleAdmin,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [subTab, setSubTab] = useState<'reports' | 'claims' | 'admin_claims'>(
    isAdmin ? 'admin_claims' : 'reports'
  );
  const [reviewingClaimId, setReviewingClaimId] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filter items submitted by this user
  const myItems = items.filter(i => i.user_id === currentUser.id);

  // Filter claims made by this user
  const myClaims = claims.filter(c => c.claimant_id === currentUser.id);

  // All claims for admin review
  const allClaims = claims;
  const pendingClaims = claims.filter(c => c.status === 'pending' || c.status === 'under_review');

  const getClaimStatusBadge = (status: Claim['status']) => {
    switch (status) {
      case 'approved':
        return { label: 'APPROVED - Item Status Marked Claimed', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'under_review':
        return { label: 'Under Review by Admin', color: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'completed':
        return { label: 'Handover Completed', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'rejected':
        return { label: 'Rejected by Admin', color: 'bg-rose-50 text-rose-800 border-rose-300' };
      default:
        return { label: 'Pending Administrative Verification', color: 'bg-amber-50 text-amber-800 border-amber-300' };
    }
  };

  const handleAdminDecisionSubmit = async (claim: Claim) => {
    if (!onReviewClaim) return;
    setIsSubmittingReview(true);
    setActionMessage(null);
    try {
      const defaultNote =
        reviewDecision === 'approved'
          ? 'Claim verified by Administrator. Status of item officially set to CLAIMED.'
          : 'Insufficient proof or mismatched details.';
      await onReviewClaim(claim.id, reviewDecision, reviewNotes || defaultNote);
      setActionMessage(
        `Claim ${claim.claim_reference} successfully ${reviewDecision.toUpperCase()}. ${
          reviewDecision === 'approved' ? 'Item status has been changed to CLAIMED.' : ''
        }`
      );
      setReviewingClaimId(null);
      setReviewNotes('');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to review claim');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* User Header Profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0D3B8E] text-white flex items-center justify-center font-bold text-lg">
            {currentUser.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentUser.full_name}</h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isAdmin
                    ? 'text-amber-800 bg-amber-50 border-amber-300'
                    : 'text-blue-800 bg-blue-50 border-blue-200'
                }`}
              >
                {isAdmin ? 'ADMINISTRATOR (Exclusive Claim Approval Access)' : currentUser.role}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Roll/Staff ID: <span className="font-semibold text-slate-700">{currentUser.student_or_staff_id}</span> · {currentUser.department} · {currentUser.email}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onToggleAdmin && (
            <button
              onClick={onToggleAdmin}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                isAdmin
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-600' : 'text-indigo-600'}`} />
              <span>{isAdmin ? 'Admin Mode: Enabled' : 'Enable Admin Access'}</span>
            </button>
          )}

          <button
            onClick={onOpenReportLost}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-rose-600" />
            File Lost Report
          </button>
          <button
            onClick={onOpenReportFound}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            File Found Report
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{actionMessage}</span>
        </div>
      )}

      {/* Sub Tabs: Reports & Claims */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-1 items-center">
        {isAdmin ? (
          <button
            onClick={() => setSubTab('admin_claims')}
            className={`pb-3 px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              subTab === 'admin_claims'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" />
            Admin Claim Adjudication ({pendingClaims.length} Pending)
          </button>
        ) : (
          onToggleAdmin && (
            <button
              onClick={onToggleAdmin}
              className="pb-3 px-3 border-b-2 border-transparent text-slate-400 hover:text-amber-800 transition cursor-pointer flex items-center gap-1.5"
              title="Click to enable admin rights and access claim adjudication"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Unlock Admin Claim Adjudication</span>
            </button>
          )
        )}

        <button
          onClick={() => setSubTab('reports')}
          className={`pb-3 px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            subTab === 'reports'
              ? 'border-[#0D3B8E] text-[#0D3B8E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Submitted Reports ({myItems.length})
        </button>

        <button
          onClick={() => setSubTab('claims')}
          className={`pb-3 px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            subTab === 'claims'
              ? 'border-[#0D3B8E] text-[#0D3B8E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileQuestion className="w-4 h-4 text-indigo-600" />
          My Ownership Claims ({myClaims.length})
        </button>
      </div>

      {/* TAB 0: ADMIN CLAIM ADJUDICATION (Exclusively for Admins to change status to claimed) */}
      {isAdmin && subTab === 'admin_claims' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-950">Administrative Access Control Enforced:</strong>
              As an administrator, you have sole authority to adjudicate student ownership claims. Approving a claim instantly changes the item's official status to <strong>CLAIMED</strong> and initiates handover verification.
            </div>
          </div>

          {allClaims.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No ownership claims submitted yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When students file ownership claims on found items, they will appear here for administrative verification and status change.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allClaims.map(c => {
                const badge = getClaimStatusBadge(c.status);
                const relatedItem = items.find(i => i.id === c.item_id);
                const isUnderReview = reviewingClaimId === c.id;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            Claim ID: <span className="font-mono text-slate-600">{c.claim_reference || c.id}</span>
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          Item: {relatedItem ? relatedItem.title : c.item_title} ({relatedItem?.reference_code})
                        </h4>
                      </div>

                      <div className="text-right text-xs">
                        <div className="text-slate-800 font-bold">
                          Claimant: {c.claimant_name} ({c.claimant_roll_no})
                        </div>
                        <div className="text-slate-400 text-[11px]">{c.claimant_email}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <strong className="text-slate-700 block text-[11px] uppercase font-bold">Provided Proof Description:</strong>
                          <p className="text-slate-800 mt-0.5 leading-relaxed">{c.proof_description}</p>
                        </div>
                        {c.hidden_detail_attempt && (
                          <div className="pt-1.5 border-t border-slate-200">
                            <strong className="text-amber-900 block text-[11px] uppercase font-bold">Secret Verification Answer Cited:</strong>
                            <span className="text-amber-800 font-mono mt-0.5 block">{c.hidden_detail_attempt}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700 text-[11px] uppercase font-bold">Item Current Status:</span>
                          <span className="font-bold uppercase text-[11px] px-2 py-0.5 bg-slate-200 rounded">
                            {relatedItem?.status || 'unknown'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700 text-[11px] uppercase font-bold">Item Custody:</span>
                          <span className="text-slate-800 font-semibold text-xs">
                            {relatedItem?.current_custody?.replace(/_/g, ' ') || 'unknown'}
                          </span>
                        </div>
                        {relatedItem && (
                          <button
                            onClick={() => onSelectItem(relatedItem)}
                            className="mt-2 text-xs text-[#0D3B8E] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Full Item Registry Record & Photo
                          </button>
                        )}
                      </div>
                    </div>

                    {c.review_notes && (
                      <div className="text-xs text-slate-800 bg-blue-50/60 p-2.5 rounded border border-blue-200">
                        <strong>Previous Administrative Notes:</strong> {c.review_notes}
                        {c.reviewer_name && <span className="text-slate-500 ml-1">({c.reviewer_name})</span>}
                      </div>
                    )}

                    {/* Admin Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        {c.status === 'approved' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Item status officially marked as CLAIMED
                          </span>
                        ) : c.status === 'rejected' ? (
                          <span className="text-rose-700 font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Claim rejected
                          </span>
                        ) : (
                          <span>Awaiting administrative adjudication to change status to claimed</span>
                        )}
                      </div>

                      {c.status !== 'approved' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {!isUnderReview ? (
                            <button
                              onClick={() => {
                                setReviewingClaimId(c.id);
                                setReviewDecision('approved');
                                setReviewNotes('Ownership verified by campus administration. Status set to CLAIMED.');
                              }}
                              className="px-3.5 py-1.5 bg-[#0D3B8E] hover:bg-[#0A2E70] text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Adjudicate Claim (Set Item to Claimed)
                            </button>
                          ) : (
                            <div className="w-full sm:w-auto bg-slate-900 text-white p-3 rounded-lg space-y-2 border border-slate-700">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span>Administrative Adjudication</span>
                                <button
                                  onClick={() => setReviewingClaimId(null)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1 text-xs cursor-pointer text-emerald-300 font-bold">
                                  <input
                                    type="radio"
                                    name={`decision-${c.id}`}
                                    value="approved"
                                    checked={reviewDecision === 'approved'}
                                    onChange={() => setReviewDecision('approved')}
                                  />
                                  Approve & Set Item Status to Claimed
                                </label>
                                <label className="flex items-center gap-1 text-xs cursor-pointer text-rose-300 font-bold">
                                  <input
                                    type="radio"
                                    name={`decision-${c.id}`}
                                    value="rejected"
                                    checked={reviewDecision === 'rejected'}
                                    onChange={() => setReviewDecision('rejected')}
                                  />
                                  Reject Claim
                                </label>
                              </div>
                              <input
                                type="text"
                                value={reviewNotes}
                                onChange={e => setReviewNotes(e.target.value)}
                                placeholder="Administrative review notes..."
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                              />
                              <button
                                onClick={() => handleAdminDecisionSubmit(c)}
                                disabled={isSubmittingReview}
                                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded transition cursor-pointer"
                              >
                                {isSubmittingReview ? 'Processing...' : 'Confirm Decision & Update Item Status'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: My Reports */}
      {subTab === 'reports' && (
        <div className="space-y-4">
          {myItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">You haven't submitted any reports yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Lost an item on campus or picked up someone's belonging? File a report to register it in the campus system.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myItems.map(item => {
                const hasPhoto = Boolean(item.photo_url && item.photo_url.trim().length > 0);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      {hasPhoto && (
                        <div className="h-36 rounded-lg overflow-hidden bg-slate-100 mb-2">
                          <img
                            src={item.photo_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            item.type === 'lost' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.type.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              item.status === 'claimed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">{item.reference_code}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                      )}

                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                        {item.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>Location: <span className="text-slate-700 font-medium">{item.location}</span></span>
                          </div>
                        )}
                        {item.date_seen_or_found && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Date: {new Date(item.date_seen_or_found).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-slate-400" />
                          <span>Custody: <span className="font-semibold text-slate-800">{item.current_custody.replace(/_/g, ' ')}</span></span>
                        </div>
                        {item.finder_phone && item.current_custody === 'with_finder' && (
                          <div className="flex items-center gap-1 text-blue-800">
                            <Phone className="w-3 h-3 text-blue-600" />
                            <span>Contact: {item.finder_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectItem(item)}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details & Status
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Ownership Claims */}
      {subTab === 'claims' && (
        <div className="space-y-4">
          {myClaims.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No ownership claims submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Found a report of your lost belonging on campus? Use the "Claim Item" button on the item card to assert your ownership. Claims are submitted to campus administration for verification.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClaims.map(c => {
                const badge = getClaimStatusBadge(c.status);
                const relatedItem = items.find(i => i.id === c.item_id);
                const hasItemPhoto = Boolean(relatedItem?.photo_url && relatedItem.photo_url.trim().length > 0);

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            Claim ID: <span className="font-mono text-slate-600">{c.id}</span>
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {relatedItem ? relatedItem.title : 'Item Ref: ' + c.item_id}
                        </h4>
                      </div>

                      <span className="text-[11px] text-slate-400">
                        Submitted: {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      {hasItemPhoto && (
                        <img
                          src={relatedItem!.photo_url}
                          alt="Claimed Item"
                          className="w-24 h-24 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="space-y-2 text-xs text-slate-600 flex-1">
                        <div>
                          <strong className="text-slate-800">Your Submitted Proof:</strong> {c.proof_description}
                        </div>
                        {c.hidden_detail_attempt && (
                          <div className="text-amber-900 bg-amber-50/60 p-2 rounded border border-amber-200">
                            <strong>Your Private Detail Answer:</strong> {c.hidden_detail_attempt}
                          </div>
                        )}
                        {c.review_notes && (
                          <div className="text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                            <strong>Administrative Decision Notes:</strong> {c.review_notes}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 pt-1">
                          Note: Only campus administration has authorization to verify proof and mark this item as claimed.
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
