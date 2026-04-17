package com.permithub.controller;

import com.permithub.dto.response.*;
import com.permithub.entity.*;
import com.permithub.enums.OutpassStatus;
import com.permithub.enums.ScanType;
import com.permithub.exception.BadRequestException;
import com.permithub.exception.ResourceNotFoundException;
import com.permithub.repository.*;
import com.permithub.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import com.permithub.util.OutpassScanExcelUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Comparator;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/security")
@RequiredArgsConstructor
public class SecurityController {

    private final UserRepository userRepo;
    private final OutpassRequestRepository outpassRepo;
    private final GateScanRepository gateScanRepo;
    private final StudentRepository studentRepo;
    private final QrCodeService qrCodeService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private User currentUser(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @PostMapping("/scan")
    public ResponseEntity<ApiResponse<GateScanResponse>> scanQr(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody Map<String, String> body) {
        String qrData = body.get("qrData");
        User security = currentUser(ud);

        if (!qrCodeService.validateQrCode(qrData))
            throw new BadRequestException("Invalid QR code");

        String[] parts = qrData.split(":");
        Long outpassId = Long.parseLong(parts[2]);

        OutpassRequest outpass = outpassRepo.findById(outpassId)
                .orElseThrow(() -> new BadRequestException("Outpass not found"));

        if (outpass.getStatus() != OutpassStatus.PRINCIPAL_APPROVED
                && outpass.getStatus() != OutpassStatus.RETURNED)
            throw new BadRequestException("Outpass not approved or already used");

        boolean exitAlreadyDone = gateScanRepo.findByOutpassIdAndScanType(outpassId, ScanType.EXIT).isPresent();
        boolean entryAlreadyDone = gateScanRepo.findByOutpassIdAndScanType(outpassId, ScanType.ENTRY).isPresent();
        if (exitAlreadyDone && entryAlreadyDone) {
            throw new BadRequestException("Outpass scan already completed");
        }

        int hour = LocalDateTime.now().getHour();
        ScanType scanType;
        if (!exitAlreadyDone && !entryAlreadyDone) {
            scanType = hour >= 17 ? ScanType.ENTRY : ScanType.EXIT;
        } else if (exitAlreadyDone) {
            scanType = ScanType.ENTRY;
        } else {
            scanType = ScanType.EXIT;
        }

        boolean isLate = false;
        int lateMinutes = 0;
        if (scanType == ScanType.ENTRY && LocalDateTime.now().isAfter(outpass.getReturnDatetime())) {
            isLate = true;
            lateMinutes = (int) java.time.Duration.between(outpass.getReturnDatetime(), LocalDateTime.now()).toMinutes();
        }

        String notes = scanType == ScanType.ENTRY && !exitAlreadyDone ? "ENTRY before EXIT"
                : scanType == ScanType.EXIT && entryAlreadyDone ? "EXIT after ENTRY" : null;

        GateScan scan = GateScan.builder()
                .outpass(outpass).student(outpass.getStudent())
                .security(security).scanType(scanType)
                .scanTime(LocalDateTime.now()).isLate(isLate).lateMinutes(lateMinutes)
                .notes(notes)
                .qrPayload(qrData)
                .build();
        gateScanRepo.save(scan);

        if (scanType == ScanType.ENTRY) {
            outpass.setStatus(OutpassStatus.RETURNED);
            outpassRepo.save(outpass);
        }

        // Persist a daily Excel report on each scan (for offline auditing/export).
        try {
            LocalDate today = LocalDate.now();
            LocalDateTime dayStart = today.atStartOfDay();
            LocalDateTime dayEnd = LocalDateTime.now();
            List<GateScan> dayScans = gateScanRepo.findAll().stream()
                    .filter(s -> s.getScanTime() != null && !s.getScanTime().isBefore(dayStart) && !s.getScanTime().isAfter(dayEnd))
                    .collect(Collectors.toList());

            byte[] excel = OutpassScanExcelUtil.generateOutpassScanReport(dayScans);
            Path dir = Paths.get(uploadDir, "security-excel");
            Files.createDirectories(dir);
            String filename = "outpass_gate_scans_" + today + ".xlsx";
            Files.write(dir.resolve(filename), excel);
        } catch (Exception e) {
            // Do not block scanning if Excel writing fails.
        }

        boolean valid = true;
        String validationMessage = "Scan recorded successfully";
        if (scanType == ScanType.ENTRY && !exitAlreadyDone) {
            valid = false;
            validationMessage = "ENTRY recorded before EXIT";
        } else if (scanType == ScanType.EXIT && entryAlreadyDone) {
            valid = false;
            validationMessage = "EXIT recorded after ENTRY";
        }

        GateScanResponse resp = GateScanResponse.builder()
                .id(scan.getId()).outpassId(outpassId)
                .studentName(outpass.getStudent().getUser().getName())
                .registerNumber(outpass.getStudent().getRegisterNumber())
                .department(outpass.getStudent().getDepartment().getName())
                .scanType(scanType).scanTime(scan.getScanTime())
                .isLate(isLate).lateMinutes(lateMinutes)
                .destination(outpass.getDestination())
                .returnDatetime(outpass.getReturnDatetime())
                .valid(valid).validationMessage(validationMessage).build();
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @GetMapping("/scans")
    public ResponseEntity<ApiResponse<List<GateScanResponse>>> allScans(@AuthenticationPrincipal UserDetails ud) {
        List<GateScanResponse> scans = gateScanRepo.findAll().stream().map(s ->
                GateScanResponse.builder()
                        .id(s.getId()).outpassId(s.getOutpass().getId())
                        .studentName(s.getStudent().getUser().getName())
                        .registerNumber(s.getStudent().getRegisterNumber())
                        .department(s.getStudent().getDepartment().getName())
                        .scanType(s.getScanType()).scanTime(s.getScanTime())
                        .isLate(s.getIsLate()).lateMinutes(s.getLateMinutes())
                        .destination(s.getOutpass().getDestination())
                        .returnDatetime(s.getOutpass().getReturnDatetime())
                        .valid(true).build()
        ).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(scans));
    }

    @GetMapping("/late-entries")
    public ResponseEntity<ApiResponse<List<GateScanResponse>>> lateEntries() {
        List<GateScanResponse> list = gateScanRepo.findByIsLateTrue().stream().map(s ->
                GateScanResponse.builder()
                        .id(s.getId()).studentName(s.getStudent().getUser().getName())
                        .registerNumber(s.getStudent().getRegisterNumber())
                        .scanType(s.getScanType()).scanTime(s.getScanTime())
                        .isLate(true).lateMinutes(s.getLateMinutes())
                        .destination(s.getOutpass().getDestination()).build()
        ).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Scan history with optional filters.
     * Query params:
     * - from, to: YYYY-MM-DD (optional)
     * - scanType: EXIT | ENTRY (optional)
     */
    @GetMapping("/scans/history")
    public ResponseEntity<ApiResponse<List<GateScanResponse>>> scanHistory(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String scanType) {

        LocalDateTime start = from != null ? LocalDate.parse(from).atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = to != null ? LocalDate.parse(to).atTime(23, 59, 59) : LocalDateTime.now();

        ScanType type = scanType != null ? ScanType.valueOf(scanType) : null;

        List<GateScan> filtered = gateScanRepo.findAll().stream()
                .filter(s -> s.getScanTime() != null && !s.getScanTime().isBefore(start) && !s.getScanTime().isAfter(end))
                .filter(s -> type == null || s.getScanType() == type)
                .collect(Collectors.toList());

        // Group by outpass to compute validity (missing EXIT/ENTRY)
        Map<Long, List<GateScan>> byOutpass = filtered.stream()
                .filter(s -> s.getOutpass() != null)
                .collect(Collectors.groupingBy(s -> s.getOutpass().getId()));

        ArrayList<GateScanResponse> result = new ArrayList<>();
        for (List<GateScan> group : byOutpass.values()) {
            GateScan exitScan = group.stream().filter(s -> s.getScanType() == ScanType.EXIT).min(Comparator.comparing(GateScan::getScanTime, Comparator.nullsLast(Comparator.naturalOrder()))).orElse(null);
            GateScan entryScan = group.stream().filter(s -> s.getScanType() == ScanType.ENTRY).min(Comparator.comparing(GateScan::getScanTime, Comparator.nullsLast(Comparator.naturalOrder()))).orElse(null);

            for (GateScan s : group) {
                boolean valid = false;
                String msg;
                if (s.getScanType() == ScanType.EXIT) {
                    valid = entryScan != null;
                    msg = valid ? "Valid" : "ENTRY missing";
                } else {
                    valid = exitScan != null;
                    msg = valid ? "Valid" : "EXIT missing";
                }

                if (exitScan != null && entryScan != null && s.getScanType() == ScanType.EXIT) {
                    boolean orderOk = exitScan.getScanTime() != null && entryScan.getScanTime() != null
                            && (exitScan.getScanTime().isBefore(entryScan.getScanTime()) || exitScan.getScanTime().isEqual(entryScan.getScanTime()));
                    valid = orderOk;
                    msg = valid ? "Valid" : "Invalid order (EXIT after ENTRY)";
                }
                if (exitScan != null && entryScan != null && s.getScanType() == ScanType.ENTRY) {
                    boolean orderOk = exitScan.getScanTime() != null && entryScan.getScanTime() != null
                            && (exitScan.getScanTime().isBefore(entryScan.getScanTime()) || exitScan.getScanTime().isEqual(entryScan.getScanTime()));
                    valid = orderOk;
                    msg = valid ? "Valid" : "Invalid order (ENTRY before EXIT)";
                }

                result.add(GateScanResponse.builder()
                        .id(s.getId()).outpassId(s.getOutpass().getId())
                        .studentName(s.getStudent().getUser().getName())
                        .registerNumber(s.getStudent().getRegisterNumber())
                        .department(s.getStudent().getDepartment().getName())
                        .scanType(s.getScanType()).scanTime(s.getScanTime())
                        .isLate(Boolean.TRUE.equals(s.getIsLate()))
                        .lateMinutes(s.getLateMinutes())
                        .destination(s.getOutpass().getDestination())
                        .returnDatetime(s.getOutpass().getReturnDatetime())
                        .valid(valid).validationMessage(msg)
                        .build());
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(
                result.stream().sorted((a, b) -> b.getScanTime().compareTo(a.getScanTime())).collect(Collectors.toList())
        ));
    }

    /**
     * Export scan logs to Excel (Outpass gate scans).
     */
    @GetMapping("/scans/export-excel")
    public ResponseEntity<byte[]> exportScansExcel(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String scanType) throws Exception {

        LocalDateTime start = from != null ? LocalDate.parse(from).atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = to != null ? LocalDate.parse(to).atTime(23, 59, 59) : LocalDateTime.now();
        ScanType type = scanType != null ? ScanType.valueOf(scanType) : null;

        List<GateScan> filtered = gateScanRepo.findAll().stream()
                .filter(s -> s.getScanTime() != null && !s.getScanTime().isBefore(start) && !s.getScanTime().isAfter(end))
                .filter(s -> type == null || s.getScanType() == type)
                .collect(Collectors.toList());

        byte[] data = OutpassScanExcelUtil.generateOutpassScanReport(filtered);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=outpass_gate_scans.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> dashboard() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = LocalDateTime.now();

        List<GateScan> allScans = gateScanRepo.findAll();
        List<GateScan> todayScans = allScans.stream()
                .filter(s -> s.getScanTime() != null && !s.getScanTime().isBefore(start) && !s.getScanTime().isAfter(end))
                .collect(Collectors.toList());

        long totalScansToday = todayScans.size();
        long exitsToday = todayScans.stream().filter(s -> s.getScanType() == ScanType.EXIT).count();
        long entriesToday = todayScans.stream().filter(s -> s.getScanType() == ScanType.ENTRY).count();
        long lateEntries = todayScans.stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsLate()) && s.getScanType() == ScanType.ENTRY)
                .count();

        // Currently-out students: EXIT exists but ENTRY does not (ever)
        Map<Long, Boolean> exitExists = allScans.stream()
                .filter(s -> s.getScanType() == ScanType.EXIT)
                .collect(Collectors.toMap(
                        s -> s.getOutpass().getId(),
                        s -> Boolean.TRUE,
                        (a, b) -> Boolean.TRUE
                ));
        Map<Long, Boolean> entryExists = allScans.stream()
                .filter(s -> s.getScanType() == ScanType.ENTRY)
                .collect(Collectors.toMap(
                        s -> s.getOutpass().getId(),
                        s -> Boolean.TRUE,
                        (a, b) -> Boolean.TRUE
                ));

        HashSet<Long> currentlyOutOutpassIds = new HashSet<>();
        for (Long outpassId : exitExists.keySet()) {
            if (!entryExists.containsKey(outpassId)) currentlyOutOutpassIds.add(outpassId);
        }

        long currentlyOutStudents = currentlyOutOutpassIds.stream()
                .map(outpassId -> allScans.stream()
                        .filter(s -> s.getOutpass().getId().equals(outpassId) && s.getScanType() == ScanType.EXIT)
                        .findFirst()
                        .map(s -> s.getStudent().getId())
                        .orElse(null))
                .filter(x -> x != null)
                .distinct()
                .count();

        // Recent scans (today)
        List<GateScan> recent = todayScans.stream()
                .sorted((a, b) -> b.getScanTime().compareTo(a.getScanTime()))
                .limit(5)
                .collect(Collectors.toList());

        // Late entry alerts (today)
        List<GateScan> lateAlerts = todayScans.stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsLate()) && s.getScanType() == ScanType.ENTRY)
                .sorted((a, b) -> b.getScanTime().compareTo(a.getScanTime()))
                .limit(5)
                .collect(Collectors.toList());

