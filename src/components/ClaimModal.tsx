import React, { useState } from 'react';
import { Item, User } from '../types';
import {
  X,
  FileQuestion,
  Lock,
  Upload,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  currentUser: User;
  onSubmit: (data: any) => Promise<void>;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  item,
  currentUser,
  onSubmit,
}) => {
  if (!isOpen || !item) return null;

  const [proofDescription, setProofDescription] = useState('');
  const [proofPhotoUrl, setProofPhotoUrl] = useState('');
  const [hiddenDetailAttempt, setHiddenDetailAttempt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofDescription.trim()) {
      setError('Please provide a description of your ownership proof.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        item_id: item.id,
        proof_description: proofDescription,
        proof_photo_url: proofPhotoUrl,
        hidden_detail_attempt: hiddenDetailAttempt,
      });
      alert('Claim submitted successfully. Administrative reviewers will examine your verification details.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">
              Ownership Verification Protocol · Admin Review Required
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Submit Claim for {item.title}
            </h2>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
              Ref: {item.reference_code} · Reviewed & approved exclusively by Administration
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="font-bold text-slate-800 text-[11px]">Item Details:</div>
            <div className="text-slate-600">
              Found at: <strong>{item.location}</strong> on{' '}
              {new Date(item.date_seen_or_found).toLocaleDateString()}
            </div>
            <div className="text-slate-600">
              Category: {item.category} · Color: {item.color}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Proof Description & Circumstance *
            </label>
            <textarea
              rows={3}
              value={proofDescription}
              onChange={e => setProofDescription(e.target.value)}
              placeholder="e.g. This is my calculator purchased at the campus cooperative store last semester. I have my purchase bill and know the exact scratches."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              required
            />
          </div>

          {/* Hidden Detail Verification Answer */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Private Identifying Characteristic Verification
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              If the item has a hidden mark, sticker, inscription, secret wallpaper, or unique serial number that wasn't shown in the public photos, describe it here. Administrators compare this against the secure record to confirm true ownership.
            </p>
            <input
              type="text"
              value={hiddenDetailAttempt}
              onChange={e => setHiddenDetailAttempt(e.target.value)}
              placeholder="e.g. Star sticker on cover; 'SKC' scratched inside battery compartment"
              className="w-full p-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Proof Document / Bill / Photo URL (Optional)
            </label>
            <input
              type="url"
              value={proofPhotoUrl}
              onChange={e => setProofPhotoUrl(e.target.value)}
              placeholder="https://... (Receipt or purchase invoice link)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
            />
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Claimant: <strong>{currentUser.full_name}</strong> (Roll No: {currentUser.student_or_staff_id})
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#0D3B8E] hover:bg-[#0A2E70] text-white font-bold rounded-md transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Claim...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
