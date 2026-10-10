export type UserRole = 'student' | 'security' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  student_or_staff_id: string;
  phone?: string;
}

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'active' | 'matched' | 'claimed' | 'returned' | 'closed';
export type CustodyStatus =
  | 'with_finder'
  | 'awaiting_handover'
  | 'received_by_security'
  | 'stored_securely'
  | 'claim_pending'
  | 'approved_for_collection'
  | 'returned_to_owner';

export interface Item {
  id: string;
  reference_code: string;
  type: ItemType;
  user_id: string;
  user_name: string;
  user_email: string;
  title: string;
  category: string;
  brand_model: string;
  color: string;
  description: string;
  location: string;
  date_seen_or_found: string;
  photo_url: string;
  status: ItemStatus;
  current_custody: CustodyStatus;
  security_desk_location?: string;
  security_staff_name?: string;
  finder_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface PrivateDetail {
  hidden_characteristic: string;
  serial_number?: string;
  verification_answer?: string;
}

export interface MatchRecord {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  match_score: number;
  match_reasons: string[];
  ai_model: string;
  status: 'suggested' | 'reviewed' | 'confirmed' | 'dismissed';
  created_at: string;
  updated_at: string;
  lost_item?: Item;
  found_item?: Item;
}

export interface Claim {
  id: string;
  claim_reference: string;
  item_id: string;
  item_title: string;
  claimant_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_roll_no: string;
  proof_description: string;
  proof_photo_url?: string;
  hidden_detail_attempt: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';
  reviewer_id?: string;
  reviewer_name?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface CollectionRecord {
  id: string;
  item_id: string;
  claim_id?: string;
  security_staff_id: string;
  security_staff_name: string;
  physical_storage_location: string;
  custody_status: string;
  handover_date?: string;
  collector_name?: string;
  collector_id_proof?: string;
  handover_notes?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'match_found' | 'claim_update' | 'custody_update' | 'system';
  title: string;
  message: string;
  reference_id: string;
  is_read: boolean;
  email_sent: boolean;
  delivery_status: 'delivered' | 'queued' | 'failed';
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  timestamp: string;
}

export interface AnalyticsData {
  summary: {
    totalReports: number;
    totalLost: number;
    totalFound: number;
    totalReturned: number;
    recoveryRatePercent: number;
    averageRecoveryDays: number;
    totalClaims: number;
    approvedClaims: number;
    pendingClaims: number;
    activeMatches: number;
  };
  categoryBreakdown: {
    category: string;
    lost: number;
    found: number;
    returned: number;
  }[];
  topLocations: {
    location: string;
    count: number;
  }[];
  recentActivity: AuditLog[];
}
