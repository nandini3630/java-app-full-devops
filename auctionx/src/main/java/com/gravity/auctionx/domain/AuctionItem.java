package com.gravity.auctionx.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private BigDecimal startingPrice;

    @Column(nullable = false)
    private BigDecimal currentHighestBid;

    // VERY IMPORTANT FOR CONCURRENCY: Optimistic Locking feature.
    // If multiple threads try to update the highest bid simultaneously, 
    // the database will reject the stale one because the version won't match.
    @Version
    private Long version;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AuctionStatus status;

    public enum AuctionStatus {
        ACTIVE, ENDED, CANCELLED
    }
}
