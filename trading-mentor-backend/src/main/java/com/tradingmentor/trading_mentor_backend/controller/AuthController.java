package com.tradingmentor.trading_mentor_backend.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;  // you already have this
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tradingmentor.trading_mentor_backend.dto.ForgotPasswordRequest;
import com.tradingmentor.trading_mentor_backend.dto.LoginRequest;
import com.tradingmentor.trading_mentor_backend.dto.SignupRequest;
import com.tradingmentor.trading_mentor_backend.model.UserRecord;
import com.tradingmentor.trading_mentor_backend.repository.UserRecordRepository;

/**
 * AuthController
 *
 * Handles:
 * - Signup  -> POST /api/auth/signup
 * - Login   -> POST /api/auth/login
 * - Forgot password -> POST /api/auth/forgot-password
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRecordRepository userRecordRepository;

    public AuthController(UserRecordRepository userRecordRepository) {
        this.userRecordRepository = userRecordRepository;
    }

    // ===================== SIGNUP (you already had this) =====================
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (userRecordRepository.existsByEmailIgnoreCase(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered.");
        }

        UserRecord user = new UserRecord();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // NOTE: plain text for now (OK for learning only)
        user.setAge(request.getAge());
        user.setBirthdate(request.getBirthdate());

        userRecordRepository.save(user);

        return ResponseEntity.ok("User registered successfully.");
    }

    // ===================== LOGIN =====================

    /**
     * POST /api/auth/login
     *
     * Request body:
     * {
     *   "email": "you@example.com",
     *   "password": "xyz"
     * }
     *
     * If email + password match -> return basic user info.
     * Else -> return 400 with "Invalid email or password".
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        // 1) Find user by email
        Optional<UserRecord> userOpt =
                userRecordRepository.findByEmailIgnoreCase(request.getEmail());

        if (userOpt.isEmpty()) {
            // for security we don't say "email not found", just generic error
            return ResponseEntity.badRequest().body("Invalid email or password.");
        }

        UserRecord user = userOpt.get();

        // 2) Compare password (plain string comparison in this simple project)
        if (!user.getPassword().equals(request.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid email or password.");
        }

        // 3) Build a simple response object (without password)
        // You can create a DTO, but here we use anonymous object for simplicity.
        var responseBody = new Object() {
            public final Long userId = user.getId();
            public final String firstName = user.getFirstName();
            public final String lastName = user.getLastName();
            public final String email = user.getEmail();
        };

        return ResponseEntity.ok(responseBody);
    }

    // ===================== FORGOT PASSWORD =====================

    /**
     * POST /api/auth/forgot-password
     *
     * Request body:
     * {
     *   "email": "you@example.com",
     *   "newPassword": "newpass123"
     * }
     *
     * If user exists -> update password in DB.
     * Else -> 400 with error message.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {

        Optional<UserRecord> userOpt =
                userRecordRepository.findByEmailIgnoreCase(request.getEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("No account found with that email.");
        }

        UserRecord user = userOpt.get();
        user.setPassword(request.getNewPassword());  // plain text for now
        userRecordRepository.save(user);

        return ResponseEntity.ok("Password updated successfully.");
    }
}
