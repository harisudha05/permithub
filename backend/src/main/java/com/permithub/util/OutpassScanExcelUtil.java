package com.permithub.util;

import com.permithub.entity.GateScan;
import com.permithub.enums.ScanType;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

public class OutpassScanExcelUtil {

    public static byte[] generateOutpassScanReport(List<GateScan> scans) throws Exception {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Outpass Scan Report");

            String[] headers = {
                    "Student ID",
                    "Student Name",
                    "Student Email",
                    "Department",
                    "Phone",
                    "Parent Phone",
                    "Outpass ID",
                    "QR Payload",
                    "Exit Time",
                    "Entry Time",
                    "Entry Late",
                    "Late Minutes",
                    "Validity"
            };

            Row headerRow = sheet.createRow(0);
            CellStyle bold = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            bold.setFont(font);

            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(bold);
            }

            Map<Long, List<GateScan>> byOutpass = scans.stream()
                    .filter(s -> s.getOutpass() != null)
                    .collect(Collectors.groupingBy(s -> s.getOutpass().getId()));

            int rowNum = 1;
            for (Map.Entry<Long, List<GateScan>> e : byOutpass.entrySet()) {
                Long outpassId = e.getKey();
                List<GateScan> list = e.getValue();

                GateScan exitScan = list.stream()
                        .filter(s -> s.getScanType() == ScanType.EXIT)
                        .min(Comparator.comparing(GateScan::getScanTime, Comparator.nullsLast(Comparator.naturalOrder())))
                        .orElse(null);

                GateScan entryScan = list.stream()
                        .filter(s -> s.getScanType() == ScanType.ENTRY)
                        .min(Comparator.comparing(GateScan::getScanTime, Comparator.nullsLast(Comparator.naturalOrder())))
                        .orElse(null);

                GateScan base = exitScan != null ? exitScan : entryScan;
                if (base == null) continue;

                Long studentId = base.getStudent() != null ? base.getStudent().getId() : null;
                String studentName = base.getStudent() != null && base.getStudent().getUser() != null
                        ? base.getStudent().getUser().getName() : "";
                String email = base.getStudent() != null && base.getStudent().getUser() != null
                        ? base.getStudent().getUser().getEmail() : "";
                String dept = base.getStudent() != null && base.getStudent().getDepartment() != null
                        ? base.getStudent().getDepartment().getName() : "";
                String phone = base.getStudent() != null && base.getStudent().getUser() != null
                        ? base.getStudent().getUser().getPhone() : "";
                String parentPhone = base.getStudent() != null
                        ? base.getStudent().getParentPhone() : "";

                String qrPayload = exitScan != null ? exitScan.getQrPayload()
                        : entryScan != null ? entryScan.getQrPayload() : "";

                LocalDateTime exitTime = exitScan != null ? exitScan.getScanTime() : null;
                LocalDateTime entryTime = entryScan != null ? entryScan.getScanTime() : null;

                boolean entryLate = entryScan != null && Boolean.TRUE.equals(entryScan.getIsLate());
                Integer lateMinutes = entryScan != null && entryScan.getLateMinutes() != null ? entryScan.getLateMinutes() : 0;

                String validity;
                if (exitScan == null && entryScan == null) {
                    validity = "Invalid";
                } else if (exitScan == null) {
                    validity = "Invalid: missing EXIT";
                } else if (entryScan == null) {
                    validity = "Invalid: missing ENTRY";
                } else {
                    // Both scans exist; check order.
                    boolean orderOk = exitTime != null && entryTime != null
                            && (exitTime.isBefore(entryTime) || exitTime.isEqual(entryTime));
                    validity = orderOk ? "Valid" : "Invalid order (ENTRY before EXIT)";
                }

                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(studentId != null ? studentId : 0);
                row.createCell(1).setCellValue(studentName);
                row.createCell(2).setCellValue(email);
                row.createCell(3).setCellValue(dept);
                row.createCell(4).setCellValue(phone);
                row.createCell(5).setCellValue(parentPhone);
                row.createCell(6).setCellValue(outpassId != null ? outpassId : 0);
                row.createCell(7).setCellValue(qrPayload != null ? qrPayload : "");
                row.createCell(8).setCellValue(exitTime != null ? exitTime.toString() : "");
                row.createCell(9).setCellValue(entryTime != null ? entryTime.toString() : "");
                row.createCell(10).setCellValue(entryLate ? "Yes" : "No");
                row.createCell(11).setCellValue(lateMinutes != null ? lateMinutes : 0);
                row.createCell(12).setCellValue(validity);
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        }
    }
}

