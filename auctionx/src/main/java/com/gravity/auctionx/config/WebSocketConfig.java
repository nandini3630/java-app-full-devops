package com.gravity.auctionx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // "topic" is our prefix. Anyone subscribed to /topic/auctions/1 gets updates.
        // During devops/scaling phase, we will switch from "enableSimpleBroker" to a Redis or RabbitMQ STOMP relay.
        config.enableSimpleBroker("/topic");
        
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The HTTP endpoint where clients open the WebSocket connection
        registry.addEndpoint("/ws-auction")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback for browsers that don't support true WebSockets
    }
}
