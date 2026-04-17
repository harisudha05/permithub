package com.permithub.util;

import com.permithub.entity.LeaveRequest;
import com.permithub.entity.OdRequest;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayOutputStream;
import java.util.List;

public class ExcelUtil {

    public byte[] generateLeaveReport(List<LeaveRequest> leaves) throws Exception {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Leave Report");
            String[] headers = {"ID","Student","Reg No","Dept","Year","Section","Category","From","To","Days","Reason","Emergency","Status","Mentor","Advisor","HOD","Rejected By","Created"};
            Row headerRow = sheet.createRow(0);
            CellStyle bold = wb.createCellStyle();
            Font f = wb.createFont(); f.setBold(true); bold.setFont(f);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(bold);
            }
            int rowNum = 1;
            for (LeaveRequest l : leaves) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(l.getId());
                row.createCell(1).setCellValue(l.getStudent().getUser().getName());
                row.createCell(2).setCellValue(l.getStudent().getRegisterNumber());
                row.createCell(3).setCellValue(l.getStudent().getDepartment().getName());
                row.createCell(4).setCellValue(l.getStudent().getYear());
                row.createCell(5).setCellValue(l.getStudent().getSection());
                row.createCell(6).setCellValue(l.getCategory() != null ? l.getCategory().name() : "");
                row.createCell(7).setCellValue(l.getFromDate().toString());
                row.createCell(8).setCellValue(l.getToDate().toString());
                row.createCell(9).setCellValue(l.getTotalDays());
                row.createCell(10).setCellValue(l.getReason());
                row.createCell(11).setCellValue(Boolean.TRUE.equals(l.getIsEmergency()) ? "Yes" : "No");
                row.createCell(12).setCellValue(l.getStatus() != null ? l.getStatus().name() : "");
                row.createCell(13).setCellValue(l.getMentor() != null ? l.getMentor().getUser().getName() : "");
                row.createCell(14).setCellValue(l.getAdvisor() != null ? l.getAdvisor().getUser().getName() : "");
                row.createCell(15).setCellValue(l.getHod() != null ? l.getHod().getName() : "");
                row.createCell(16).setCellValue(l.getRejectedBy() != null ? l.getRejectedBy() : "");
                row.createCell(17).setCellValue(l.getCreatedAt() != null ? l.getCreatedAt().toString() : "");
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateOdReport(List<OdRequest> ods) throws Exception {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("OD Report");
            String[] headers = {"ID","Student","Reg No","Dept","Event","Organizer","From","To","Days","Status","Mentor Status","Coordinator Status","Advisor Status","HOD Status","Created"};
            Row headerRow = sheet.createRow(0);
            CellStyle bold = wb.createCellStyle();
            Font f = wb.createFont(); f.setBold(true); bold.setFont(f);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(bold);
            }
            int rowNum = 1;
            for (OdRequest o : ods) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(o.getId());
                row.createCell(1).setCellValue(o.getStudent().getUser().getName());
                row.createCell(2).setCellValue(o.getStudent().getRegisterNumber());
                row.createCell(3).setCellValue(o.getStudent().getDepartment().getName());
                row.createCell(4).setCellValue(o.getEventName());
                row.createCell(5).setCellValue(o.getOrganizer() != null ? o.getOrganizer() : "");
                row.createCell(6).setCellValue(o.getFromDate().toString());
                row.createCell(7).setCellValue(o.getToDate().toString());
                row.createCell(8).setCellValue(o.getTotalDays());
                row.createCell(9).setCellValue(o.getStatus() != null ? o.getStatus().name() : "");
                row.createCell(10).setCellValue(o.getMentorStatus() != null ? o.getMentorStatus().name() : "");
                row.createCell(11).setCellValue(o.getCoordinatorStatus() != null ? o.getCoordinatorStatus().name() : "");
                row.createCell(12).setCellValue(o.getAdvisorStatus() != null ? o.getAdvisorStatus().name() : "");
                row.createCell(13).setCellValue(o.getHodStatus() != null ? o.getHodStatus().name() : "");
                row.createCell(14).setCellValue(o.getCreatedAt() != null ? o.getCreatedAt().toString() : "");
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        }
    }
}
