const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      // Spring Boot error bodies: { message, error, detail, ... }
      message = body.message || body.detail || body.error || message
    } catch {
      const text = await res.text().catch(() => '')
      if (text) message = text
    }
    throw new ApiError(message, res.status)
  }

  return res.json();
}

export const auctionApi = {
  // Get all auctions
  getAuctions: () => fetchApi('/api/auctions'),

  // Get single auction
  getAuction: (id: string | number) => fetchApi(`/api/auctions/${id}`),

  // Get bids for an auction
  getBids: (auctionId: string | number) => fetchApi(`/api/auctions/${auctionId}/bids`),

  // Create auction
  createAuction: (data: any) => fetchApi('/api/auctions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Place bid
  placeBid: (auctionId: number, userId: number, amount: number) => fetchApi(`/api/auctions/${auctionId}/bids`, {
    method: 'POST',
    body: JSON.stringify({ userId, amount }),
  }),

  // Register user
  register: (username: string, email: string) => fetchApi('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({ username, email }),
  }),

  // Login user — tries POST /api/users/login first; falls back to GET /api/users?username=X
  loginUser: async (username: string, email: string) => {
    // Strategy 1: dedicated login endpoint
    try {
      return await fetchApi('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, email }),
      });
    } catch {
      // Strategy 2: search by username query param
      try {
        return await fetchApi(`/api/users?username=${encodeURIComponent(username)}`);
      } catch {
        // Strategy 3: fetch all users and match client-side
        const users: { id: number; username: string; email: string }[] = await fetchApi('/api/users');
        const match = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase() && u.email.toLowerCase() === email.toLowerCase()
        );
        if (!match) throw new Error('No account found with that username and email.');
        return match;
      }
    }
  },
};
