package com.gravity.auctionx.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class AuctionCompletedEvent {
    private Long auctionItemId;
    private Long winningUserId;
    private String winningUsername;
    private String winningUserEmail;
    private BigDecimal winningBidAmount;
}