        // Precompute outpass has-exit/entry for validity
        Map<Long, Boolean> hasExit = allScans.stream()
                .collect(Collectors.toMap(
                        s -> s.getOutpass().getId(),
                        s -> s.getScanType() == ScanType.EXIT,
                        (a, b) -> a || b
                ));
        Map<Long, Boolean> hasEntry = allScans.stream()
                .collect(Collectors.toMap(
                        s -> s.getOutpass().getId(),
                        s -> s.getScanType() == ScanType.ENTRY,
                        (a, b) -> a || b
                ));

        ArrayList<GateScanResponse> recentResponses = new ArrayList<>();
        for (GateScan s : recent) {
            boolean valid = (s.getScanType() == ScanType.EXIT) ? hasEntry.getOrDefault(s.getOutpass().getId(), false)
                    : hasExit.getOrDefault(s.getOutpass().getId(), false);
            String msg = valid ? "Valid" :
                    (s.getScanType() == ScanType.EXIT ? "ENTRY pending" : "EXIT missing");
            recentResponses.add(GateScanResponse.builder()
                    .id(s.getId()).outpassId(s.getOutpass().getId())
                    .studentName(s.getStudent().getUser().getName())
                    .registerNumber(s.getStudent().getRegisterNumber())
                    .department(s.getStudent().getDepartment().getName())
                    .scanType(s.getScanType()).scanTime(s.getScanTime())
                    .isLate(s.getIsLate()).lateMinutes(s.getLateMinutes())
                    .destination(s.getOutpass().getDestination())
                    .returnDatetime(s.getOutpass().getReturnDatetime())
                    .valid(valid).validationMessage(msg)
                    .build());
        }

