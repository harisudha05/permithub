package com.permithub.dto.response;
import lombok.*;
import java.util.List;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStatsResponse {
    private long pendingLeaves;
    private long pendingOds;
    private long pendingOutpasses;
    private long totalMentees;
    private long approvedThisWeek;
    private long totalStudents;
    private long totalFaculty;
    private long currentlyOut;
    private long lateEntries;
    private long activeOutpasses;
    // Security: extra gate metrics
    private long exitsToday;
    private long entriesToday;
    private List<GateScanResponse> recentScans;
    private List<GateScanResponse> lateEntryAlerts;
    // Student-specific
    private Integer leaveBalance;
    private Integer usedLeaves;
}
