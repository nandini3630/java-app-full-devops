package com.gravity.auctionx.repository;

import com.gravity.auctionx.domain.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByAuctionItemIdOrderByBidTimeDesc(Long auctionItemId);
}
