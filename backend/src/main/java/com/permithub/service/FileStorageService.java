package com.permithub.service;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(MultipartFile file, String folder);
    byte[] loadFile(String filename);
    void deleteFile(String filename);
    byte[] generateStudentExcelTemplate();
    byte[] generateFacultyExcelTemplate();
}
