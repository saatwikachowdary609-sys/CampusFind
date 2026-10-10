import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'student' | 'security' | 'admin';
  department: string;
  student_or_staff_id: string;
  phone: string;
  created_at: string;
}

export interface Item {
  id: string;
  reference_code: string;
  type: 'lost' | 'found';
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
  status: 'active' | 'matched' | 'claimed' | 'returned' | 'closed';
  current_custody: 'with_finder' | 'awaiting_handover' | 'received_by_security' | 'stored_securely' | 'claim_pending' | 'approved_for_collection' | 'returned_to_owner';
  security_desk_location?: string;
  security_staff_name?: string;
  finder_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface PrivateItemDetail {
  id: string;
  item_id: string;
  hidden_characteristic: string; // e.g. "Unique engraved initials 'SKC' on back of case"
  verification_answer: string;
  serial_number?: string;
  created_at: string;
}

export interface MatchRecord {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  match_score: number; // 0 - 100
  match_reasons: string[];
  ai_model: string;
  status: 'suggested' | 'reviewed' | 'confirmed' | 'dismissed';
  created_at: string;
  updated_at: string;
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

export interface Notification {
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

export interface DatabaseState {
  users: User[];
  items: Item[];
  private_details: PrivateItemDetail[];
  matches: MatchRecord[];
  claims: Claim[];
  collection_records: CollectionRecord[];
  notifications: Notification[];
  audit_logs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'campusfind.json');

const INITIAL_DATA: DatabaseState = {
  users: [
    {
      id: 'usr_student_1',
      email: 'saatwikachowdary609@gmail.com',
      password_hash: 'sha256_mock_hash_student_saatwika',
      full_name: 'Saatwika Chowdary K.',
      role: 'admin',
      department: 'Computer Science & Engineering',
      student_or_staff_id: 'ADM-221FA04001',
      phone: '+91 98480 22334',
      created_at: '2026-09-01T08:30:00Z',
    },
    {
      id: 'usr_student_2',
      email: 'rahul.ece@siddhartha.ac.in',
      password_hash: 'sha256_mock_hash_student_rahul',
      full_name: 'Rahul Varma V.',
      role: 'student',
      department: 'Electronics & Communication',
      student_or_staff_id: '231FA05044',
      phone: '+91 98481 44556',
      created_at: '2026-09-05T09:15:00Z',
    },
    {
      id: 'usr_security_1',
      email: 'security.gate1@siddhartha.ac.in',
      password_hash: 'sha256_mock_hash_sec_prasad',
      full_name: 'R. Prasad (Havildar)',
      role: 'security',
      department: 'Campus Security & Vigilance Unit',
      student_or_staff_id: 'SEC-089',
      phone: '+91 866 2582333',
      created_at: '2026-08-15T08:00:00Z',
    },
    {
      id: 'usr_admin_1',
      email: 'admin.office@siddhartha.ac.in',
      password_hash: 'sha256_mock_hash_adm_drrao',
      full_name: 'Dr. V. Nageswara Rao',
      role: 'admin',
      department: 'Dean Student Affairs & Grievances',
      student_or_staff_id: 'ADM-FAC-012',
      phone: '+91 866 2582311',
      created_at: '2026-08-01T08:00:00Z',
    },
  ],
  items: [],
  private_details: [],
  matches: [],
  claims: [],
  collection_records: [],
  notifications: [],
  audit_logs: [],
};

class DatabaseService {
  private data: DatabaseState;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing defaults:', e);
    }
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  }

  private saveData(data: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public getRawData(): DatabaseState {
    return this.data;
  }

  public commit() {
    this.saveData(this.data);
  }

  // Users
  public getUsers() {
    return this.data.users;
  }

  public getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Omit<User, 'id' | 'created_at'>): User {
    const newUser: User = {
      ...user,
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.commit();
    return newUser;
  }

  public updateUserRole(id: string, role: 'admin' | 'student' | 'security'): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;
    user.role = role;
    this.commit();
    return user;
  }