        ArrayList<GateScanResponse> lateResponses = new ArrayList<>();
        for (GateScan s : lateAlerts) {
            boolean valid = hasExit.getOrDefault(s.getOutpass().getId(), false);
            String msg = valid ? "Valid" : "EXIT missing";
            lateResponses.add(GateScanResponse.builder()
                    .id(s.getId()).outpassId(s.getOutpass().getId())
                    .studentName(s.getStudent().getUser().getName())
                    .registerNumber(s.getStudent().getRegisterNumber())
                    .department(s.getStudent().getDepartment().getName())
                    .scanType(s.getScanType()).scanTime(s.getScanTime())
                    .isLate(true).lateMinutes(s.getLateMinutes())
                    .destination(s.getOutpass().getDestination())
                    .returnDatetime(s.getOutpass().getReturnDatetime())
                    .valid(valid).validationMessage(msg)
                    .build());
        }

        return ResponseEntity.ok(ApiResponse.ok(DashboardStatsResponse.builder()
                .activeOutpasses(totalScansToday)
                .lateEntries(lateEntries)
                .currentlyOut(currentlyOutStudents)
                .exitsToday(exitsToday)
                .entriesToday(entriesToday)
                .recentScans(recentResponses)
                .lateEntryAlerts(lateResponses)
                .build()));
    }
}
