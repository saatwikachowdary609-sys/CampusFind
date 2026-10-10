import React, { useState } from 'react';
import { User } from '../types';
import {
  X,
  Lock,
  AlertCircle,
  Phone,
} from 'lucide-react';

interface ReportFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  currentUser: User;
}

const CATEGORIES = [
  'Electronics',
  'Wallets & IDs',
  'Keys & Keychains',
  'Audio & Gadgets',
  'Personal Belongings',
  'Books & Stationeries',
  'Clothing & Bags',
  'Sports Equipment',
  'Other',
];

const LOCATIONS = [
  'Siddhartha Central Library - 2nd Floor Reading Hall',
  'Siddhartha Central Library - Ground Floor Circulation Desk',
  'Ramanujan Computing Center - Lab 3',
  'Ramanujan Computing Center - Lab 1',
  'Dr. Pinnamaneni Auditorium - Main Foyer',
  'Aryabhata Block - Seminar Hall 2',
  'Aryabhata Block - Classroom A-204',
  'Administrative Tower - Dean Office Corridor',
  'Cafeteria Complex - Outer Courtyard',
  'Cafeteria Complex - Food Court Main Hall',
  'Central Security Post 1 (Main Gate)',
  'Security Post 2 (Bus Bay & North Gate)',
  'Indoor Sports Complex & Gym',
  'Department of CSE - 3rd Floor Labs',
  'Department of ECE - VLSI Lab',
];

export const ReportFoundModal: React.FC<ReportFoundModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brandModel, setBrandModel] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateFound, setDateFound] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [custodyOption, setCustodyOption] = useState<'admin_office' | 'with_finder'>('admin_office');
  const [finderPhone, setFinderPhone] = useState(currentUser.phone || '');
  const [hiddenCharacteristic, setHiddenCharacteristic] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !category) {
      setError('Please provide an item title and category.');
      return;
    }

    if (custodyOption === 'with_finder' && !finderPhone.trim()) {
      setError('Please provide your phone number so the verified owner or admin can contact you.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: 'found',
        title: title.trim(),
        category,
        brand_model: brandModel.trim(),
        color: color.trim() || 'Not specified',
        description: description.trim(),
        location: location.trim() || 'Unspecified / Campus Area',
        date_seen_or_found: dateFound.trim() || new Date().toISOString(),
        photo_url: photoUrl.trim() || '',
        custody_option: custodyOption,
        finder_phone: custodyOption === 'with_finder' ? finderPhone.trim() : '',
        hidden_characteristic: hiddenCharacteristic.trim(),
        verification_answer: hiddenCharacteristic.trim(),
        serial_number: serialNumber.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
              Siddhartha Academy of Higher Education
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Report a Found Belonging
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Item Title / Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Casio fx-991CW Scientific Calculator or Blue Fastrack Wallet"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Dominant Color(s) (Optional)
              </label>
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="e.g. Navy Blue / Silver"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Brand or Visible Marks (Optional)
              </label>
              <input
                type="text"
                value={brandModel}
                onChange={e => setBrandModel(e.target.value)}
                placeholder="e.g. Casio, Dell, Fastrack"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Date & Time Found (Optional)
              </label>
              <input
                type="datetime-local"
                value={dateFound}
                onChange={e => setDateFound(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Campus Location Where Found (Optional)
              </label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              >
                <option value="">Unspecified / General Campus Area</option>
                {LOCATIONS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Public Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="General description visible to students. (Keep distinctive secrets like passcodes or specific engraved initials in the private section below)."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              />
            </div>

            {/* Custody Option Radio */}
            <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Current Custody & Handover Status:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${
                  custodyOption === 'admin_office' ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="custody"
                    checked={custodyOption === 'admin_office'}
                    onChange={() => setCustodyOption('admin_office')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      handing in admin office collect from there
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      I will deposit this item at the college admin office; the owner can verify and collect it from there.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${
                  custodyOption === 'with_finder' ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="custody"
                    checked={custodyOption === 'with_finder'}
                    onChange={() => setCustodyOption('with_finder')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      currently in my custody
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      I am safely keeping the item with me until the owner claims it.
                    </div>
                  </div>
                </label>
              </div>

              {/* Dynamic Phone Number Field if user selects currently in my custody */}
              {custodyOption === 'with_finder' && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                  <div className="p-3 bg-white border border-blue-200 rounded-md shadow-2xs space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={finderPhone}
                      onChange={e => setFinderPhone(e.target.value)}
                      placeholder="e.g. +91 98480 12345"
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E] focus:bg-white"
                      required
                    />
                    <p className="text-[10px] text-slate-500">
                      The verified owner will use this phone number to contact you to collect their belonging.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Photograph Image URL (Optional - leave blank if no photo)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://... (Optional - leave empty if no photo)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
              />
            </div>
          </div>

          {/* Hidden Detail Verification Section */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Private Identifying Characteristics (Optional - Stored Securely)
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Describe hidden details (e.g. scratch, sticker, initials, or secret keychain) not disclosed in public description. Used to verify the rightful owner.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Hidden Detail for Verification:
                </label>
                <input
                  type="text"
                  value={hiddenCharacteristic}
                  onChange={e => setHiddenCharacteristic(e.target.value)}
                  placeholder="e.g. Contains blood group slip; initials 'SKC' engraved on back."
                  className="w-full p-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Serial Number (if visible):
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="e.g. LNV-4491-IN"
                  className="w-full p-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Report...' : 'Submit Found Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
