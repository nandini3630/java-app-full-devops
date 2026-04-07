package com.gravity.auctionx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync // Needed for background tasks like finalizing the auction
public class AuctionApplication {

    public static void main(String[] args) {
        // Entry point for our application
        SpringApplication.run(AuctionApplication.class, args);
    }
}
