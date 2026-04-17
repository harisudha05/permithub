package com.permithub.dto.request;
import lombok.Data;

@Data
public class StudentUploadDto {
    public String name;
    public String email;
    public String registerNumber;
    public String rollNumber;
    public Integer year;
    public String section;
    public String phone;
    public boolean isHosteler;
    public String hostelName;
    public String roomNumber;
    public String parentName;
    public String parentPhone;
    public String parentEmail;
    public String parentWhatsapp;
    public String bloodGroup;
    public String dob;
}
