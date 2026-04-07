package com.gravity.payment.service;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripePaymentProcessor {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TOPIC_PAYMENT_SUCCESS = "payment-successful";
    private static final String TOPIC_PAYMENT_FAILED = "payment-failed";

    /**
     * Listens to the core engine. When an auction ends, this method runs
     * automatically.
     */
    @KafkaListener(topics = "auction-completed", groupId = "payment-processing-group")
    public void processWinningBid(Map<String, Object> event) {
        log.info("RECEIVED KAFKA EVENT: Auction Ended! Processing Payment: {}", event);

        // In a real app, 'event' is parsed into a strong DTO.
        Long auctionId = Long.valueOf(event.get("auctionItemId").toString());
        String email = event.get("winningUserEmail").toString();
        BigDecimal amount = new BigDecimal(event.get("winningBidAmount").toString());

        log.info("Initiating Stripe Charge for {} to user {}...", amount, email);

        try {
            // SIMULATING STRIPE API CALL
            Thread.sleep(2000); // Network latency

            // Random chance of declined card for DevOps fault-tolerance learning
            boolean isCardDeclined = Math.random() < 0.2;

            if (isCardDeclined) {
                log.error("STRIPE REJECTED: Insufficient Funds for user {}", email);
                kafkaTemplate.send(TOPIC_PAYMENT_FAILED, String.valueOf(auctionId), event);
                return;
            }

            log.info("STRIPE SUCCESS: Card charged successfully.");

            // Publish Success Event - The Notification service will hear this and send the
            // email!
            kafkaTemplate.send(TOPIC_PAYMENT_SUCCESS, String.valueOf(auctionId), event);

        } catch (Exception e) {
            log.error("Payment Gateway completely down!", e);
            // In a real resilience architecture, we would throw this back to a Dead Letter
            // Queue or Retry Topic.
        }
    }
}
