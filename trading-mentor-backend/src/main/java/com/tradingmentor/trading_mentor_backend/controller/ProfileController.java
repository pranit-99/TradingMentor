package com.tradingmentor.trading_mentor_backend.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tradingmentor.trading_mentor_backend.dto.UserProfileResponse;
import com.tradingmentor.trading_mentor_backend.model.AccountMaster;
import com.tradingmentor.trading_mentor_backend.model.UserRecord;
import com.tradingmentor.trading_mentor_backend.repository.AccountMasterRepository;
import com.tradingmentor.trading_mentor_backend.repository.UserRecordRepository;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    private final UserRecordRepository userRecordRepository;
    private final AccountMasterRepository accountMasterRepository;

    public ProfileController(UserRecordRepository userRecordRepository,
                             AccountMasterRepository accountMasterRepository) {
        this.userRecordRepository = userRecordRepository;
        this.accountMasterRepository = accountMasterRepository;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {

        Optional<UserRecord> userOpt = userRecordRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UserRecord user = userOpt.get();
        Optional<AccountMaster> accOpt = accountMasterRepository.findByUserId(userId);

        UserProfileResponse dto = new UserProfileResponse();
        dto.setUserId(userId); 
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setAge(user.getAge());
        dto.setBirthdate(user.getBirthdate());
        dto.setCreatedAt(user.getCreatedAt());

        if (accOpt.isPresent()) {
            AccountMaster acc = accOpt.get();
            dto.setAccountId(acc.getAccountId());
            dto.setAccountNumber(acc.getAccountNumber());
            dto.setPhone(acc.getPhone());
            dto.setAddressLine1(acc.getAddressLine1());
            dto.setCity(acc.getCity());
            dto.setState(acc.getState());
            dto.setCountry(acc.getCountry());
            dto.setZipCode(acc.getZip());
            dto.setJobTitle(acc.getJobTitle());
            dto.setIncomeRange(acc.getIncomeRange());
            dto.setCashBalance(acc.getCashBalance());
            dto.setReservedCash(acc.getReservedCash());
        }

        return ResponseEntity.ok(dto);
    }
}
