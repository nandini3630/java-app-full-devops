export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Bid {
  id: number;
  auctionId: number;
  userId: number;
  username: string;
  bidAmount: number;
  bidTime: string;
}

export interface Auction {
  id: number;
  title: string;
  description: string;
  startingPrice: number;
  currentHighestBid: number;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'ENDED' | 'PENDING';
}
