package com.permithub.repository;

import com.permithub.entity.User;
import com.permithub.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByDepartmentIdAndRole(Long departmentId, Role role);
    Optional<User> findByPasswordResetToken(String token);
}
