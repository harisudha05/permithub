package com.permithub.service.impl;

import com.permithub.exception.BadRequestException;
import com.permithub.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public String storeFile(MultipartFile file, String folder) {
        try {
            Path dir = Paths.get(uploadDir, folder);
            Files.createDirectories(dir);
            String ext = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + "." + ext;
            Files.copy(file.getInputStream(), dir.resolve(filename));
            return folder + "/" + filename;
        } catch (IOException e) {
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }
    }

    @Override
    public byte[] loadFile(String filename) {
        try {
            return Files.readAllBytes(Paths.get(uploadDir, filename));
        } catch (IOException e) {
            throw new BadRequestException("File not found: " + filename);
        }
    }

    @Override
    public void deleteFile(String filename) {
        try {
            Files.deleteIfExists(Paths.get(uploadDir, filename));
        } catch (IOException e) {
            log.warn("Could not delete file: {}", filename);
        }
    }

    @Override
    public byte[] generateStudentExcelTemplate() {
        String[] headers = {"Name","Email","Register Number","Roll Number","Year","Section",
                "Phone","Is Hosteler (true/false)","Hostel Name","Room Number",
                "Parent Name","Parent Phone","Parent Email","Parent WhatsApp","Blood Group","DOB (YYYY-MM-DD)"};
        return generateTemplate("Students", headers);
    }

    @Override
    public byte[] generateFacultyExcelTemplate() {
        String[] headers = {"Name","Email","Employee ID","Phone","Designation",
                "Is Mentor (true/false)","Is Class Advisor (true/false)","Is Event Coordinator (true/false)",
                "Advisor Year","Advisor Section"};
        return generateTemplate("Faculty", headers);
    }

    private byte[] generateTemplate(String sheetName, String[] headers) {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet(sheetName);
            Row row = sheet.createRow(0);
            CellStyle style = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            style.setFont(font);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = row.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(style);
                sheet.autoSizeColumn(i);
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate template");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
