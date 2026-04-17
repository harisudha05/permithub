package com.permithub.dto.request;
import lombok.Data;

@Data
public class FacultyUploadDto {
    public String name;
    public String email;
    public String employeeId;
    public String phone;
    public String designation;
    public boolean isMentor;
    public boolean isClassAdvisor;
    public boolean isEventCoordinator;
    public Integer advisorYear;
    public String advisorSection;
}
