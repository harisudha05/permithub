package com.permithub.service;

public interface QrCodeService {
    String generateQrCode(Long outpassId);
    boolean validateQrCode(String qrData);
}
