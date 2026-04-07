const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch data');
  }

  return res.json();
}

export const auctionApi = {
  // Get all auctions
  getAuctions: () => fetchApi('/api/auctions'),
  
  // Get single auction
  getAuction: (id: string | number) => fetchApi(`/api/auctions/${id}`),
  
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
};
