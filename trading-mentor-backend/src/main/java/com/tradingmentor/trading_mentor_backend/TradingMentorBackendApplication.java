package com.tradingmentor.trading_mentor_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TradingMentorBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(TradingMentorBackendApplication.class, args);
	}

}
