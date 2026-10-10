import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, Item } from './server/db.js';
import { matchItemsWithAI } from './server/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to authenticate user from header or query
function getCurrentUser(req: Request) {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (userId) {
    const user = db.getUserById(userId);
    if (user) return user;
  }
  // Default to Saatwika (student) if no header provided
  return db.getUsers()[0];
}

// ==================== AUTH ROUTES ====================
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      student_or_staff_id: user.student_or_staff_id,
      phone: user.phone,
    },
  });
});

app.get('/api/auth/users', (_req: Request, res: Response) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    department: u.department,
    student_or_staff_id: u.student_or_staff_id,
  }));
  res.json({ users });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'No account found with this Siddhartha college email' });
  }

  // Simplified password check for demo/dev authentication
  res.json({
    message: 'Authentication successful',
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      student_or_staff_id: user.student_or_staff_id,
      phone: user.phone,
    },
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, full_name, role, department, student_or_staff_id, phone } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = db.createUser({
    email,
    password_hash: 'sha256_' + (password || 'default'),
    full_name,
    role: role || 'student',
    department: department || 'General Engineering',
    student_or_staff_id: student_or_staff_id || 'SAHE-' + Math.floor(1000 + Math.random() * 9000),
    phone: phone || '',
  });

  res.status(201).json({
    message: 'Account created successfully',
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      student_or_staff_id: user.student_or_staff_id,
    },
  });
});

app.post('/api/auth/set-role', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const { role, userId } = req.body;
  const targetUserId = userId || currentUser.id;
  const targetRole = role === 'admin' ? 'admin' : (role === 'security' ? 'security' : 'student');
  const updatedUser = db.updateUserRole(targetUserId, targetRole);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    message: `Role updated to ${targetRole} successfully`,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      role: updatedUser.role,
      department: updatedUser.department,
      student_or_staff_id: updatedUser.student_or_staff_id,
      phone: updatedUser.phone,
    },
  });
});

app.post('/api/auth/toggle-admin', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const targetUserId = req.body.userId || currentUser.id;
  const user = db.getUserById(targetUserId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const newRole = user.role === 'admin' ? 'student' : 'admin';
  const updated = db.updateUserRole(targetUserId, newRole);
  res.json({
    message: `Admin access ${newRole === 'admin' ? 'granted' : 'revoked'}`,
    user: {
      id: updated!.id,
      email: updated!.email,
      full_name: updated!.full_name,
      role: updated!.role,
      department: updated!.department,
      student_or_staff_id: updated!.student_or_staff_id,
      phone: updated!.phone,
    },
  });
});

// ==================== ITEMS & REPORTS ====================
app.get('/api/items', (req: Request, res: Response) => {
  const { type, query, category, location, status, custody, userId } = req.query;
  const items = db.getItems({
    type: type as any,
    query: query as string,
    category: category as string,
    location: location as string,
    status: status as string,
    custody: custody as string,
    userId: userId as string,
  });

  // Never return private verification details in public list
  res.json({ items });
});

app.get('/api/items/:id', (req: Request, res: Response) => {
  const item = db.getItemById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item report not found' });
  }

  const currentUser = getCurrentUser(req);
  const isAuthorized =
    currentUser.role === 'admin' ||
    currentUser.role === 'security' ||
    currentUser.id === item.user_id;

  let privateDetail = null;
  if (isAuthorized) {
    privateDetail = db.getPrivateDetailByItemId(item.id);
  }

  res.json({
    item,
    privateDetail: privateDetail
      ? {
          hidden_characteristic: privateDetail.hidden_characteristic,
          serial_number: privateDetail.serial_number,
          verification_answer: currentUser.role === 'admin' ? privateDetail.verification_answer : undefined,
        }
      : null,
  });
});

