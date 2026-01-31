// Students Management Script
let currentPage = 1;
const pageSize = 10;
let totalStudents = 0;

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadCoursesForFilter();
    loadStudents();

    // Add event listeners for filters
    document.getElementById('searchInput').addEventListener('input', debounce(loadStudents, 300));
    document.getElementById('statusFilter').addEventListener('change', loadStudents);
    document.getElementById('courseFilter').addEventListener('change', loadStudents);
});

// Load courses for filter dropdown
async function loadCoursesForFilter() {
    try {
        const token = localStorage.getItem('admin_token');

        if (!token) {
            console.error('No authentication token found');
            return;
        }

        console.log(`Loading courses for campus: ${currentCampus}`);

        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load courses');
        }

        const courseFilter = document.getElementById('courseFilter');

        // Clear existing options except the first one
        while (courseFilter.children.length > 1) {
            courseFilter.removeChild(courseFilter.lastChild);
        }

        data.data.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_id || course.id;
            option.textContent = course.course_name || course.name;
            courseFilter.appendChild(option);
        });

        console.log(`Loaded ${data.data.length} courses for ${currentCampus} campus`);

    } catch (error) {
        console.error('Error loading courses:', error);
        showNotification('Failed to load courses', 'error');
    }
}

// Load students
async function loadStudents() {
    try {
        const token = localStorage.getItem('admin_token');

        if (!token) {
            console.error('No authentication token found');
            return;
        }

        if (!currentCampus) {
            // Try to get from local storage if global var is not set yet
            const userData = localStorage.getItem('admin_data');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    currentCampus = user.campus;
                } catch (e) {
                    console.error('Failed to parse admin data', e);
                }
            }
        }

        if (!currentCampus) {
            console.error('Current campus not set, cannot load students');
            return;
        }

        let url = `${API_BASE_URL}/${currentCampus}/students?page=${currentPage}&limit=${pageSize}`;

        const search = document.getElementById('searchInput').value.trim();
        const status = document.getElementById('statusFilter').value;
        const courseId = document.getElementById('courseFilter').value;

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);

        // Use group filter if set, otherwise use dropdown
        if (groupFilter && groupFilter.type === 'gender') {
            params.append('gender', groupFilter.value);
        }

        // Course can come from dropdown or group
        if (courseId) {
            params.append('course_id', courseId);
        } else if (groupFilter && groupFilter.type === 'course') {
            // If dropdown is empty but we clicked a group, force it? 
            // Actually openGroup sets the dropdown value, so courseId should be populated.
            // But let's be safe.
            params.append('course_id', groupFilter.value);
        }

        const queryString = params.toString();
        if (queryString) url += `&${queryString}`;

        console.log(`Fetching students from: ${url}`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            totalStudents = data.data.total;
            renderStudentsTable(data.data.students);
            renderPagination(data.data.total, data.data.page, data.data.totalPages);
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification(`Failed to load students: ${error.message}`, 'error');
    }
}

