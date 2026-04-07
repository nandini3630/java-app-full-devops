package com.gravity.auctionx.service;

import com.gravity.auctionx.dto.BidResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionEventProducer {

    private final KafkaTemplate<String, BidResponse> kafkaTemplate;
    private static final String TOPIC = "auction-bids";

    public void publishBidEvent(BidResponse event) {
        log.info("Producing Kafka Event to topic {} -> {}", TOPIC, event);
        
        // This pushes the message asynchronously into the Kafka stream.
        // It does not block the user's web request!
        kafkaTemplate.send(TOPIC, String.valueOf(event.getAuctionItemId()), event);
    }
}
