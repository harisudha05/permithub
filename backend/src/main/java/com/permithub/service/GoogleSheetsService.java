package com.permithub.service;

import java.util.List;

public interface GoogleSheetsService {
    /** Export mentees of a faculty mentor to Google Sheets. Returns the sheet URL. */
    String exportMenteesToSheet(Long facultyUserId, List<Long> studentIds) throws Exception;

    /** Export class students (advisor's class) to Google Sheets. Returns the sheet URL. */
    String exportClassStudentsToSheet(Long facultyUserId, List<Long> studentIds) throws Exception;

    /** Export event participants (OD applicants for an event) to Google Sheets. Returns the sheet URL. */
    String exportEventParticipantsToSheet(Long facultyUserId, List<Long> odRequestIds) throws Exception;
}
