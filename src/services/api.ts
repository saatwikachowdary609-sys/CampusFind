import { Item, Claim, MatchRecord, CollectionRecord, NotificationItem, AuditLog, AnalyticsData, User, ItemStatus } from '../types';

export const api = {
  // Auth
  async getCurrentUser(userId?: string): Promise<{ user: User }> {
    const url = userId ? `/api/auth/me?userId=${userId}` : '/api/auth/me';
    const res = await fetch(url);
    return res.json();
  },

  async getUsers(): Promise<{ users: User[] }> {
    const res = await fetch('/api/auth/users');
    return res.json();
  },

  async login(email: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(data: Partial<User>): Promise<{ user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async toggleAdmin(userId?: string): Promise<{ user: User; message: string }> {
    const res = await fetch('/api/auth/toggle-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
      },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to toggle admin role');
    }
    return res.json();
  },

  async setUserRole(
    role: 'admin' | 'student' | 'security',
    userId?: string
  ): Promise<{ user: User; message: string }> {
    const res = await fetch('/api/auth/set-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
      },
      body: JSON.stringify({ role, userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update role');
    }
    return res.json();
  },

  // Items
  async getItems(filters: {
    type?: 'lost' | 'found';
    query?: string;
    category?: string;
    location?: string;
    status?: string;
    custody?: string;
    userId?: string;
  } = {}): Promise<{ items: Item[] }> {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.query) params.set('query', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.status) params.set('status', filters.status);
    if (filters.custody) params.set('custody', filters.custody);
    if (filters.userId) params.set('userId', filters.userId);

    const res = await fetch(`/api/items?${params.toString()}`);
    return res.json();
  },

  async getItem(id: string, currentUserId?: string): Promise<{ item: Item; privateDetail?: any }> {
    const headers: Record<string, string> = {};
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch(`/api/items/${id}`, { headers });
    return res.json();
  },

  async createItem(itemData: any, currentUserId?: string): Promise<{ item: Item; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch('/api/items', {
      method: 'POST',
      headers,
      body: JSON.stringify(itemData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit report');
    }
    return res.json();
  },

  async updateItemStatus(
    itemId: string,
    data: { status: ItemStatus; custody_status?: string; notes?: string },
    currentUserId?: string
  ): Promise<{ item: Item; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch(`/api/items/${itemId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update item status');
    }
    return res.json();
  },

  // Matches
  async getMatches(params: { itemId?: string; userId?: string } = {}): Promise<{ matches: MatchRecord[] }> {
    const urlParams = new URLSearchParams();
    if (params.itemId) urlParams.set('itemId', params.itemId);
    if (params.userId) urlParams.set('userId', params.userId);

    const res = await fetch(`/api/matches?${urlParams.toString()}`);
    return res.json();
  },

  async triggerAIMatchScan(itemId: string): Promise<{ message: string; matches: MatchRecord[] }> {
    const res = await fetch(`/api/ai/match-item/${itemId}`, { method: 'POST' });
    return res.json();
  },

  // Claims
  async getClaims(filters: { status?: string; all?: boolean } = {}, currentUserId?: string): Promise<{ claims: Claim[] }> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.all) params.set('all', 'true');

    const headers: Record<string, string> = {};
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch(`/api/claims?${params.toString()}`, { headers });
    return res.json();
  },

  async createClaim(data: any, currentUserId?: string): Promise<{ claim: Claim; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch('/api/claims', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit claim');
    }
    return res.json();
  },

  async reviewClaim(claimId: string, decision: 'approved' | 'rejected', notes: string, currentUserId?: string): Promise<{ claim: Claim; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch(`/api/claims/${claimId}/review`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ decision, notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Review failed');
    }
    return res.json();
  },

  async inspectSecretDetail(claimId: string, currentUserId?: string): Promise<{ claim_id: string; claimant_attempt: string; actual_secret: any }> {
    const headers: Record<string, string> = {};
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch(`/api/claims/${claimId}/inspect-secret`, { headers });
    return res.json();
  },

  // Security Desk
  async getSecurityRecords(): Promise<{ records: CollectionRecord[] }> {
    const res = await fetch('/api/security/records');
    return res.json();
  },

  async recordSecurityIntake(data: any, currentUserId?: string): Promise<{ record: CollectionRecord }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch('/api/security/intake', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async recordSecurityHandover(data: any, currentUserId?: string): Promise<{ record: CollectionRecord }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch('/api/security/handover', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Notifications
  async getNotifications(currentUserId?: string): Promise<{ notifications: NotificationItem[] }> {
    const headers: Record<string, string> = {};
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch('/api/notifications', { headers });
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  // Analytics & Audit
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/analytics');
    return res.json();
  },

  async getAuditLogs(currentUserId?: string): Promise<{ logs: AuditLog[] }> {
    const headers: Record<string, string> = {};
    if (currentUserId) headers['x-user-id'] = currentUserId;

    const res = await fetch('/api/audit-logs', { headers });
    return res.json();
  },

  async getCloudConfigs(): Promise<any> {
    const res = await fetch('/api/cloud-configs');
    return res.json();
  },
};