// Render students table
function renderStudentsTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-users-slash" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>No students found</p>
                </td>
            </tr>
        `;
        return;
    }

    students.forEach(student => {
        let statusClass = 'status-pending';
        if (student.status === 'admitted') statusClass = 'status-admitted';
        if (student.status === 'rejected') statusClass = 'status-rejected';

        // Build action buttons based on status
        let actionButtons = `
            <button class="btn-action delete" onclick="deleteStudent('${student.admission_number}', '${student.full_name}')" title="Delete Student">
                <i class="fas fa-trash"></i>
            </button>
        `;


        // Add other action buttons
        if (true) {
            actionButtons += `
                <button class="btn-action download" onclick="downloadPDF('${encodeURIComponent(student.admission_number)}')" title="Download Admission Package">
                    <i class="fas fa-file-pdf"></i>
                </button>
                <button class="btn-action whatsapp" onclick="shareViaWhatsApp('${student.admission_number}')" title="Share via WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
            `;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Admission No.">${student.admission_number}</td>
            <td data-label="Full Name">${student.full_name}</td>
            <td data-label="Course">${student.course_name || 'Not assigned'}</td>
            <td data-label="Phone">${student.phone_number || 'N/A'}</td>
            <td data-label="Admission Date">${new Date(student.admission_date).toLocaleDateString()}</td>
            <td data-label="Actions">
                <div class="action-buttons">
                    ${actionButtons}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update student status (approve/reject)
async function updateStudentStatus(studentId, newStatus) {
    try {
        const token = localStorage.getItem('admin_token');

        if (!token) {
            showNotification('Authentication required', 'error');
            return;
        }

        const confirmMessage = newStatus === 'admitted'
            ? 'Are you sure you want to approve this student?'
            : 'Are you sure you want to reject this student?';

        if (!confirm(confirmMessage)) {
            return;
        }

        const response = await fetch(`${API_BASE_URL}/${currentCampus}/students/${studentId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showNotification(`Student ${newStatus} successfully`, 'success');
            loadStudents(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to update student status', 'error');
        }
    } catch (error) {
        console.error('Error updating student status:', error);
        showNotification('Failed to update student status', 'error');
    }
}

// Render pagination
function renderPagination(total, currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            loadStudents();
        }
    };
    pagination.appendChild(prevButton);

    // Page numbers
    const pageNumbers = document.createElement('div');
    pageNumbers.className = 'page-numbers';

    // Show first page
    if (currentPage > 2) {
        const firstPage = createPageButton(1);
        pageNumbers.appendChild(firstPage);

        if (currentPage > 3) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
    }

    // Show current page and neighbors
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
        const pageButton = createPageButton(i);
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageNumbers.appendChild(pageButton);
    }

    // Show last page
    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }

        const lastPage = createPageButton(totalPages);
        pageNumbers.appendChild(lastPage);
    }

    pagination.appendChild(pageNumbers);

    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadStudents();
        }
    };
    pagination.appendChild(nextButton);
}

function createPageButton(pageNumber) {
    const button = document.createElement('button');
    button.textContent = pageNumber;
    button.onclick = () => {
        currentPage = pageNumber;
        loadStudents();
    };
    return button;
}

