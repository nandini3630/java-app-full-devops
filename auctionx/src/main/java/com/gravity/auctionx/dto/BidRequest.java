package com.gravity.auctionx.dto;

import lombok.Data;
import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

@Data
public class BidRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Bid amount is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Bid must be greater than 0")
    private BigDecimal amount;
}
