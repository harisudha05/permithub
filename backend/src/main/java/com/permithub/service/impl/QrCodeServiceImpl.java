package com.permithub.service.impl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.permithub.service.QrCodeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class QrCodeServiceImpl implements QrCodeService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public String generateQrCode(Long outpassId) {
        try {
            // Store ONLY the payload in DB (short string).
            // Frontend renders it as a payment-style QR/barcode image.
            String data = "PERMITHUB:OUTPASS:" + outpassId + ":" + System.currentTimeMillis();
            QRCodeWriter writer = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix matrix = writer.encode(data, BarcodeFormat.QR_CODE, 300, 300, hints);

            Path qrPath = Paths.get(uploadDir, "qrcodes");
            Files.createDirectories(qrPath);
            String filename = "outpass_" + outpassId + ".png";
            MatrixToImageWriter.writeToPath(matrix, "PNG", qrPath.resolve(filename));

            return data;
        } catch (Exception e) {
            log.error("QR generation failed for outpass {}: {}", outpassId, e.getMessage());
            return null;
        }
    }

    @Override
    public boolean validateQrCode(String qrData) {
        return qrData != null && qrData.startsWith("PERMITHUB:OUTPASS:");
    }
}