  // Items
  public getItems(filters: {
    type?: 'lost' | 'found';
    query?: string;
    category?: string;
    location?: string;
    status?: string;
    custody?: string;
    userId?: string;
  } = {}) {
    let result = [...this.data.items];

    if (filters.type) {
      result = result.filter(i => i.type === filters.type);
    }
    if (filters.category && filters.category !== 'All') {
      result = result.filter(i => i.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters.location && filters.location !== 'All') {
      result = result.filter(i => i.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters.status && filters.status !== 'All') {
      result = result.filter(i => i.status === filters.status);
    }
    if (filters.custody && filters.custody !== 'All') {
      result = result.filter(i => i.current_custody === filters.custody);
    }
    if (filters.userId) {
      result = result.filter(i => i.user_id === filters.userId);
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.reference_code.toLowerCase().includes(q) ||
        i.brand_model.toLowerCase().includes(q) ||
        i.color.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getItemById(id: string) {
    return this.data.items.find(i => i.id === id || i.reference_code === id);
  }

  public createItem(
    itemData: Omit<Item, 'id' | 'reference_code' | 'created_at' | 'updated_at'>,
    privateDetail?: { hidden_characteristic: string; verification_answer: string; serial_number?: string }
  ): Item {
    const counter = this.data.items.length + 101;
    const refPrefix = itemData.type === 'lost' ? 'SAHE-LOST-2026' : 'SAHE-FOUND-2026';
    const reference_code = `${refPrefix}-${counter}`;
    const id = 'itm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newItem: Item = {
      ...itemData,
      id,
      reference_code,
      created_at: now,
      updated_at: now,
    };

    this.data.items.unshift(newItem);

    if (privateDetail) {
      this.data.private_details.push({
        id: 'pvt_' + Date.now().toString(36),
        item_id: id,
        hidden_characteristic: privateDetail.hidden_characteristic,
        verification_answer: privateDetail.verification_answer,
        serial_number: privateDetail.serial_number,
        created_at: now,
      });
    }

    this.addAuditLog({
      actor_id: itemData.user_id,
      actor_name: itemData.user_name,
      actor_role: 'student',
      action: itemData.type === 'lost' ? 'REPORT_LOST_ITEM' : 'REPORT_FOUND_ITEM',
      entity_type: 'item',
      entity_id: id,
      details: `Created report for ${newItem.title} [Ref: ${reference_code}]`,
    });

    this.commit();
    return newItem;
  }

  public updateItem(id: string, updates: Partial<Item>): Item | null {
    const item = this.getItemById(id);
    if (!item) return null;
    Object.assign(item, updates, { updated_at: new Date().toISOString() });
    this.commit();
    return item;
  }

  // Private Details
  public getPrivateDetailByItemId(itemId: string) {
    return this.data.private_details.find(p => p.item_id === itemId);
  }

  // Matches
  public getMatches(filter?: { itemId?: string; userId?: string }) {
    let result = [...this.data.matches];
    if (filter?.itemId) {
      result = result.filter(m => m.lost_item_id === filter.itemId || m.found_item_id === filter.itemId);
    }
    if (filter?.userId) {
      const userItemIds = new Set(this.data.items.filter(i => i.user_id === filter.userId).map(i => i.id));
      result = result.filter(m => userItemIds.has(m.lost_item_id) || userItemIds.has(m.found_item_id));
    }
    return result.sort((a, b) => b.match_score - a.match_score);
  }

  public createOrUpdateMatch(match: Omit<MatchRecord, 'id' | 'created_at' | 'updated_at'>): MatchRecord {
    const existing = this.data.matches.find(
      m => m.lost_item_id === match.lost_item_id && m.found_item_id === match.found_item_id
    );

    const now = new Date().toISOString();
    if (existing) {
      existing.match_score = match.match_score;
      existing.match_reasons = match.match_reasons;
      existing.ai_model = match.ai_model;
      existing.updated_at = now;
      this.commit();
      return existing;
    }

    const newMatch: MatchRecord = {
      ...match,
      id: 'mat_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: now,
      updated_at: now,
    };
    this.data.matches.unshift(newMatch);
    this.commit();
    return newMatch;
  }

  // Claims
  public getClaims(filters: { userId?: string; status?: string } = {}) {
    let result = [...this.data.claims];
    if (filters.userId) {
      result = result.filter(c => c.claimant_id === filters.userId);
    }
    if (filters.status && filters.status !== 'All') {
      result = result.filter(c => c.status === filters.status);
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getClaimById(id: string) {
    return this.data.claims.find(c => c.id === id);
  }

  public createClaim(claimData: Omit<Claim, 'id' | 'claim_reference' | 'created_at' | 'status'>): Claim {
    const counter = this.data.claims.length + 43;
    const claim_reference = `CLM-2026-00${counter}`;
    const id = 'clm_' + Date.now().toString(36);
    const now = new Date().toISOString();

    const newClaim: Claim = {
      ...claimData,
      id,
      claim_reference,
      status: 'pending',
      created_at: now,
    };

    this.data.claims.unshift(newClaim);

    // Update item custody to claim_pending
    const item = this.getItemById(claimData.item_id);
    if (item && item.current_custody === 'stored_securely') {
      item.current_custody = 'claim_pending';
      item.updated_at = now;
    }

    this.addNotification({
      user_id: claimData.claimant_id,
      type: 'claim_update',
      title: 'Claim Submission Received',
      message: `Your ownership claim for "${claimData.item_title}" (Ref: ${claim_reference}) has been submitted for administrative verification.`,
      reference_id: id,
    });

    this.addAuditLog({
      actor_id: claimData.claimant_id,
      actor_name: claimData.claimant_name,
      actor_role: 'student',
      action: 'CLAIM_SUBMISSION',
      entity_type: 'claim',
      entity_id: id,
      details: `Claimed item ${claimData.item_title} [Ref: ${claim_reference}]`,
    });

    this.commit();
    return newClaim;
  }

  public reviewClaim(
    claimId: string,
    reviewer: { id: string; name: string },
    decision: 'approved' | 'rejected',
    notes: string
  ): Claim | null {
    const claim = this.getClaimById(claimId);
    if (!claim) return null;

    const now = new Date().toISOString();
    claim.status = decision;
    claim.reviewer_id = reviewer.id;
    claim.reviewer_name = reviewer.name;
    claim.review_notes = notes;
    claim.reviewed_at = now;

    const item = this.getItemById(claim.item_id);
    if (item) {
      if (decision === 'approved') {
        item.status = 'claimed';
        item.current_custody = 'approved_for_collection';
      } else {
        item.current_custody = 'stored_securely';
      }
      item.updated_at = now;
    }

    this.addNotification({
      user_id: claim.claimant_id,
      type: 'claim_update',
      title: decision === 'approved' ? 'Claim APPROVED for Collection!' : 'Claim Decision: Rejected',
      message: decision === 'approved'
        ? `Your claim for "${claim.item_title}" was APPROVED. Please proceed to the Central Security Post with your College ID to collect your item.`
        : `Your claim for "${claim.item_title}" was rejected by admin. Reason: ${notes}`,
      reference_id: claim.id,
    });

    this.addAuditLog({
      actor_id: reviewer.id,
      actor_name: reviewer.name,
      actor_role: 'admin',
      action: decision === 'approved' ? 'CLAIM_APPROVED' : 'CLAIM_REJECTED',
      entity_type: 'claim',
      entity_id: claimId,
      details: `Admin decision: ${decision}. Notes: ${notes}`,
    });

    this.commit();
    return claim;
  }

  // Collection & Custody
  public getCollectionRecords() {
    return [...this.data.collection_records].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public recordSecurityIntake(data: {
    item_id: string;
    security_staff_id: string;
    security_staff_name: string;
    physical_storage_location: string;
    notes?: string;
  }): CollectionRecord {
    const now = new Date().toISOString();
    const item = this.getItemById(data.item_id);

    if (item) {
      item.current_custody = 'stored_securely';
      item.security_desk_location = data.physical_storage_location;
      item.security_staff_name = data.security_staff_name;
      item.updated_at = now;
    }

    const record: CollectionRecord = {
      id: 'col_' + Date.now().toString(36),
      item_id: data.item_id,
      security_staff_id: data.security_staff_id,
      security_staff_name: data.security_staff_name,
      physical_storage_location: data.physical_storage_location,
      custody_status: 'stored_securely',
      handover_notes: data.notes,
      created_at: now,
    };

    this.data.collection_records.unshift(record);

    this.addAuditLog({
      actor_id: data.security_staff_id,
      actor_name: data.security_staff_name,
      actor_role: 'security',
      action: 'SECURITY_INTAKE',
      entity_type: 'item',
      entity_id: data.item_id,
      details: `Stored securely in ${data.physical_storage_location}`,
    });

    this.commit();
    return record;
  }

  public recordSecurityHandover(data: {
    item_id: string;
    claim_id?: string;
    security_staff_id: string;
    security_staff_name: string;
    collector_name: string;
    collector_id_proof: string;
    notes?: string;
  }): CollectionRecord {
    const now = new Date().toISOString();
    const item = this.getItemById(data.item_id);

    if (item) {
      item.status = 'returned';
      item.current_custody = 'returned_to_owner';
      item.updated_at = now;
    }

    if (data.claim_id) {
      const claim = this.getClaimById(data.claim_id);
      if (claim) {
        claim.status = 'completed';
      }
    }

    const record: CollectionRecord = {
      id: 'col_' + Date.now().toString(36),
      item_id: data.item_id,
      claim_id: data.claim_id,
      security_staff_id: data.security_staff_id,
      security_staff_name: data.security_staff_name,
      physical_storage_location: item?.security_desk_location || 'Security Desk',
      custody_status: 'returned_to_owner',
      handover_date: now,
      collector_name: data.collector_name,
      collector_id_proof: data.collector_id_proof,
      handover_notes: data.notes,
      created_at: now,
    };

    this.data.collection_records.unshift(record);

    this.addAuditLog({
      actor_id: data.security_staff_id,
      actor_name: data.security_staff_name,
      actor_role: 'security',
      action: 'ITEM_HANDOVER_COMPLETED',
      entity_type: 'item',
      entity_id: data.item_id,
      details: `Returned to ${data.collector_name} (ID: ${data.collector_id_proof})`,
    });

    this.commit();
    return record;
  }

  // Notifications
  public getNotifications(userId: string) {
    return this.data.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addNotification(notification: Omit<Notification, 'id' | 'is_read' | 'email_sent' | 'delivery_status' | 'created_at'>): Notification {
    const newNotif: Notification = {
      ...notification,
      id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      is_read: false,
      email_sent: true,
      delivery_status: 'delivered',
      created_at: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    this.commit();
    return newNotif;
  }

  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.commit();
    }
  }

  // Audit Logs
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      ...log,
      id: 'aud_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(newLog);
    this.commit();
    return newLog;
  }

  public getAuditLogs() {
    return [...this.data.audit_logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Analytics
  public getAnalytics() {
    const totalLost = this.data.items.filter(i => i.type === 'lost').length;
    const totalFound = this.data.items.filter(i => i.type === 'found').length;
    const totalReturned = this.data.items.filter(i => i.status === 'returned').length;
    const totalClaims = this.data.claims.length;
    const approvedClaims = this.data.claims.filter(c => c.status === 'approved' || c.status === 'completed').length;
    const pendingClaims = this.data.claims.filter(c => c.status === 'pending').length;
    const activeMatches = this.data.matches.length;

    // Category breakdown
    const categoryCounts: Record<string, { lost: number; found: number; returned: number }> = {};
    for (const item of this.data.items) {
      if (!categoryCounts[item.category]) {
        categoryCounts[item.category] = { lost: 0, found: 0, returned: 0 };
      }
      if (item.type === 'lost') categoryCounts[item.category].lost++;
      if (item.type === 'found') categoryCounts[item.category].found++;
      if (item.status === 'returned') categoryCounts[item.category].returned++;
    }

    // Location frequency
    const locationCounts: Record<string, number> = {};
    for (const item of this.data.items) {
      locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
    }

    const recoveryRate = totalLost + totalFound > 0
      ? Math.round((totalReturned / Math.max(totalLost, totalFound)) * 100)
      : 0;

    return {
      summary: {
        totalReports: this.data.items.length,
        totalLost,
        totalFound,
        totalReturned,
        recoveryRatePercent: recoveryRate,
        averageRecoveryDays: 2.4,
        totalClaims,
        approvedClaims,
        pendingClaims,
        activeMatches,
      },
      categoryBreakdown: Object.entries(categoryCounts).map(([category, stats]) => ({
        category,
        ...stats,
      })),
      topLocations: Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([location, count]) => ({ location, count })),
      recentActivity: this.data.audit_logs.slice(0, 10),
    };
  }
}

export const db = new DatabaseService();
