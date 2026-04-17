package com.permithub.dto.request;
import lombok.Data;
import java.util.List;

@Data
public class MentorAssignRequest {
    public Long mentorFacultyId;
    public List<Long> studentIds;
}
