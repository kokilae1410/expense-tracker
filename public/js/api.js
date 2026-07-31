// Thin fetch wrapper that talks to the Expense Tracker REST API.
// Auth is cookie-based (httpOnly JWT cookie set by the server), with a
// bearer-token fallback stored in localStorage for extra resilience.

const api = {
  async request(method, endpoint, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;

    const options = {
      method,
      headers,
      credentials: 'include',
    };
    if (body !== undefined) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(`${APP_CONFIG.API_BASE}${endpoint}`, options);
    } catch (networkError) {
      throw new Error('Unable to reach the server. Please check your connection.');
    }

    let data = null;
    try {
      data = await response.json();
    } catch (parseError) {
      data = null;
    }

    if (!response.ok) {
      const message = (data && data.message) || `Request failed (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      err.errors = data && data.errors;
      throw err;
    }

    return data;
  },

  get(endpoint) {
    return this.request('GET', endpoint);
  },
  post(endpoint, body) {
    return this.request('POST', endpoint, body);
  },
  put(endpoint, body) {
    return this.request('PUT', endpoint, body);
  },
  delete(endpoint) {
    return this.request('DELETE', endpoint);
  },
};
