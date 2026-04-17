package com.permithub.repository;

import com.permithub.entity.GateScan;
import com.permithub.enums.ScanType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GateScanRepository extends JpaRepository<GateScan, Long> {
    List<GateScan> findByOutpassIdOrderByScanTimeDesc(Long outpassId);
    Optional<GateScan> findByOutpassIdAndScanType(Long outpassId, ScanType scanType);
    List<GateScan> findByStudentIdOrderByScanTimeDesc(Long studentId);
    List<GateScan> findByIsLateTrue();
}
