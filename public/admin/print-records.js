// Print Records Script
let currentReportData = null;

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadCoursesForPrint();
    setupEventListeners();
});

// Load courses for print filter
async function loadCoursesForPrint() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const courseSelect = document.getElementById('printCourse');

            // Clear existing options except the first one
            while (courseSelect.children.length > 1) courseSelect.removeChild(courseSelect.lastChild);

            // Add course options
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Show/hide custom date range
    document.getElementById('printDateRange').addEventListener('change', function () {
        const customRange = document.getElementById('customDateRange');
        customRange.style.display = this.value === 'custom' ? 'block' : 'none';
    });
}

// Clear all filters
function clearFilters() {
    document.getElementById('printCourse').value = '';
    document.getElementById('printStatus').value = '';
    document.getElementById('printTerm').value = '';
    document.getElementById('printDateRange').value = 'all';
    document.getElementById('customDateRange').style.display = 'none';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.querySelector('input[name="printFormat"][value="list"]').checked = true;

    // Reset preview
    document.getElementById('reportPreview').innerHTML = `
        <div class="empty-preview">
            <i class="fas fa-print"></i>
            <p>Configure filters and generate a report to see preview</p>
        </div>
    `;
    document.getElementById('previewStats').style.display = 'none';
    document.getElementById('printBtn').disabled = true;
    currentReportData = null;
}

