import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit,
  serverTimestamp,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Types ──────────────────────────────────────────────────
export interface PageViewEvent {
  page: string;
  sessionId: string;
  referrer: string;
  userAgent: string;
  device: 'mobile' | 'tablet' | 'desktop';
  country?: string;
  timestamp: Timestamp | ReturnType<typeof serverTimestamp>;
  duration?: number;
}

export interface InteractionEvent {
  type: 'click' | 'scroll' | 'form_submit' | 'link_click';
  target: string;
  page: string;
  sessionId: string;
  timestamp: Timestamp | ReturnType<typeof serverTimestamp>;
}

export interface DailyStats {
  date: string;
  views: number;
  uniqueSessions: number;
  interactions: number;
}

export interface PageStats {
  page: string;
  views: number;
  percentage: number;
}

export interface DeviceStats {
  device: string;
  count: number;
  color: string;
}

export interface ReferrerStats {
  referrer: string;
  count: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function getDevice(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem('analytics_session');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('analytics_session', sid);
  }
  return sid;
}

function getReferrer(): string {
  const ref = document.referrer;
  if (!ref) return 'direct';
  try {
    const url = new URL(ref);
    return url.hostname || 'direct';
  } catch {
    return 'direct';
  }
}

// ─── Write Operations ────────────────────────────────────────
export async function trackPageView(page: string): Promise<void> {
  try {
    const event: PageViewEvent = {
      page,
      sessionId: getOrCreateSessionId(),
      referrer: getReferrer(),
      userAgent: navigator.userAgent,
      device: getDevice(),
      timestamp: serverTimestamp(),
    };
    await addDoc(collection(db, 'page_views'), event);
  } catch (err) {
    console.error('[Analytics] trackPageView error:', err);
  }
}

export async function trackInteraction(
  type: InteractionEvent['type'],
  target: string,
  page: string
): Promise<void> {
  try {
    const event: InteractionEvent = {
      type,
      target,
      page,
      sessionId: getOrCreateSessionId(),
      timestamp: serverTimestamp(),
    };
    await addDoc(collection(db, 'interactions'), event);
  } catch (err) {
    console.error('[Analytics] trackInteraction error:', err);
  }
}

// ─── Read Operations ─────────────────────────────────────────

/** Returns page view docs from last N days */
async function fetchPageViews(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const q = query(
    collection(db, 'page_views'),
    where('timestamp', '>=', Timestamp.fromDate(cutoff)),
    orderBy('timestamp', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PageViewEvent & { id: string }));
}

async function fetchInteractions(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const q = query(
    collection(db, 'interactions'),
    where('timestamp', '>=', Timestamp.fromDate(cutoff)),
    orderBy('timestamp', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InteractionEvent & { id: string }));
}

/** Build daily breakdown for the last N days */
function buildDailyStats(
  views: (PageViewEvent & { id: string })[],
  interactions: (InteractionEvent & { id: string })[],
  days: number
): DailyStats[] {
  const result: DailyStats[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD

    const dayViews = views.filter((v) => {
      const ts = v.timestamp as Timestamp;
      if (!ts?.toDate) return false;
      return ts.toDate().toISOString().slice(0, 10) === dateStr;
    });

    const dayInteractions = interactions.filter((v) => {
      const ts = v.timestamp as Timestamp;
      if (!ts?.toDate) return false;
      return ts.toDate().toISOString().slice(0, 10) === dateStr;
    });

    const uniqueSessions = new Set(dayViews.map((v) => v.sessionId)).size;

    result.push({
      date: dateStr,
      views: dayViews.length,
      uniqueSessions,
      interactions: dayInteractions.length,
    });
  }

  return result;
}

function buildPageStats(views: (PageViewEvent & { id: string })[]): PageStats[] {
  const map: Record<string, number> = {};
  views.forEach((v) => {
    const p = v.page || '/';
    map[p] = (map[p] || 0) + 1;
  });

  const total = views.length || 1;
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([page, count]) => ({
      page,
      views: count,
      percentage: Math.round((count / total) * 100),
    }));
}

function buildDeviceStats(views: (PageViewEvent & { id: string })[]): DeviceStats[] {
  const map: Record<string, number> = {};
  views.forEach((v) => {
    const d = v.device || 'desktop';
    map[d] = (map[d] || 0) + 1;
  });

  const colorMap: Record<string, string> = {
    desktop: '#6366f1',
    mobile: '#22d3ee',
    tablet: '#f59e0b',
  };

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([device, count]) => ({
      device,
      count,
      color: colorMap[device] || '#9ca3af',
    }));
}

function buildReferrerStats(views: (PageViewEvent & { id: string })[]): ReferrerStats[] {
  const map: Record<string, number> = {};
  views.forEach((v) => {
    const r = v.referrer || 'direct';
    map[r] = (map[r] || 0) + 1;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([referrer, count]) => ({ referrer, count }));
}

// ─── Main Analytics Fetcher ──────────────────────────────────
export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  totalInteractions: number;
  avgSessionViews: number;
  dailyStats: DailyStats[];
  pageStats: PageStats[];
  deviceStats: DeviceStats[];
  referrerStats: ReferrerStats[];
  periodDays: number;
}

export async function fetchAnalytics(days = 30): Promise<AnalyticsSummary> {
  const [views, interactions] = await Promise.all([
    fetchPageViews(days),
    fetchInteractions(days),
  ]);

  const uniqueVisitors = new Set(views.map((v) => v.sessionId)).size;
  const avgSessionViews =
    uniqueVisitors > 0 ? Math.round((views.length / uniqueVisitors) * 10) / 10 : 0;

  return {
    totalViews: views.length,
    uniqueVisitors,
    totalInteractions: interactions.length,
    avgSessionViews,
    dailyStats: buildDailyStats(views, interactions, days),
    pageStats: buildPageStats(views),
    deviceStats: buildDeviceStats(views),
    referrerStats: buildReferrerStats(views),
    periodDays: days,
  };
}

/** Quick method to get top 5 most recent events */
export async function fetchRecentActivity(limitCount = 10) {
  const q = query(
    collection(db, 'page_views'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PageViewEvent & { id: string }));
}

/** 
 * Reset all analytics data by deleting docs in page_views and interactions.
 * Note: For production use with huge data, this should be done via Cloud Function.
 */
export async function resetAnalytics(): Promise<void> {
  const [viewsSnap, interactionsSnap] = await Promise.all([
    getDocs(collection(db, 'page_views')),
    getDocs(collection(db, 'interactions')),
  ]);

  const batch = writeBatch(db);

  viewsSnap.docs.forEach((d) => {
    batch.delete(doc(db, 'page_views', d.id));
  });

  interactionsSnap.docs.forEach((d) => {
    batch.delete(doc(db, 'interactions', d.id));
  });

  await batch.commit();
}

