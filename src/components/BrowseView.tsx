import React, { useState } from 'react';
import { Item, User } from '../types';
import {
  Search,
  MapPin,
  Calendar,
  Shield,
  Eye,
  PlusCircle,
  FileQuestion,
  Phone,
  Package,
} from 'lucide-react';

interface BrowseViewProps {
  items: Item[];
  currentUser: User;
  onSelectItem: (item: Item) => void;
  onOpenReportLost: () => void;
  onOpenReportFound: () => void;
  onOpenClaimModal: (item: Item) => void;
}

const CATEGORIES = [
  'All',
  'Electronics',
  'Wallets & IDs',
  'Keys & Keychains',
  'Audio & Gadgets',
  'Personal Belongings',
  'Books & Stationeries',
  'Clothing & Bags',
];

const LOCATIONS = [
  'All',
  'Siddhartha Central Library',
  'Ramanujan Computing Center',
  'Dr. Pinnamaneni Auditorium',
  'Aryabhata Block',
  'Cafeteria Complex',
  'Administrative Tower',
  'Sports Complex',
];

export const BrowseView: React.FC<BrowseViewProps> = ({
  items,
  currentUser,
  onSelectItem,
  onOpenReportLost,
  onOpenReportFound,
  onOpenClaimModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (selectedLocation !== 'All' && !item.location.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.reference_code.toLowerCase().includes(q) ||
        item.brand_model.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getCustodyBadge = (item: Item) => {
    if (item.current_custody === 'awaiting_handover' || item.security_desk_location === 'Admin Office') {
      return { label: 'Admin Office (Collect from there)', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    }
    if (item.current_custody === 'with_finder') {
      return {
        label: item.finder_phone ? `With Finder (Contact: ${item.finder_phone})` : "Currently in Finder's Custody",
        color: 'text-blue-800 bg-blue-50 border-blue-200',
      };
    }
    if (item.current_custody === 'returned_to_owner') {
      return { label: 'Returned to Owner', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
    if (item.current_custody === 'claim_pending') {
      return { label: 'Claim Pending Review', color: 'text-purple-800 bg-purple-50 border-purple-200' };
    }
    return { label: 'Registered on Campus', color: 'text-slate-700 bg-slate-50 border-slate-200' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* College Hero Notice */}
      <div className="bg-gradient-to-r from-[#0A2558] to-[#103D8E] rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-blue-200 font-bold">
            Siddhartha Academy of Higher Education
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Campus Lost & Found Property Registry
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Report lost belongings, register found items, and track ownership claims across the Siddhartha Vijayawada campus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onOpenReportLost}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Report Lost Belonging
          </button>
          <button
            onClick={onOpenReportFound}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Report Found Item
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        {/* Top search & Type segment */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by item name, model, color, location, reference..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D3B8E] focus:bg-white transition"
            />
          </div>

          {/* Type Segment Control */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                selectedType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setSelectedType('lost')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                selectedType === 'lost' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost Only ({items.filter(i => i.type === 'lost').length})
            </button>
            <button
              onClick={() => setSelectedType('found')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                selectedType === 'found' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found Only ({items.filter(i => i.type === 'found').length})
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Campus Location
            </label>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
            >
              {LOCATIONS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D3B8E]"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Inquiries</option>
              <option value="claimed">Claimed</option>
              <option value="returned">Returned / Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <span className="font-bold text-slate-800">{filteredItems.length}</span> verified reports
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No items found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {items.length === 0
              ? 'No lost or found items reported yet. Be the first to register a belonging using the buttons above!'
              : 'No reports matched your active search filters. Try adjusting your search query or category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const custodyInfo = getCustodyBadge(item);
            const isFound = item.type === 'found';
            const hasPhoto = Boolean(item.photo_url && item.photo_url.trim().length > 0);

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Item Image (Render ONLY if user provided a photo, otherwise do NOT display anything) */}
                  {hasPhoto && (
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={item.photo_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                      />

                      {/* Type Banner */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded shadow-xs ${
                            isFound
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {item.type.toUpperCase()} ITEM
                        </span>
                      </div>

                      {/* Reference Code */}
                      <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                        {item.reference_code}
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    {/* Header if NO photo was provided */}
                    {!hasPhoto && (
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span
                          className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                            isFound
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.type.toUpperCase()} ITEM
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {item.reference_code}
                        </span>
                      </div>
                    )}

                    {/* Metadata line */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-700">{item.category}</span>
                      <span>·</span>
                      <span>{item.color}</span>
                      {item.brand_model && (
                        <>
                          <span>·</span>
                          <span className="text-slate-600">{item.brand_model}</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Location & Date */}
                    <div className="space-y-1 text-xs text-slate-500 pt-1">
                      {item.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                      {item.date_seen_or_found && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(item.date_seen_or_found).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Custody status */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className={`text-[11px] font-semibold px-2 py-1 rounded border ${custodyInfo.color} flex items-center gap-1.5`}>
                        <Shield className="w-3 h-3 shrink-0" />
                        <span className="truncate">{custodyInfo.label}</span>
                      </div>
                      {item.finder_phone && item.current_custody === 'with_finder' && (
                        <div className="text-[11px] text-blue-900 flex items-center gap-1 pl-1 pt-0.5 font-medium">
                          <Phone className="w-3 h-3 text-blue-700 shrink-0" />
                          <span>Contact: {item.finder_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 pb-4 pt-1 flex items-center gap-2">
                  <button
                    onClick={() => onSelectItem(item)}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>

                  {/* If item is found and active (not already claimed or returned), permit student claim submission */}
                  {isFound && item.status === 'active' && item.user_id !== currentUser.id && (
                    <button
                      onClick={() => onOpenClaimModal(item)}
                      className="py-1.5 px-3 bg-[#0D3B8E] hover:bg-[#0A2E70] text-white text-xs font-semibold rounded-md transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileQuestion className="w-3.5 h-3.5" />
                      Claim Item
                    </button>
                  )}
                  {item.status === 'claimed' && (
                    <span className="py-1.5 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold rounded-md flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      Claimed (Verified)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
