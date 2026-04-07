package com.gravity.auctionx.service;

import com.gravity.auctionx.domain.AuctionItem;
import com.gravity.auctionx.domain.Bid;
import com.gravity.auctionx.dto.AuctionCompletedEvent;
import com.gravity.auctionx.repository.AuctionItemRepository;
import com.gravity.auctionx.repository.BidRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@EnableScheduling
@RequiredArgsConstructor
public class AuctionEndScheduler {

    private final AuctionItemRepository auctionItemRepository;
    private final BidRepository bidRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TOPIC_AUCTION_COMPLETED = "auction-completed";

    /**
     * Runs every 10 seconds. 
     * In a massive 10,000 user production system, we would use Quartz or Redis Keyspace Notifications
     * for exact-second precision. But this distributed cron approach works well for our architecture.
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public void closeExpiredAuctions() {
        log.info("Cron: Checking for expired auctions...");

        // Fetch all ACTIVE auctions whose end time has passed
        List<AuctionItem> activeAuctions = auctionItemRepository.findByStatus(AuctionItem.AuctionStatus.ACTIVE);

        for (AuctionItem item : activeAuctions) {
            if (item.getEndTime().isBefore(LocalDateTime.now())) {
                log.info("Auction {} has expired. Closing it down.", item.getId());
                
                item.setStatus(AuctionItem.AuctionStatus.ENDED);
                auctionItemRepository.save(item);

                // Find the winning bid (highest bid time is most recent)
                List<Bid> bids = bidRepository.findByAuctionItemIdOrderByBidTimeDesc(item.getId());
                if (!bids.isEmpty()) {
                    Bid winningBid = bids.get(0);
                    
                    // Create the event payload
                    AuctionCompletedEvent event = AuctionCompletedEvent.builder()
                            .auctionItemId(item.getId())
                            .winningUserId(winningBid.getBidder().getId())
                            .winningUsername(winningBid.getBidder().getUsername())
                            .winningUserEmail(winningBid.getBidder().getEmail())
                            .winningBidAmount(winningBid.getAmount())
                            .build();

                    // DECOUPLED ARCHITECTURE: We do NOT process payment here. 
                    // We throw the event over the wall to Kafka, and the Payment Service picks it up.
                    log.info("Publishing AuctionCompletedEvent to Kafka for Item {}", item.getId());
                    kafkaTemplate.send(TOPIC_AUCTION_COMPLETED, String.valueOf(item.getId()), event);
                } else {
                    log.info("Auction {} ended with NO bids.", item.getId());
                }
            }
        }
    }
}
