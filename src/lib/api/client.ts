// ============================================
// API Client for Notification Service
// Uses working endpoints only
// ============================================

// ✅ USE RELATIVE PATHS - Remove API_BASE entirely
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://br90xiwuh4.execute-api.ap-south-1.amazonaws.com';
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'a3ea1cda-c735-4798-8219-54bbb07795a9';

// ============================================
// TYPES
// ============================================

export type Channel = 'EMAIL' | 'WHATSAPP' | 'SMS';

export interface SendPayload {
  channel: Channel;
  provider: string;
  to: string | string[];
  content: {
    templateId?: string;
    variables?: Record<string, string>;
    subject?: string;
    text?: string;
  };
  priority?: 1 | 2 | 3 | 4 | 5;
  scheduledAt?: string;
  idempotencyKey?: string;
}

export interface TaskResponse {
  success: boolean;
  taskId: string;
  status: string;
  message?: string;
  totalRecipients?: number;
  provider?: string;
}

export interface TaskStatus {
  id: string;
  clientId: string;
  userId: string;
  channel: string;
  provider: string;
  priority: number;
  status: string;
  sourcePayload: any;
  enrichedPayload?: any;
  idempotencyKey?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  maxRetries: number;
  providerRequestId?: string;
  createdAt: string;
  updatedAt: string;
  parentTaskId?: string;
  cronJobId?: string;
  attempts: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  id: string;
  taskId: string;
  attemptNumber: number;
  attempt?: number; // compat
  status: string;
  providerRequestId?: string;
  providerResponse?: any;
  providerError?: any;
  error?: string; // compat
  errorCode?: string;
  latencyMs?: number;
  startedAt: string;
  completedAt?: string;
  timestamp?: string; // compat
  isRetry: boolean;
  nextRetryAt?: string;
  createdAt: string;
}

export interface BulkStatusResponse {
  parentTask: TaskStatus;
  summary: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    processing: number;
  };
  children: TaskStatus[];
  recipients: Array<{
    taskId: string;
    recipients: string[];
    status: string;
    error?: string;
    sentAt?: string;
    providerRequestId?: string;
  }>;
}

export interface CronJob {
  id: string;
  clientId: string;
  userId: string;
  name: string;
  expression: string;
  channel: string;
  provider: string;
  payload: any;
  status: 'ACTIVE' | 'PAUSED';
  timezone: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  executions: CronExecution[];
}

export interface CronExecution {
  id: string;
  cronJobId: string;
  taskId: string;
  status: string;
  runAt: string;
  error?: string;
}

export interface Provider {
  id: string;
  name: string;
  channel: string;
  isActive: boolean;
  isDefault: boolean;
  credentials?: any;
}

export interface EmailLog {
  id?: string;
  taskId?: string;
  channel: string;
  provider: string;
  recipient: string;
  subject?: string;
  status: string;
  createdAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  isBulk?: boolean;
}

export interface Task {
  id: string;
  channel: Channel;
  status: string;
  recipient: string | null;
  provider: string;
  providerRequestId?: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  attemptCount: number;
  lastAttempt?: {
    status: string;
    latencyMs?: number;
    completedAt?: string;
    attemptNumber: number;
  } | null;
}

export interface SummaryStats {
  total: number;
  today: number;
  sentToProvider: number;
  delivered: number;
  failed: number;
  processing: number;
  scheduled: number;
  byChannel: Array<{ channel: string; count: number }>;
  deliveryRate: number;
  successRate: number;
  statusCounts: {
    total: number;
    sentToProvider: number;
    delivered: number;
    failed: number;
    processing: number;
    scheduled: number;
  };
}

export interface ChannelStats {
  channel: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  processing: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function normalizeList<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (data.data && Array.isArray(data.data)) return data.data as T[];
  if (data.logs && Array.isArray(data.logs)) return data.logs as T[];
  if (data.items && Array.isArray(data.items)) return data.items as T[];
  if (data.results && Array.isArray(data.results)) return data.results as T[];
  if (data.result && Array.isArray(data.result)) return data.result as T[];
  if (data.rows && Array.isArray(data.rows)) return data.rows as T[];
  return [];
}

// ============================================
// STATIC DATA
// ============================================

