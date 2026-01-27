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
        if (courseId) params.append('course_id', courseId);

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
            <button class="btn-action view" onclick="viewStudentDetails('${student.admission_number}')" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-action delete" onclick="deleteStudent('${student.admission_number}', '${student.full_name}')" title="Delete Student">
                <i class="fas fa-trash"></i>
            </button>
        `;


        // Add other action buttons
        if (true) {
            actionButtons += `
                <button class="btn-action download" onclick="downloadAdmissionLetter('${student.admission_number}')" title="Download Admission Letter">
                    <i class="fas fa-file-pdf"></i>
                </button>
                ${student.fee_structure_pdf_name ? `
                <button class="btn-action download" onclick="downloadFeePDF('${student.fee_structure_pdf_name}')" title="Download Fee Structure" style="background-color: #27ae60;">
                    <i class="fas fa-file-invoice-dollar"></i>
                </button>
                ` : ''}
                <button class="btn-action whatsapp" onclick="shareViaWhatsApp('${student.admission_number}')" title="Share via WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
            `;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.admission_number}</td>
            <td>${student.full_name}</td>
            <td>${student.course_name || 'Not assigned'}</td>
            <td>${student.phone_number || 'N/A'}</td>
            <td>${new Date(student.admission_date).toLocaleDateString()}</td>
            <td>
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
                <h2>TRICA VISION INSTITUTE</h2>
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

// Download admission letter
function downloadAdmissionLetter(admissionNumber) {
    window.open(`${API_BASE_URL}/${currentCampus}/students/download/${admissionNumber}`, '_blank');
}

// Download fee structure PDF
function downloadFeePDF(filename) {
    window.open(`${API_BASE_URL}/${currentCampus}/fees/download/${filename}`, '_blank');
}

// Share via WhatsApp
async function shareViaWhatsApp(admissionNumber) {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/students/${admissionNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch student info');
        const data = await response.json();
        const student = data.data;

        const pdfLink = `${window.location.origin}/api/${currentCampus}/students/download/${admissionNumber}`;
        const feeLink = student.fee_structure_pdf_name
            ? `${window.location.origin}/api/${currentCampus}/fees/download/${student.fee_structure_pdf_name}`
            : null;

        let message = `Dear ${student.full_name},

Congratulations! Your admission to East Africa Vision Institute has been confirmed.

📄 *Admission Details:*
• Admission Number: ${student.admission_number}
• Course: ${student.course_name || 'Not assigned'}
• Campus: ${currentCampus === 'west' ? 'West Campus' : 'Twon Campus'}

📥 *Download Your Documents:*
• Admission Letter: ${pdfLink}`;

        if (feeLink) {
            message += `
• Fee Structure: ${feeLink}`;
        }

        message += `

Please download and review your admission letter and fee structure.

Best regards,
East Africa Vision Institute`;

        const whatsappUrl = `https://wa.me/${(student.phone_number || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    } catch (error) {
        console.error('Error sharing via WhatsApp:', error);
        showNotification('Failed to share via WhatsApp', 'error');
    }
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
