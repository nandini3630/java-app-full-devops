package com.gravity.auctionx.controller;

import com.gravity.auctionx.domain.User;
import com.gravity.auctionx.dto.UserRegistrationRequest;
import com.gravity.auctionx.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For local development with Next.js
public class UserController {

    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody UserRegistrationRequest request) {
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .build();
        return ResponseEntity.ok(userRepository.save(user));
    }
}