// Print student record
function printStudent(admissionNumber) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Student Record - ${admissionNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header img { height: 60px; }
                .student-info { margin: 20px 0; }
                .info-row { display: flex; margin: 10px 0; }
                .info-label { font-weight: bold; width: 200px; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>EAST AFRICA VISION INSTITUTE</h2>
                <h3>Student Admission Record</h3>
            </div>
            <div id="printContent">
                Loading...
            </div>
            <div class="no-print" style="margin-top: 30px;">
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Close</button>
            </div>
            <script>
                // Load student data and populate print content
                fetch('${API_BASE_URL}/${currentCampus}/students/${admissionNumber}', {
                    headers: {
                        'Authorization': 'Bearer ${localStorage.getItem('admin_token')}'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    const student = data.data;
                    document.getElementById('printContent').innerHTML = \`
                        <div class="student-info">
                            <div class="info-row">
                                <span class="info-label">Admission Number:</span>
                                <span>\${student.admission_number}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Full Name:</span>
                                <span>\${student.full_name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Course:</span>
                                <span>\${student.course_name || 'Not assigned'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span>\${student.status}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Admission Date:</span>
                                <span>\${new Date(student.admission_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    \`;
                });
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Download PDF
function downloadPDF(admissionNumber) {
    window.open(`${API_BASE_URL}/${currentCampus}/students/download/${encodeURIComponent(admissionNumber)}`, '_blank');
}

// Export students to CSV
function exportStudents() {
    // In a real implementation, this would call an API endpoint
    // For now, we'll create a simple CSV from the current view
    const rows = [];
    const headers = ['Admission Number', 'Full Name', 'Course', 'Phone', 'Status', 'Admission Date'];
    rows.push(headers.join(','));

    document.querySelectorAll('#studentsTableBody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = [
                cells[0].textContent,
                cells[1].textContent,
                cells[2].textContent,
                cells[3].textContent,
                cells[4].querySelector('.student-status')?.textContent || cells[4].textContent,
                cells[5].textContent
            ];
            rows.push(rowData.join(','));
        }
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${currentCampus}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Delete student
async function deleteStudent(admissionNumber, fullName) {
    if (!confirm(`Are you sure you want to delete student "${fullName}" (${admissionNumber})? This action cannot be undone.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/students/${admissionNumber}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Student deleted successfully', 'success');
            loadStudents();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete student');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showNotification(error.message, 'error');
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==========================================
// View Switcher & Group Logic
// ==========================================

let currentView = 'list';
let groupFilter = null; // { type: 'course'|'gender', value: '...' }

function switchView(viewName) {
    currentView = viewName;

    // Update buttons
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.view-btn[onclick="switchView('${viewName}')"]`).classList.add('active');

    // Hide all containers
    document.getElementById('studentsListView').style.display = 'none';
    document.getElementById('courseGroupView').style.display = 'none';
    document.getElementById('genderGroupView').style.display = 'none';
    document.getElementById('filterControls').style.display = 'none'; // Hide filters in group view initially

    // Clear grouping filter when switching top-level views
    if (groupFilter?.type !== viewName) {
        groupFilter = null;
    }

    if (viewName === 'list') {
        document.getElementById('studentsListView').style.display = 'block';
        document.getElementById('filterControls').style.display = 'flex';
        // Reset filters if we were in a group view previously
        if (!groupFilter) {
            loadStudents();
        }
    } else if (viewName === 'course') {
        document.getElementById('courseGroupView').style.display = 'grid';
        loadCourseGroups();
    } else if (viewName === 'gender') {
        document.getElementById('genderGroupView').style.display = 'grid';
        loadGenderGroups();
    }
}

async function loadCourseGroups() {
    const container = document.getElementById('courseGroupView');
    container.innerHTML = '<div style="text-align:center; width:100%;"><i class="fas fa-spinner fa-spin"></i> Loading Courses...</div>';

    try {
        // Re-use api to get courses
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        container.innerHTML = '';

        if (data.data.length === 0) {
            container.innerHTML = '<p>No courses found.</p>';
            return;
        }

        data.data.forEach(course => {
            const card = document.createElement('div');
            card.className = 'group-card';
            card.onclick = () => openGroup('course', course.course_id);
            card.innerHTML = `
                <div class="group-icon">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="group-info">
                    <h4>${course.course_name}</h4>
                    <p>Click to view students</p>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading course groups', error);
        container.innerHTML = '<p>Error loading courses.</p>';
    }
}

async function loadGenderGroups() {
    const container = document.getElementById('genderGroupView');
    container.innerHTML = '';

    const genders = ['Male', 'Female', 'Other'];

    genders.forEach(gender => {
        const card = document.createElement('div');
        card.className = 'group-card';
        card.onclick = () => openGroup('gender', gender);
        card.innerHTML = `
            <div class="group-icon">
                <i class="fas fa-${gender === 'Male' ? 'mars' : (gender === 'Female' ? 'venus' : 'genderless')}"></i>
            </div>
            <div class="group-info">
                <h4>${gender}</h4>
                <p>Click to view students</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function openGroup(type, value) {
    // Set the filter
    groupFilter = { type, value };

    // Switch UI to list view
    currentView = 'list';
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.view-btn[onclick="switchView('list')"]`).classList.add('active'); // Highlight list as active

    document.getElementById('studentsListView').style.display = 'block';
    document.getElementById('courseGroupView').style.display = 'none';
    document.getElementById('genderGroupView').style.display = 'none';
    document.getElementById('filterControls').style.display = 'flex';

    // Apply value to filter inputs if they exist (visual feedback)
    if (type === 'course') {
        document.getElementById('courseFilter').value = value;
        document.getElementById('statusFilter').value = ''; // Reset status
    }

    // Reload students with new filter
    currentPage = 1;
    loadStudents();
}
