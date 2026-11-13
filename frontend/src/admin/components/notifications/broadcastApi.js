const getAuthHeaders = () => {
  let token = '';
  if (typeof window !== 'undefined') {
    if (window.__ADMIN_TOKEN__) return { Authorization: `Bearer ${window.__ADMIN_TOKEN__}` };
    try {
      const match = document.cookie.match(/(?:^|;\s*)(?:token|admin_token)=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    } catch {}
    if (!token) {
      try {
        token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      } catch {}
    }
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchBroadcastsApi() {
  const res = await fetch('/api/notifications/broadcasts', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) return [];
  return res.json();
}

export async function sendBroadcastNotificationApi({
  title, message, targetGroup = 'all', userFilters = {}, consultantFilters = {}, priority = 'normal'
}) {
  const res = await fetch('/api/notifications/admin-broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify({
      title, message, target_group: targetGroup, user_filters: userFilters, consultant_filters: consultantFilters, priority
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `خطأ في إرسال الإشعار (${res.status})`);
  }
  return res.json();
}

export async function resendBroadcastApi(id) {
  const res = await fetch(`/api/notifications/broadcasts/${encodeURIComponent(id)}/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `خطأ في إعادة الإرسال (${res.status})`);
  }
  return res.json();
}

export async function deleteBroadcastApi(id) {
  const res = await fetch(`/api/notifications/broadcasts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `خطأ في حذف الإشعار (${res.status})`);
  }
  return res.json();
}
