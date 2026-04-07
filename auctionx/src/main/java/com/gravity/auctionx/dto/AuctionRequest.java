package com.gravity.auctionx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionRequest {
    private String title;
    private String description;
    private BigDecimal startingPrice;
    private LocalDateTime endTime;
}
