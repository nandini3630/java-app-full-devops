package com.gravity.auctionx.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class BidResponse {
    private Long auctionItemId;
    private String username;
    private BigDecimal bidAmount;
    private LocalDateTime bidTime;
    private String status;
}
