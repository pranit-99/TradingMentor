package com.tradingmentor.trading_mentor_backend.dto;

/**
 * Request body for "forgot password".
 * Simple version: user enters email + newPassword.
 * (No email OTP / token – good enough for learning project.)
 */
public class ForgotPasswordRequest {

    private String email;
    private String newPassword;

    public ForgotPasswordRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}

