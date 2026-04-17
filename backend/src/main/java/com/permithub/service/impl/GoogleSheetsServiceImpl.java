package com.permithub.service.impl;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.*;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.permithub.entity.*;
import com.permithub.exception.ResourceNotFoundException;
import com.permithub.repository.*;
import com.permithub.service.GoogleSheetsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleSheetsServiceImpl implements GoogleSheetsService {

    private final StudentRepository studentRepo;
    private final OdRequestRepository odRepo;
    private final FacultyDetailsRepository facultyRepo;
    private final UserRepository userRepo;

    @Value("${google.sheets.credentials-json:}")
    private String credentialsJson;

    @Value("${google.sheets.enabled:false}")
    private boolean sheetsEnabled;

    private Sheets getSheetsService() throws Exception {
        if (!sheetsEnabled || credentialsJson == null || credentialsJson.isBlank()) {
            throw new IllegalStateException("Google Sheets integration is not configured. Set google.sheets.credentials-json in application.properties.");
        }
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8)))
                .createScoped(Collections.singletonList("https://www.googleapis.com/auth/spreadsheets"));
        return new Sheets.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("PermitHub")
                .build();
    }

    @Override
    public String exportMenteesToSheet(Long facultyUserId, List<Long> studentIds) throws Exception {
        FacultyDetails faculty = facultyRepo.findByUserId(facultyUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        String title = "Mentees - " + faculty.getUser().getName() + " - " + java.time.LocalDate.now();

        List<List<Object>> rows = new ArrayList<>();
        rows.add(Arrays.asList("S.No","Name","Register No","Roll No","Year","Section","Department","Hosteler","Hostel","Room","Parent Name","Parent Phone","Leave Balance","Created"));

        List<Student> students = studentIds.isEmpty()
                ? studentRepo.findByCurrentMentorId(faculty.getId())
                : studentRepo.findAllById(studentIds);

        int i = 1;
        for (Student s : students) {
            rows.add(Arrays.asList(
                    i++, s.getUser().getName(), s.getRegisterNumber(), s.getRollNumber(),
                    s.getYear(), s.getSection(), s.getDepartment().getName(),
                    Boolean.TRUE.equals(s.getIsHosteler()) ? "Yes" : "No",
                    s.getHostelName() != null ? s.getHostelName() : "",
                    s.getRoomNumber() != null ? s.getRoomNumber() : "",
                    s.getParentName() != null ? s.getParentName() : "",
                    s.getParentPhone() != null ? s.getParentPhone() : "",
                    "", s.getCreatedAt() != null ? s.getCreatedAt().toString() : ""
            ));
        }
        return createAndPopulateSheet(title, rows);
    }

    @Override
    public String exportClassStudentsToSheet(Long facultyUserId, List<Long> studentIds) throws Exception {
        FacultyDetails faculty = facultyRepo.findByUserId(facultyUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        String title = "Class Students - " + faculty.getAdvisorYear() + "/" + faculty.getAdvisorSection()
                + " - " + java.time.LocalDate.now();

        List<List<Object>> rows = new ArrayList<>();
        rows.add(Arrays.asList("S.No","Name","Register No","Roll No","Email","Phone","Parent Name","Parent Phone","Hosteler","Hostel","Room","Blood Group"));

        List<Student> students = studentIds.isEmpty()
                ? studentRepo.findByDepartmentIdAndYearAndSection(
                        faculty.getAdvisorDepartment() != null ? faculty.getAdvisorDepartment().getId() : 0L,
                        faculty.getAdvisorYear(), faculty.getAdvisorSection())
                : studentRepo.findAllById(studentIds);

        int i = 1;
        for (Student s : students) {
            rows.add(Arrays.asList(
                    i++, s.getUser().getName(), s.getRegisterNumber(), s.getRollNumber(),
                    s.getUser().getEmail(), s.getUser().getPhone() != null ? s.getUser().getPhone() : "",
                    s.getParentName() != null ? s.getParentName() : "",
                    s.getParentPhone() != null ? s.getParentPhone() : "",
                    Boolean.TRUE.equals(s.getIsHosteler()) ? "Yes" : "No",
                    s.getHostelName() != null ? s.getHostelName() : "",
                    s.getRoomNumber() != null ? s.getRoomNumber() : "",
                    s.getBloodGroup() != null ? s.getBloodGroup() : ""
            ));
        }
        return createAndPopulateSheet(title, rows);
    }

    @Override
    public String exportEventParticipantsToSheet(Long facultyUserId, List<Long> odRequestIds) throws Exception {
        String title = "Event Participants - " + java.time.LocalDate.now();

        List<List<Object>> rows = new ArrayList<>();
        rows.add(Arrays.asList("S.No","Student Name","Register No","Dept","Year","Sec","Event","Organizer","From","To","Days","Status","Mentor Status","Coordinator Status","Advisor Status","HOD Status"));

        List<com.permithub.entity.OdRequest> ods = odRequestIds.isEmpty()
                ? odRepo.findByCoordinatorIdAndCoordinatorStatus(
                        facultyRepo.findByUserId(facultyUserId).map(FacultyDetails::getId).orElse(0L),
                        com.permithub.enums.ApprovalStatus.PENDING)
                : odRepo.findAllById(odRequestIds);

        int i = 1;
        for (com.permithub.entity.OdRequest o : ods) {
            Student s = o.getStudent();
            rows.add(Arrays.asList(
                    i++, s.getUser().getName(), s.getRegisterNumber(), s.getDepartment().getName(),
                    s.getYear(), s.getSection(),
                    o.getEventName(), o.getOrganizer() != null ? o.getOrganizer() : "",
                    o.getFromDate().toString(), o.getToDate().toString(), o.getTotalDays(),
                    o.getStatus() != null ? o.getStatus().name() : "",
                    o.getMentorStatus() != null ? o.getMentorStatus().name() : "",
                    o.getCoordinatorStatus() != null ? o.getCoordinatorStatus().name() : "",
                    o.getAdvisorStatus() != null ? o.getAdvisorStatus().name() : "",
                    o.getHodStatus() != null ? o.getHodStatus().name() : ""
            ));
        }
        return createAndPopulateSheet(title, rows);
    }

    private String createAndPopulateSheet(String title, List<List<Object>> rows) throws Exception {
        Sheets service = getSheetsService();

        // Create spreadsheet
        Spreadsheet spreadsheet = new Spreadsheet()
                .setProperties(new SpreadsheetProperties().setTitle(title));
        Spreadsheet created = service.spreadsheets().create(spreadsheet).execute();
        String spreadsheetId = created.getSpreadsheetId();

        // Write data
        ValueRange body = new ValueRange().setValues(
                rows.stream().map(r -> (List<Object>) r).collect(Collectors.toList()));
        service.spreadsheets().values()
                .update(spreadsheetId, "Sheet1!A1", body)
                .setValueInputOption("RAW")
                .execute();

        // Bold header row
        List<Request> requests = new ArrayList<>();
        requests.add(new Request().setRepeatCell(new RepeatCellRequest()
                .setRange(new GridRange().setSheetId(0).setStartRowIndex(0).setEndRowIndex(1))
                .setCell(new CellData().setUserEnteredFormat(new CellFormat()
                        .setTextFormat(new TextFormat().setBold(true))
                        .setBackgroundColor(new Color().setRed(0.2f).setGreen(0.4f).setBlue(0.8f))
                        .setHorizontalAlignment("CENTER")))
                .setFields("userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)")));

        requests.add(new Request().setAutoResizeDimensions(new AutoResizeDimensionsRequest()
                .setDimensions(new DimensionRange().setSheetId(0)
                        .setDimension("COLUMNS").setStartIndex(0).setEndIndex(20))));

        service.spreadsheets().batchUpdate(spreadsheetId,
                new BatchUpdateSpreadsheetRequest().setRequests(requests)).execute();

        return "https://docs.google.com/spreadsheets/d/" + spreadsheetId;
    }
}
