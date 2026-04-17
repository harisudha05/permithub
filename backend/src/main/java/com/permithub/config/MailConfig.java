package com.permithub.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Mail configuration that does NOT fail on startup if SMTP credentials are wrong.
 * The EmailServiceImpl handles send failures gracefully and logs the reset link.
 */
@Configuration
@Slf4j
public class MailConfig {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${app.mail.from:noreply@permithub.edu}")
    private String fromAddress;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);

        boolean configured = username != null && !username.isBlank()
                && !username.equals("your_gmail@gmail.com")
                && password != null && !password.isBlank()
                && !password.equals("your_16char_app_password");

        if (configured) {
            sender.setUsername(username);
            sender.setPassword(password);
            log.info("✅ Mail configured: {}:{} as {}", host, port, username);
        } else {
            log.warn("⚠️  Mail NOT configured. Password reset links will be logged to console.");
            log.warn("   To enable email: set spring.mail.username and spring.mail.password in application.properties");
        }

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");
        // Disable connection test on startup
        props.put("mail.smtp.ssl.trust", host);

        return sender;
    }
}