export const CHANNELS: Array<{ id: Channel; label: string; description: string }> = [
  { id: 'EMAIL', label: '📧 Email', description: 'Send email notifications' },
  { id: 'WHATSAPP', label: '💬 WhatsApp', description: 'Send WhatsApp messages' },
  { id: 'SMS', label: '📱 SMS', description: 'Send SMS notifications' },
];

export const PRIORITIES: Array<{ value: number; label: string; description: string }> = [
  { value: 1, label: '🔴 High', description: 'Critical notifications' },
  { value: 3, label: '🟡 Medium', description: 'Standard notifications' },
  { value: 5, label: '🟢 Low', description: 'Non-urgent notifications' },
];

export const PROVIDERS_BY_CHANNEL: Record<Channel, string[]> = {
  EMAIL: ['msg91', 'sendgrid', 'ses'],
  WHATSAPP: ['ultramsg', 'meta', 'twilio'],
  SMS: ['jiocx', 'twilio', 'textlocal'],
};

export const PROVIDER_NAMES: Record<string, string> = {
  msg91: 'MSG91',
  sendgrid: 'SendGrid',
  ses: 'AWS SES',
  ultramsg: 'UltraMsg',
  meta: 'Meta WhatsApp',
  twilio: 'Twilio',
  jiocx: 'JioCX',
  textlocal: 'TextLocal',
};

export const TEMPLATES: Array<{
  id: string;
  label: string;
  channel: Channel[];
  variables: string[];
}> = [
  {
    id: 'global_otp',
    label: 'OTP Verification',
    channel: ['EMAIL'],
    variables: ['otp', 'company_name'],
  },
  {
    id: 'boardview_reminder',
    label: 'Meeting Reminder',
    channel: ['EMAIL'],
    variables: ['name', 'meeting_time', 'meeting_date', 'company_name'],
  },
  {
    id: 'baap_webhook_notifications',
    label: 'Webhook Notification',
    channel: ['EMAIL'],
    variables: ['event', 'action', 'module', 'company_name'],
  },
];

// ============================================
// MOCK DATA PRE-POPULATION
// ============================================

export const MOCK_NOTIFICATIONS: EmailLog[] = [
  {
    id: "task-otp-9988",
    taskId: "task-otp-9988",
    channel: "EMAIL",
    provider: "sendgrid",
    recipient: "alex.jones@example.com",
    subject: "OTP Verification",
    status: "DELIVERED",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 9.8 * 60000).toISOString(),
    deliveredAt: new Date(Date.now() - 9.5 * 60000).toISOString(),
  },
  {
    id: "task-rem-1122",
    taskId: "task-rem-1122",
    channel: "EMAIL",
    provider: "ses",
    recipient: "clara.oswald@company.org",
    subject: "Meeting Reminder",
    status: "SENT",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 29 * 60000).toISOString(),
  },
  {
    id: "task-bulk-3344",
    taskId: "task-bulk-3344",
    channel: "EMAIL",
    provider: "sendgrid",
    recipient: "Bulk Upload recipients",
    subject: "Bulk CSV Notification",
    status: "PROCESSING",
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    isBulk: true,
  },
  {
    id: "task-wa-otp-5566",
    taskId: "task-wa-otp-5566",
    channel: "WHATSAPP",
    provider: "ultramsg",
    recipient: "+919876543210",
    subject: "OTP Verification",
    status: "DELIVERED",
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 117 * 60000).toISOString(),
    deliveredAt: new Date(Date.now() - 114 * 60000).toISOString(),
  },
  {
    id: "task-sms-1111",
    taskId: "task-sms-1111",
    channel: "SMS",
    provider: "twilio",
    recipient: "+15550199",
    subject: "OTP Verification",
    status: "FAILED",
    createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
    sentAt: new Date(Date.now() - 239 * 60000).toISOString(),
  }
];

const LOCAL_STORAGE_KEY = 'baap_notify:recent_tasks';

function initLocalStorage() {
  try {
    if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_NOTIFICATIONS));
    }
  } catch (e) {
    console.error('Failed to initialize local storage mock data', e);
  }
}
initLocalStorage();

