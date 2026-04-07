package com.gravity.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    /**
     * Listens to the Payment Service.
     * We ONLY send the "You Won!" email IF the credit card was charged successfully.
     */
    @KafkaListener(topics = "payment-successful", groupId = "notification-processing-group")
    public void handlePaymentSuccess(Map<String, Object> event) {
        log.info("RECEIVED EVENT: Payment Successful! Sending Confirmation Email: {}", event);

        String email = event.get("winningUserEmail").toString();
        String username = event.get("winningUsername").toString();
        String amount = event.get("winningBidAmount").toString();
        String itemId = event.get("auctionItemId").toString();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@auctionx.gravity");
            helper.setTo(email);
            helper.setSubject("🎉 You won Auction #" + itemId + "!");

            // Pure HTML production email template
            String htmlContent = "<h1>Congratulations, " + username + "!</h1>"
                    + "<p>You are the highest bidder for Auction Item #" + itemId + ".</p>"
                    + "<p>We have successfully charged your card for <strong>$" + amount + "</strong>.</p>"
                    + "<br><p>Thank you for using AuctionX.</p>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email successfully sent to {}", email);

        } catch (Exception e) {
            log.error("Failed to send email to {}", email, e);
        }
    }
}
