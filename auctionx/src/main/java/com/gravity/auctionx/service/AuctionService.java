package com.gravity.auctionx.service;

import com.gravity.auctionx.domain.AuctionItem;
import com.gravity.auctionx.domain.Bid;
import com.gravity.auctionx.domain.User;
import com.gravity.auctionx.repository.AuctionItemRepository;
import com.gravity.auctionx.repository.BidRepository;
import com.gravity.auctionx.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionService {

    private final AuctionItemRepository auctionItemRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;

    /**
     * Places a bid on an auction item.
     * 
     * @Transactional ensures that either BOTH the bid is saved and the item updated, OR nothing happens.
     */
    @Transactional
    public Bid placeBid(Long auctionItemId, Long userId, BigDecimal bidAmount) {
        log.info("Attempting to place bid of {} for item {} by user {}", bidAmount, auctionItemId, userId);

        AuctionItem item = auctionItemRepository.findById(auctionItemId)
                .orElseThrow(() -> new IllegalArgumentException("Auction Item not found"));

        if (item.getStatus() != AuctionItem.AuctionStatus.ACTIVE) {
            throw new IllegalStateException("Auction is no longer active");
        }

        if (LocalDateTime.now().isAfter(item.getEndTime())) {
            // In a real app, an event listener would have closed this.
            item.setStatus(AuctionItem.AuctionStatus.ENDED);
            auctionItemRepository.save(item);
            throw new IllegalStateException("Auction time has ended");
        }

        if (bidAmount.compareTo(item.getCurrentHighestBid()) <= 0) {
            throw new IllegalArgumentException("Bid amount must be higher than current highest bid");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        try {
            // Update the item's current high bid
            item.setCurrentHighestBid(bidAmount);
            auctionItemRepository.save(item); 
            // Because of @Version, if another thread updated the item between our read and this save,
            // Hibernate will throw an ObjectOptimisticLockingFailureException.

            // Create the immutable ledger record
            Bid newBid = Bid.builder()
                    .auctionItem(item)
                    .bidder(user)
                    .amount(bidAmount)
                    .build();

            return bidRepository.save(newBid);

        } catch (ObjectOptimisticLockingFailureException e) {
            // This is DevOps & High Concurrency 101. 
            // Two people hit the exact same item within the same millisecond. 
            log.warn("Race condition detected! User {} bid failed due to a newer bid arriving first.", userId);
            throw new IllegalStateException("Someone else placed a bid just before you! Please fetch the latest price and try again.");
        }
    }
}
