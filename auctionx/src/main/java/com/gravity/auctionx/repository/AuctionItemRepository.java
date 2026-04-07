package com.gravity.auctionx.repository;

import com.gravity.auctionx.domain.AuctionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuctionItemRepository extends JpaRepository<AuctionItem, Long> {
    List<AuctionItem> findByStatus(AuctionItem.AuctionStatus status);
}