// Generate report
async function generateReport() {
    try {
        const token = localStorage.getItem('admin_token');

        // Build query parameters
        const courseId = document.getElementById('printCourse').value;
        const status = document.getElementById('printStatus').value;
        const dateRange = document.getElementById('printDateRange').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const printFormat = document.querySelector('input[name="printFormat"]:checked').value;

        let url = `${API_BASE_URL}/${currentCampus}/students?limit=1000`;

        if (courseId) url += `&course_id=${courseId}`;
        if (status) url += `&status=${status}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            let students = data.data.students;

            // Apply date range filter
            if (dateRange !== 'all') {
                students = filterByDateRange(students, dateRange, startDate, endDate);
            }

            // Apply term filter
            const term = document.getElementById('printTerm').value;
            if (term) {
                students = filterByTerm(students, term);
            }

            currentReportData = {
                students: students,
                format: printFormat,
                filters: {
                    course: document.getElementById('printCourse').selectedOptions[0]?.text || 'All',
                    status: status || 'All',
                    term: term || 'All',
                    dateRange: getDateRangeLabel(dateRange, startDate, endDate)
                }
            };

            // Update preview
            updateReportPreview(students, printFormat);

            // Enable print button
            document.getElementById('printBtn').disabled = false;
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report', 'error');
    }
}

// Filter students by date range
function filterByDateRange(students, dateRange, startDate, endDate) {
    const now = new Date();

    switch (dateRange) {
        case 'today':
            const today = now.toISOString().split('T')[0];
            return students.filter(s => s.admission_date === today);

        case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return students.filter(s => new Date(s.admission_date) >= weekAgo);

        case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return students.filter(s => new Date(s.admission_date) >= monthAgo);

        case 'quarter':
            const quarterAgo = new Date(now.setMonth(now.getMonth() - 3));
            return students.filter(s => new Date(s.admission_date) >= quarterAgo);

        case 'year':
            const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
            return students.filter(s => new Date(s.admission_date) >= yearAgo);

        case 'custom':
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                return students.filter(s => {
                    const admissionDate = new Date(s.admission_date);
                    return admissionDate >= start && admissionDate <= end;
                });
            }
            return students;

        default:
            return students;
    }
}

// Filter by term (simplified - you would implement based on your term dates)
function filterByTerm(students, term) {
    // This is a simplified implementation
    // In a real system, you would check against term dates
    return students.filter(s => {
        // For demo, assign terms based on admission month
        const admissionDate = new Date(s.admission_date);
        const month = admissionDate.getMonth() + 1;

        if (term === '1') return month >= 1 && month <= 4; // Term 1: Jan-Apr
        if (term === '2') return month >= 5 && month <= 8; // Term 2: May-Aug
        if (term === '3') return month >= 9 && month <= 12; // Term 3: Sep-Dec

        return true;
    });
}

// Get date range label
function getDateRangeLabel(dateRange, startDate, endDate) {
    switch (dateRange) {
        case 'today': return 'Today';
        case 'week': return 'This Week';
        case 'month': return 'This Month';
        case 'quarter': return 'This Quarter';
        case 'year': return 'This Year';
        case 'custom': return `Custom (${startDate} to ${endDate})`;
        default: return 'All Time';
    }
}

// Update report preview
function updateReportPreview(students, format) {
    const preview = document.getElementById('reportPreview');
    const stats = document.getElementById('previewStats');

    if (students.length === 0) {
        preview.innerHTML = `
            <div class="empty-preview">
                <i class="fas fa-search"></i>
                <p>No students match the selected filters</p>
            </div>
        `;
        stats.style.display = 'none';
        return;
    }

    // Calculate statistics
    const total = students.length;
    const pending = students.filter(s => s.status === 'pending').length;
    const admitted = students.filter(s => s.status === 'admitted').length;
    const rejected = students.filter(s => s.status === 'rejected').length;

    // Update statistics
    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('admittedCount').textContent = admitted;
    document.getElementById('rejectedCount').textContent = rejected;
    stats.style.display = 'block';

    // Generate preview based on format
    let previewHTML = '';

    switch (format) {
        case 'list':
            previewHTML = generateListPreview(students);
            break;
        case 'details':
            previewHTML = generateDetailsPreview(students);
            break;
        case 'summary':
            previewHTML = generateSummaryPreview(students);
            break;
    }

    preview.innerHTML = previewHTML;
}

// Generate list preview
function generateListPreview(students) {
    let html = `
        <div class="list-preview">
            <h4>Student List Preview</h4>
            <div class="preview-table">
                <table>
                    <thead>
                        <tr>
                            <th>Admission No.</th>
                            <th>Name</th>
                            <th>Course</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    students.slice(0, 10).forEach(student => { // Show first 10 only in preview
        html += `
            <tr>
                <td>${student.admission_number}</td>
                <td>${student.full_name}</td>
                <td>${student.course_name || 'N/A'}</td>
                <td><span class="status-badge status-${student.status}">${student.status}</span></td>
                <td>${new Date(student.admission_date).toLocaleDateString()}</td>
            </tr>
        `;
    });

    if (students.length > 10) {
        html += `
            <tr>
                <td colspan="5" style="text-align: center; font-style: italic;">
                    ... and ${students.length - 10} more students
                </td>
            </tr>
        `;
    }

    html += `
                    </tbody>
                </table>
            </div>
            <p class="preview-note"><small>Showing ${Math.min(10, students.length)} of ${students.length} students</small></p>
        </div>
    `;

    return html;
}

// Generate details preview
function generateDetailsPreview(students) {
    let html = `
        <div class="details-preview">
            <h4>Detailed Report Preview</h4>
            <div class="student-details-preview">
    `;

    students.slice(0, 3).forEach(student => { // Show first 3 only in preview
        html += `
            <div class="detail-item">
                <h5>${student.full_name} (${student.admission_number})</h5>
                <div class="detail-grid">
                    <div><strong>Course:</strong> ${student.course_name || 'N/A'}</div>
                    <div><strong>Fee (Per Term):</strong> KSh ${student.fee_per_term || 'N/A'}</div>
                    <div><strong>Department:</strong> ${student.department_name || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${student.phone_number || 'N/A'}</div>
                    <div><strong>Admission Date:</strong> ${new Date(student.admission_date).toLocaleDateString()}</div>
                </div>
            </div>
        `;
    });

    if (students.length > 3) {
        html += `
            <div class="detail-item">
                <p style="text-align: center; font-style: italic;">
                    ... and ${students.length - 3} more student records
                </p>
            </div>
        `;
    }

    html += `
            </div>
            <p class="preview-note"><small>Showing ${Math.min(3, students.length)} of ${students.length} student details</small></p>
        </div>
    `;

    return html;
}

// Generate summary preview
function generateSummaryPreview(students) {
    // Calculate statistics by course
    const courseStats = {};
    students.forEach(student => {
        const courseName = student.course_name || 'Unknown';
        if (!courseStats[courseName]) {
            courseStats[courseName] = { total: 0, pending: 0, admitted: 0, rejected: 0 };
        }
        courseStats[courseName].total++;
        courseStats[courseName][student.status]++;
    });

    let html = `
        <div class="summary-preview">
            <h4>Summary Report Preview</h4>
            <div class="summary-chart">
                <div class="chart-bar">
                    <div class="bar-label">Total Students</div>
                    <div class="bar-container">
                        <div class="bar" style="width: 100%">${students.length}</div>
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="bar-label">Pending</div>
                    <div class="bar-container">
                        <div class="bar pending" style="width: ${(students.filter(s => s.status === 'pending').length / students.length) * 100 || 0}%">
                            ${students.filter(s => s.status === 'pending').length}
                        </div>
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="bar-label">Admitted</div>
                    <div class="bar-container">
                        <div class="bar admitted" style="width: ${(students.filter(s => s.status === 'admitted').length / students.length) * 100 || 0}%">
                            ${students.filter(s => s.status === 'admitted').length}
                        </div>
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="bar-label">Rejected</div>
                    <div class="bar-container">
                        <div class="bar rejected" style="width: ${(students.filter(s => s.status === 'rejected').length / students.length) * 100 || 0}%">
                            ${students.filter(s => s.status === 'rejected').length}
                        </div>
                    </div>
                </div>
            </div>
            
            <h5>Course-wise Distribution</h5>
            <div class="course-distribution">
    `;

    Object.entries(courseStats).slice(0, 5).forEach(([course, stats]) => {
        html += `
            <div class="course-item">
                <div class="course-name">${course}</div>
                <div class="course-stats">
                    <span class="stat total">${stats.total}</span>
                    <span class="stat pending">${stats.pending}</span>
                    <span class="stat admitted">${stats.admitted}</span>
                    <span class="stat rejected">${stats.rejected}</span>
                </div>
            </div>
        `;
    });

    if (Object.keys(courseStats).length > 5) {
        html += `
            <div class="course-item">
                <div class="course-name">... and ${Object.keys(courseStats).length - 5} more courses</div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// Print report
function printReport() {
    if (!currentReportData) {
        showNotification('No report data to print', 'error');
        return;
    }

    const printWindow = window.open('', '_blank');
    const { students, format, filters } = currentReportData;

    // Get campus name
    const campusName = currentCampus === 'west' ? 'West Campus' : 'Twon Campus';

    // Generate print content
    const printContent = generatePrintContent(students, format, filters, campusName);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>East Africa Vision Institute - Student Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 20px;
                }
                .print-header h1 {
                    color: #2c3e50;
                    margin: 10px 0 5px;
                }
                .print-header h2 {
                    color: #3498db;
                    margin: 5px 0;
                    font-size: 1.2rem;
                }
                .filters-info {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-size: 0.9rem;
                }
                .filters-info strong {
                    color: #2c3e50;
                }
                .student-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .student-table th {
                    background-color: #2c3e50;
                    color: white;
                    padding: 10px;
                    text-align: left;
                }
                .student-table td {
                    padding: 8px 10px;
                    border-bottom: 1px solid #ddd;
                }
                .student-table tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                .status-badge {
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                .status-pending {
                    background-color: #fff3cd;
                    color: #856404;
                }
                .status-admitted {
                    background-color: #d4edda;
                    color: #155724;
                }
                .status-rejected {
                    background-color: #f8d7da;
                    color: #721c24;
                }
                .print-footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    font-size: 0.9rem;
                    color: #666;
                }
                @page {
                    margin: 20mm;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>EAST AFRICA VISION INSTITUTE</h1>
                <h2>${campusName} - Student Report</h2>
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <div class="filters-info">
                <p><strong>Filters Applied:</strong> 
                    Course: ${filters.course} | 
                    Status: ${filters.status} | 
                    Term: ${filters.term} | 
                    Date Range: ${filters.dateRange}
                </p>
                <p><strong>Total Students:</strong> ${students.length}</p>
            </div>
            
            ${printContent}
            
            <div class="print-footer">
                <p>© ${new Date().getFullYear()} East Africa Vision Institute. All rights reserved.</p>
                <p>Page 1 of 1</p>
            </div>
            
            <div class="no-print" style="margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Print Report
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    Close
                </button>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
}

// Generate print content based on format
function generatePrintContent(students, format, filters, campusName) {
    switch (format) {
        case 'list':
            return generatePrintList(students);
        case 'details':
            return generatePrintDetails(students);
        case 'summary':
            return generatePrintSummary(students);
        default:
            return generatePrintList(students);
    }
}

// Generate print list
function generatePrintList(students) {
    let html = `
        <table class="student-table">
            <thead>
                <tr>
                    <th>Admission No.</th>
                    <th>Full Name</th>
                    <th>Course</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Admission Date</th>
                </tr>
            </thead>
            <tbody>
    `;

    students.forEach(student => {
        html += `
            <tr>
                <td>${student.admission_number}</td>
                <td>${student.full_name}</td>
                <td>${student.course_name || 'N/A'}</td>
                <td>${student.phone_number || 'N/A'}</td>
                <td>${new Date(student.admission_date).toLocaleDateString()}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}

// Generate print details
function generatePrintDetails(students) {
    let html = '';

    students.forEach((student, index) => {
        html += `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; page-break-inside: avoid;">
                <h3 style="color: #2c3e50; margin-top: 0;">${student.full_name} (${student.admission_number})</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9rem;">
                    <div><strong>Email:</strong> ${student.email}</div>
                    <div><strong>Phone:</strong> ${student.phone_number || 'N/A'}</div>
                    <div><strong>Course:</strong> ${student.course_name || 'N/A'}</div>
                    <div><strong>Fee (Per Term):</strong> KSh ${student.fee_per_term || 'N/A'}</div>
                    <div><strong>Department:</strong> ${student.department_name || 'N/A'}</div>
                    <div><strong>Status:</strong> <span class="status-badge status-${student.status}">${student.status}</span></div>
                    <div><strong>Admission Date:</strong> ${new Date(student.admission_date).toLocaleDateString()}</div>
                    <div><strong>Date of Birth:</strong> ${student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Location:</strong> ${student.location || 'N/A'}</div>
                </div>
            </div>
        `;
    });

    return html;
}

// Generate print summary
function generatePrintSummary(students) {
    // Calculate statistics
    const total = students.length;
    const pending = students.filter(s => s.status === 'pending').length;
    const admitted = students.filter(s => s.status === 'admitted').length;
    const rejected = students.filter(s => s.status === 'rejected').length;

    // Calculate by course
    const courseStats = {};
    students.forEach(student => {
        const courseName = student.course_name || 'Unknown';
        if (!courseStats[courseName]) {
            courseStats[courseName] = { total: 0, pending: 0, admitted: 0, rejected: 0 };
        }
        courseStats[courseName].total++;
        courseStats[courseName][student.status]++;
    });

    let html = `
        <div style="margin: 20px 0;">
            <h3 style="color: #2c3e50;">Summary Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
                <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #2c3e50;">${total}</div>
                    <div>Total Students</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #fff3cd; border-radius: 5px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #856404;">${pending}</div>
                    <div>Pending</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #d4edda; border-radius: 5px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #155724;">${admitted}</div>
                    <div>Admitted</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f8d7da; border-radius: 5px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #721c24;">${rejected}</div>
                    <div>Rejected</div>
                </div>
            </div>
        </div>
        
        <h3 style="color: #2c3e50;">Course-wise Distribution</h3>
        <table class="student-table" style="margin-top: 10px;">
            <thead>
                <tr>
                    <th>Course</th>
                    <th>Total</th>
                    <th>Pending</th>
                    <th>Admitted</th>
                    <th>Rejected</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(courseStats).forEach(([course, stats]) => {
        html += `
            <tr>
                <td>${course}</td>
                <td>${stats.total}</td>
                <td>${stats.pending}</td>
                <td>${stats.admitted}</td>
                <td>${stats.rejected}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}