app.post('/api/items', async (req: Request, res: Response) => {
  try {
    const {
      type,
      title,
      category,
      brand_model,
      color,
      description,
      location,
      date_seen_or_found,
      photo_url,
      hidden_characteristic,
      verification_answer,
      serial_number,
      custody_option,
      finder_phone,
    } = req.body;

    if (!type || !title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const currentUser = getCurrentUser(req);
    const initialCustody =
      type === 'found'
        ? (custody_option === 'admin_office' || custody_option === 'handover_now')
          ? 'awaiting_handover'
          : 'with_finder'
        : 'with_finder';

    const newItem = db.createItem(
      {
        type,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email,
        title,
        category,
        brand_model: brand_model || '',
        color: color || '',
        description: description || '',
        location: location || 'Campus Grounds / Unspecified',
        date_seen_or_found: date_seen_or_found || new Date().toISOString(),
        photo_url: photo_url || '',
        status: 'active',
        current_custody: initialCustody,
        finder_phone: finder_phone || '',
        security_desk_location: (custody_option === 'admin_office' || custody_option === 'handover_now') ? 'Admin Office' : undefined,
      },
      hidden_characteristic
        ? {
            hidden_characteristic,
            verification_answer: verification_answer || hidden_characteristic,
            serial_number,
          }
        : undefined
    );

    // Asynchronously trigger AI matching worker
    runMatchingWorker(newItem).catch(err =>
      console.error('Background matching worker error:', err)
    );

    res.status(201).json({
      message: `${type === 'lost' ? 'Lost' : 'Found'} report submitted successfully`,
      item: newItem,
    });
  } catch (err: any) {
    console.error('Error creating item:', err);
    res.status(500).json({ error: 'Failed to save item report', details: err?.message });
  }
});

app.patch('/api/items/:id/status', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Only administrators have access to change item status to claimed or update item status.' });
  }

  const { status, custody_status, notes } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const allowedStatuses = ['active', 'claimed', 'returned', 'closed'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` });
  }

  const item = db.getItemById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const updates: Partial<Item> = {
    status,
  };
  if (custody_status) {
    updates.current_custody = custody_status as any;
  } else if (status === 'claimed') {
    updates.current_custody = 'approved_for_collection';
  } else if (status === 'returned') {
    updates.current_custody = 'returned_to_owner';
  }

  const updatedItem = db.updateItem(req.params.id, updates);

  // Notify item submitter and log audit trail
  db.addNotification({
    user_id: item.user_id,
    type: 'claim_update',
    title: `Item Status Updated to "${status.toUpperCase()}"`,
    message: `Administrator ${currentUser.full_name} updated status of "${item.title}" to ${status}.${notes ? ` Note: ${notes}` : ''}`,
    reference_id: item.id,
  });

  db.addAuditLog({
    actor_id: currentUser.id,
    actor_name: currentUser.full_name,
    actor_role: 'admin',
    action: `ITEM_STATUS_CHANGED_TO_${status.toUpperCase()}`,
    entity_type: 'item',
    entity_id: item.id,
    details: `Admin changed status to ${status}. Custody: ${updates.current_custody || item.current_custody}. Notes: ${notes || 'None'}`,
  });

  res.json({
    message: `Item status updated to ${status} by administrator`,
    item: updatedItem,
  });
});

// Background matching worker (simulating Cloud Pub/Sub subscriber)
async function runMatchingWorker(newItem: Item) {
  const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
  const candidates = db.getItems({ type: oppositeType }).filter(c => c.status === 'active');

  for (const candidate of candidates) {
    const lostItem = newItem.type === 'lost' ? newItem : candidate;
    const foundItem = newItem.type === 'found' ? newItem : candidate;

    const matchResult = await matchItemsWithAI(lostItem, foundItem);

    if (matchResult.match_score >= 45) {
      const match = db.createOrUpdateMatch({
        lost_item_id: lostItem.id,
        found_item_id: foundItem.id,
        match_score: matchResult.match_score,
        match_reasons: matchResult.match_reasons,
        ai_model: matchResult.ai_model,
        status: 'suggested',
      });

      // Send notification to the owner of the lost item
      db.addNotification({
        user_id: lostItem.user_id,
        type: 'match_found',
        title: `AI Match Alert: ${matchResult.match_score}% Confidence!`,
        message: `A found item "${foundItem.title}" matches your lost "${lostItem.title}". Review match details to submit an ownership claim.`,
        reference_id: match.id,
      });
    }
  }
}

// ==================== AI MATCHING ====================
app.get('/api/matches', (req: Request, res: Response) => {
  const { itemId, userId } = req.query;
  const matches = db.getMatches({
    itemId: itemId as string,
    userId: userId as string,
  });

  // Enrich with item details
  const enriched = matches.map(m => {
    const lostItem = db.getItemById(m.lost_item_id);
    const foundItem = db.getItemById(m.found_item_id);
    return {
      ...m,
      lost_item: lostItem || null,
      found_item: foundItem || null,
    };
  });

  res.json({ matches: enriched });
});

app.post('/api/ai/match-item/:id', async (req: Request, res: Response) => {
  const item = db.getItemById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const oppositeType = item.type === 'lost' ? 'found' : 'lost';
  const candidates = db.getItems({ type: oppositeType });

  const generatedMatches = [];
  for (const candidate of candidates) {
    const lost = item.type === 'lost' ? item : candidate;
    const found = item.type === 'found' ? item : candidate;

    const resMatch = await matchItemsWithAI(lost, found);
    if (resMatch.match_score >= 40) {
      const saved = db.createOrUpdateMatch({
        lost_item_id: lost.id,
        found_item_id: found.id,
        match_score: resMatch.match_score,
        match_reasons: resMatch.match_reasons,
        ai_model: resMatch.ai_model,
        status: 'suggested',
      });
      generatedMatches.push({
        ...saved,
        lost_item: lost,
        found_item: found,
      });
    }
  }

  res.json({
    message: `Scanned ${candidates.length} candidates. Generated ${generatedMatches.length} potential matches.`,
    matches: generatedMatches,
  });
});

// ==================== CLAIMS & VERIFICATION ====================
app.get('/api/claims', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const { status, all } = req.query;

  // If student and not requesting all as admin, show only their claims
  const filterUserId = currentUser.role === 'admin' || all === 'true' ? undefined : currentUser.id;
  const claims = db.getClaims({ userId: filterUserId, status: status as string });

  res.json({ claims });
});

app.post('/api/claims', (req: Request, res: Response) => {
  const { item_id, proof_description, proof_photo_url, hidden_detail_attempt } = req.body;
  if (!item_id || !proof_description) {
    return res.status(400).json({ error: 'Item ID and proof description are required' });
  }

  const item = db.getItemById(item_id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const currentUser = getCurrentUser(req);
  const claim = db.createClaim({
    item_id,
    item_title: item.title,
    claimant_id: currentUser.id,
    claimant_name: currentUser.full_name,
    claimant_email: currentUser.email,
    claimant_roll_no: currentUser.student_or_staff_id,
    proof_description,
    proof_photo_url,
    hidden_detail_attempt: hidden_detail_attempt || '',
  });

  res.status(201).json({
    message: 'Claim registered and queued for Administrative Review',
    claim,
  });
});

app.patch('/api/claims/:id/review', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrative reviewers can adjudicate claims' });
  }

  const { decision, notes } = req.body;
  if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
    return res.status(400).json({ error: 'Decision must be "approved" or "rejected"' });
  }

  const claim = db.reviewClaim(
    req.params.id,
    { id: currentUser.id, name: currentUser.full_name },
    decision,
    notes || (decision === 'approved' ? 'Ownership verified by administration.' : 'Insufficient proof.')
  );

  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  res.json({
    message: `Claim successfully ${decision}`,
    claim,
  });
});

app.get('/api/claims/:id/inspect-secret', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  if (currentUser.role !== 'admin' && currentUser.role !== 'security') {
    return res.status(403).json({ error: 'Unauthorized to view hidden verification details' });
  }

  const claim = db.getClaimById(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const privateDetail = db.getPrivateDetailByItemId(claim.item_id);

  res.json({
    claim_id: claim.id,
    claimant_attempt: claim.hidden_detail_attempt,
    actual_secret: privateDetail
      ? {
          hidden_characteristic: privateDetail.hidden_characteristic,
          verification_answer: privateDetail.verification_answer,
          serial_number: privateDetail.serial_number,
        }
      : null,
  });
});

// ==================== SECURITY CUSTODY ====================
app.get('/api/security/records', (req: Request, res: Response) => {
  const records = db.getCollectionRecords();
  res.json({ records });
});

app.post('/api/security/intake', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  if (currentUser.role !== 'security' && currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only Security or Admin staff can record item intake' });
  }

  const { item_id, physical_storage_location, notes } = req.body;
  if (!item_id || !physical_storage_location) {
    return res.status(400).json({ error: 'Item ID and physical storage location are required' });
  }

  const record = db.recordSecurityIntake({
    item_id,
    security_staff_id: currentUser.id,
    security_staff_name: currentUser.full_name,
    physical_storage_location,
    notes,
  });

  res.status(201).json({
    message: 'Item officially taken into security custody',
    record,
  });
});

app.post('/api/security/handover', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  if (currentUser.role !== 'security' && currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only Security or Admin staff can record item handover' });
  }

  const { item_id, claim_id, collector_name, collector_id_proof, notes } = req.body;
  if (!item_id || !collector_name || !collector_id_proof) {
    return res.status(400).json({ error: 'Item ID, collector name, and ID proof are required' });
  }

  const record = db.recordSecurityHandover({
    item_id,
    claim_id,
    security_staff_id: currentUser.id,
    security_staff_name: currentUser.full_name,
    collector_name,
    collector_id_proof,
    notes,
  });

  res.status(201).json({
    message: 'Item handover successfully recorded and closed',
    record,
  });
});

// ==================== NOTIFICATIONS & AUDIT ====================
app.get('/api/notifications', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const notifications = db.getNotifications(currentUser.id);
  res.json({ notifications });
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

app.get('/api/audit-logs', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can inspect audit logs' });
  }
  const logs = db.getAuditLogs();
  res.json({ logs });
});

// ==================== ANALYTICS & BIGQUERY ====================
app.get('/api/analytics', (_req: Request, res: Response) => {
  const analytics = db.getAnalytics();
  res.json(analytics);
});

app.get('/api/analytics/bigquery-export', (_req: Request, res: Response) => {
  const raw = db.getRawData();
  const bigQueryItems = raw.items.map(item => ({
    table: 'sahe_campusfind.items',
    record: {
      item_id: item.id,
      reference_code: item.reference_code,
      item_type: item.type,
      category: item.category,
      brand_model: item.brand_model,
      color: item.color,
      campus_location: item.location,
      date_occurred: item.date_seen_or_found,
      status: item.status,
      custody: item.current_custody,
      ingested_at: new Date().toISOString(),
    },
  }));

  res.json({
    dataset: 'sahe_campusfind_analytics',
    projectId: 'siddhartha-campusfind-gcp',
    tableCount: 3,
    tables: ['items_fact', 'claims_fact', 'recovery_metrics'],
    rows: bigQueryItems,
  });
});

// ==================== CLOUD ARCHITECTURE SPECS ====================
app.get('/api/cloud-configs', (_req: Request, res: Response) => {
  res.json({
    googleCloud: {
      project_id: 'siddhartha-campusfind-prod',
      region: 'asia-south1 (Mumbai)',
      secondary_region: 'asia-south2 (Delhi)',
      components: {
        cloud_run: {
          service_name: 'campusfind-backend',
          runtime: 'python311 / nodejs22',
          memory: '1Gi',
          cpu: '1',
          vpc_connector: 'projects/siddhartha-campusfind-prod/locations/asia-south1/connectors/campus-vpc-conn',
        },
        cloud_sql: {
          instance_connection_name: 'siddhartha-campusfind-prod:asia-south1:campusfind-mysql-01',
          engine: 'MySQL 8.0',
          tier: 'db-custom-2-7680',
          private_ip_enabled: true,
          storage: 'SSD 20GB (Auto-scaling)',
        },
        cloud_storage: {
          bucket_name: 'siddhartha-campusfind-photos-secure',
          cors_enabled: true,
          uniform_bucket_level_access: true,
        },
        vertex_ai: {
          gemini_model: 'gemini-3.8-flash',
          features: ['Semantic Cross-Matching', 'Visual Feature Extraction', 'Confidence Scoring'],
        },
        cloud_pubsub: {
          topic_report_events: 'projects/siddhartha-campusfind-prod/topics/report-lifecycle-events',
          topic_match_events: 'projects/siddhartha-campusfind-prod/topics/match-alerts',
          subscription: 'campusfind-matcher-sub',
        },
        bigquery: {
          dataset: 'sahe_lost_and_found_analytics',
          looker_studio_report: 'CampusFind Executive Dashboard - SAHE Vijayawada',
        },
      },
    },
  });
});

// ==================== VITE MOUNTING / STATIC SERVE ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[CampusFind] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
