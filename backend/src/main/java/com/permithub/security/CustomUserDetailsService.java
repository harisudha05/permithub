package com.permithub.security;

import com.permithub.entity.User;
import com.permithub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // Null-safe: treat null is_active as true (active by default)
        boolean active = Boolean.TRUE.equals(user.getIsActive()) || user.getIsActive() == null;

        return new org.springframework.security.core.userdetails.User(
            user.getEmail(),
            user.getPassword(),
            active,
            true, true, true,
            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
