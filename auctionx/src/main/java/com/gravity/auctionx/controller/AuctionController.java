package com.gravity.auctionx.controller;

import com.gravity.auctionx.domain.Bid;
import com.gravity.auctionx.dto.BidRequest;
import com.gravity.auctionx.dto.BidResponse;
import com.gravity.auctionx.service.AuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;
    // Spring Boot provides this template to push messages from the server to WebSocket clients
    private final SimpMessagingTemplate messagingTemplate;
    // Producer for our Kafka topic
    private final com.gravity.auctionx.service.AuctionEventProducer eventProducer;

    @PostMapping("/{id}/bids")
    public ResponseEntity<?> placeBid(@PathVariable Long id, @Valid @RequestBody BidRequest req) {
        try {
            // 1. Core Logic execution
            Bid successfulBid = auctionService.placeBid(id, req.getUserId(), req.getAmount());

            // 2. Format Response
            BidResponse response = BidResponse.builder()
                    .auctionItemId(id)
                    .username(successfulBid.getBidder().getUsername())
                    .bidAmount(successfulBid.getAmount())
                    .bidTime(successfulBid.getBidTime())
                    .status("SUCCESS")
                    .build();

            // 3. BROADCAST TO ALL DEVICES VIEWING THIS AUCTION IN REAL-TIME
            // We push the response directly to the Websocket topic. No polling required!
            messagingTemplate.convertAndSend("/topic/auctions/" + id, response);

            // 4. FIRE AND FORGET KAFKA EVENT FOR MICROSERVICES (Fraud Check, Analytics, etc)
            eventProducer.publishBidEvent(response);

            return ResponseEntity.ok(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            // Bad requests due to business validation (too low, lock failure, out of time)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error placing bid", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("System error");
        }
    }
}