// ============================================
// API FETCH WITH UNIFIED ERROR BOUNDARY
// ✅ Uses RELATIVE PATHS - no API_BASE
// ============================================

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // ✅ Use relative path directly (no API_BASE concatenation)
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const headers: HeadersInit = {
    'x-client-id': CLIENT_ID,
    'x-requested-with': 'XMLHttpRequest', // ✅ Required for CORS proxy
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds request timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let statusCode = response.status;
      let errorData: any = null;
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (jsonErr) {
        try {
          const text = await response.text();
          if (text) errorMessage = text.slice(0, 100);
        } catch (textErr) {}
      }
      
      const apiErr = new Error(errorMessage) as any;
      apiErr.statusCode = statusCode;
      apiErr.errorData = errorData;
      throw apiErr;
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutErr = new Error('Request timeout after 30 seconds') as any;
      timeoutErr.statusCode = 408;
      throw timeoutErr;
    }
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// ============================================
// HEALTH API
// ============================================

export const HealthApi = {
  check: async () => {
    try {
      return await apiFetch<{ status: string }>('/health');
    } catch (err) {
      console.warn('Health check failed', err);
      return { status: 'unhealthy' };
    }
  },
};

// ============================================
// CRON APIS
// ============================================

export const CronApi = {
  list: () =>
    apiFetch<{ data: CronJob[]; pagination: any }>('/api/v1/cron'),

  create: (data: any) =>
    apiFetch<{ success: boolean; cronJob: CronJob }>('/api/v1/cron', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiFetch<{ success: boolean; cronJob: CronJob }>(`/api/v1/cron/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/v1/cron/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    }),

  pause: (id: string) =>
    apiFetch<{ success: boolean; cronJob: CronJob }>(`/api/v1/cron/${id}/pause`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  resume: (id: string) =>
    apiFetch<{ success: boolean; cronJob: CronJob }>(`/api/v1/cron/${id}/resume`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};

// ============================================
// NOTIFICATION APIS
// ============================================

export const NotificationApi = {
  // Send notification
  send: async (data: SendPayload) => {
    const res = await apiFetch<TaskResponse>('/api/v1/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.success && res.taskId) {
      try {
        const tasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const toVal = Array.isArray(data.to) ? data.to.join(', ') : data.to;
        
        tasks.unshift({
          id: res.taskId,
          taskId: res.taskId,
          channel: data.channel,
          provider: data.provider,
          recipient: toVal,
          subject: data.content?.subject || data.content?.templateId || 'Direct Message',
          status: res.status || 'QUEUED',
          createdAt: new Date().toISOString(),
        });
        
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks.slice(0, 100)));
      } catch (err) {
        console.error('Failed to log sent notification to localStorage', err);
      }
    }
    return res;
  },

  // Get task status by ID
  status: async (taskId: string): Promise<TaskStatus> => {
    const res = await apiFetch<any>(`/api/v1/status/${taskId}`);
    return res.task || res;
  },

  // Get bulk status by task ID
  bulkStatus: (taskId: string) =>
    apiFetch<BulkStatusResponse>(`/api/v1/bulk/status/${taskId}`),

  // Poll status of a task with exponential backoff retry logic
  pollStatus: async (taskId: string, isBulk = false, maxAttempts = 10, initialDelay = 1000) => {
    let attempt = 0;
    let delay = initialDelay;

    while (attempt < maxAttempts) {
      try {
        if (isBulk) {
          const statusRes = await NotificationApi.bulkStatus(taskId);
          const parentStatus = statusRes?.parentTask?.status;
          if (parentStatus === 'DELIVERED' || parentStatus === 'FAILED' || parentStatus === 'SENT') {
            return statusRes;
          }
        } else {
          const statusRes = await NotificationApi.status(taskId);
          const status = statusRes?.status;
          if (status === 'DELIVERED' || status === 'FAILED' || status === 'SENT') {
            return statusRes;
          }
        }
      } catch (err) {
        console.warn(`Polling attempt ${attempt + 1} failed for task ${taskId}:`, err);
      }

      attempt++;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 10000);
      }
    }

    return isBulk 
      ? await NotificationApi.bulkStatus(taskId)
      : await NotificationApi.status(taskId);
  },

  // CSV Bulk Upload
  bulkCsv: async (formData: FormData) => {
    const res = await apiFetch<TaskResponse>('/api/v1/send/bulk/csv', {
      method: 'POST',
      body: formData,
    });

    if (res.success && res.taskId) {
      try {
        const tasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const channel = formData.get('channel') as string || 'EMAIL';
        const provider = formData.get('provider') as string || 'msg91';
        
        tasks.unshift({
          id: res.taskId,
          taskId: res.taskId,
          channel,
          provider,
          recipient: 'Bulk Upload recipients',
          subject: 'Bulk CSV Notification',
          status: res.status || 'QUEUED',
          createdAt: new Date().toISOString(),
          isBulk: true,
        });

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks.slice(0, 100)));
      } catch (err) {
        console.error('Failed to log bulk CSV to localStorage', err);
      }
    }
    return res;
  },

  // Get providers
  providers: () =>
    apiFetch<{ providers: Provider[] }>('/api/providers'),

  // Clear cache
  clearCache: () =>
    apiFetch<{ status: string }>('/api/admin/cache/clear', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  // Email Logs (Unified logs query using localStorage fallback & active API polling)
  emailLogs: async (params?: { taskId?: string; limit?: number; status?: string; channel?: string; searchTaskId?: string }) => {
    try {
      let recent = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as any[];

      const searchKey = params?.taskId || params?.searchTaskId;
      if (searchKey) {
        const term = searchKey.trim();
        const exists = recent.some(t => t.id === term || t.taskId === term);
        if (!exists && term.length > 5 && !term.startsWith('task-') && !term.startsWith('mock-')) {
          try {
            const task = await NotificationApi.status(term);
            if (task && task.id) {
              recent.unshift({
                id: task.id,
                taskId: task.id,
                channel: task.channel,
                provider: task.provider,
                recipient: task.sourcePayload?.to || 'Unknown',
                subject: task.sourcePayload?.content?.subject || task.sourcePayload?.content?.templateId || 'Searched Task',
                status: task.status,
                createdAt: task.createdAt || new Date().toISOString(),
              });
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recent));
            }
          } catch (err) {
            try {
              const bulkTask = await NotificationApi.bulkStatus(term);
              if (bulkTask && bulkTask.parentTask) {
                recent.unshift({
                  id: bulkTask.parentTask.id,
                  taskId: bulkTask.parentTask.id,
                  channel: bulkTask.parentTask.channel,
                  provider: bulkTask.parentTask.provider,
                  recipient: 'Bulk Upload recipients',
                  subject: 'Bulk CSV Notification',
                  status: bulkTask.parentTask.status,
                  createdAt: bulkTask.parentTask.createdAt || new Date().toISOString(),
                  isBulk: true,
                });
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recent));
              }
            } catch (bulkErr) {
              console.warn(`Could not find task ID ${term} in single or bulk status API`, err, bulkErr);
            }
          }
        }
      }

      if (recent.length === 0) {
        return { logs: [], data: [], success: true };
      }

      // Fetch latest updates for all active tasks from the backend in parallel
      const updatedLogs = await Promise.all(
        recent.map(async (task) => {
          if ((task.status === 'DELIVERED' || task.status === 'FAILED') && (task.sentAt || task.deliveredAt)) {
            return task;
          }

          // Skip API status check for mock tasks to avoid spamming 404 console errors
          if (task.id.startsWith('task-') || task.id.startsWith('mock-')) {
            return task;
          }

          try {
            if (task.isBulk) {
              const statusRes = await NotificationApi.bulkStatus(task.id);
              if (statusRes && statusRes.parentTask) {
                return {
                  ...task,
                  status: statusRes.parentTask.status,
                  sentAt: statusRes.parentTask.sentAt || task.sentAt,
                  deliveredAt: statusRes.parentTask.deliveredAt || task.deliveredAt,
                };
              }
            } else {
              const statusRes = await NotificationApi.status(task.id);
              if (statusRes) {
                return {
                  ...task,
                  status: statusRes.status,
                  sentAt: statusRes.sentAt || task.sentAt,
                  deliveredAt: statusRes.deliveredAt || task.deliveredAt,
                };
              }
            }
          } catch (err) {
            // Keep existing state if offline or API fails
          }
          return task;
        })
      );

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLogs));

      let filtered = [...updatedLogs];
      if (params?.channel && params.channel !== 'ALL') {
        filtered = filtered.filter(l => (l.channel || '').toUpperCase() === params.channel.toUpperCase());
      }
      if (params?.status && params.status !== 'ALL') {
        filtered = filtered.filter(l => (l.status || '').toUpperCase() === params.status.toUpperCase());
      }
      if (params?.limit) {
        filtered = filtered.slice(0, params.limit);
      }

      return { logs: filtered, data: filtered, success: true };
    } catch (err) {
      console.error('Failed to compile email logs from localStorage', err);
      return { logs: [], data: [], success: true };
    }
  },

  // Mock webhook status
  webhookStatus: async (taskId: string) => {
    return { success: true, taskId, webhookStatus: null };
  },

  cron: CronApi
};

// ============================================
// TASK TRACKING APIS (NEW ENDPOINTS)
// ============================================

export const taskApi = {
  getRecent: async (limit = 10): Promise<{ success: boolean; data: Task[] }> => {
    try {
      const res = await apiFetch<{ success: boolean; data: Task[] }>(`/api/v1/tasks/recent?limit=${limit}`);
      if (!res.success) {
        throw new Error((res as any)?.message || 'Failed to fetch recent tasks');
      }
      return res;
    } catch (error: any) {
      if (error?.statusCode === 404) {
        console.warn('Backend endpoints returning 404. Falling back to empty lists.');
        return { success: true, data: [] };
      }
      throw error;
    }
  },

  getSummary: async (): Promise<{ success: boolean; data: SummaryStats }> => {
    try {
      const res = await apiFetch<{ success: boolean; data: SummaryStats }>('/api/v1/tasks/summary');
      if (!res.success) {
        throw new Error((res as any)?.message || 'Failed to fetch task summary');
      }
      return res;
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return {
          success: true,
          data: {
            total: 0,
            today: 0,
            sentToProvider: 0,
            delivered: 0,
            failed: 0,
            processing: 0,
            scheduled: 0,
            byChannel: [],
            deliveryRate: 0,
            successRate: 0,
            statusCounts: {
              total: 0,
              sentToProvider: 0,
              delivered: 0,
              failed: 0,
              processing: 0,
              scheduled: 0,
            }
          }
        };
      }
      throw error;
    }
  },

  getTasks: async (params?: {
    page?: number;
    limit?: number;
    channel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Task>> => {
    try {
      const queryParts: string[] = [];
      if (params?.page) queryParts.push(`page=${params.page}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.channel && params.channel !== 'ALL') queryParts.push(`channel=${params.channel}`);
      if (params?.status && params.status !== 'ALL') queryParts.push(`status=${params.status}`);
      if (params?.startDate) queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
      if (params?.endDate) queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);

      const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const res = await apiFetch<PaginatedResponse<Task>>(`/api/v1/tasks${queryStr}`);
      if (!res.success) {
        throw new Error((res as any)?.message || 'Failed to fetch tasks');
      }
      return res;
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return {
          success: true,
          data: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        };
      }
      throw error;
    }
  },

  getStats: async (): Promise<{ success: boolean; data: ChannelStats[] }> => {
    try {
      const res = await apiFetch<{ success: boolean; data: ChannelStats[] }>('/api/v1/tasks/stats');
      if (!res.success) {
        throw new Error((res as any)?.message || 'Failed to fetch task stats');
      }
      return res;
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return { success: true, data: [] };
      }
      throw error;
    }
  },

  getTasksForAnalytics: async (startDate: string, endDate: string): Promise<Task[]> => {
    let allTasks: Task[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && allTasks.length < 5000) {
      try {
        const response = await taskApi.getTasks({
          page,
          limit: 100,
          startDate,
          endDate,
        });
        
        if (!response.data || response.data.length === 0) {
          break;
        }
        
        allTasks = [...allTasks, ...response.data];
        hasMore = response.pagination.hasNextPage;
        page++;
      } catch (error) {
        console.error("Error in getTasksForAnalytics fetching page", page, error);
        break;
      }
    }
    
    return allTasks;
  },
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  NotificationApi,
  CronApi,
  HealthApi,
  taskApi,
  PROVIDERS_BY_CHANNEL,
  PROVIDER_NAMES,
  TEMPLATES,
  CHANNELS,
  PRIORITIES,
  normalizeList,
  apiFetch,
};