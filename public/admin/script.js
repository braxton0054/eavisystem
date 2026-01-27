// Admin Dashboard Script
let currentUser = null;
let currentCampus = null;
const API_BASE_URL = '/api';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    if (typeof loadDashboardData === 'function' && document.getElementById('totalStudents')) {
        loadDashboardData();
    }
});

// Sidebar Toggle for Mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) {
        sidebar.classList.toggle('active');

        // Handle overlay
        if (sidebar.classList.contains('active')) {
            if (!overlay) {
                const newOverlay = document.createElement('div');
                newOverlay.id = 'sidebarOverlay';
                newOverlay.className = 'sidebar-overlay active';
                newOverlay.onclick = toggleSidebar;
                document.body.appendChild(newOverlay);
            } else {
                overlay.classList.add('active');
            }
            document.body.style.overflow = 'hidden';
        } else {
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_data');

    if (!token || !userData) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(userData);
        currentCampus = currentUser.campus;

        // Validate campus
        if (!['west', 'twon'].includes(currentCampus)) {
            console.error('Invalid campus:', currentCampus);
            logout();
            return;
        }

        // Update UI with user info
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
        document.getElementById('campusBadge').textContent =
            currentCampus === 'west' ? 'West Campus' : 'Twon Campus';

        // Add campus indicator to body for styling
        document.body.setAttribute('data-campus', currentCampus);

    } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('admin_token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log(`Loading dashboard data for campus: ${currentCampus}`);

        // Fetch student statistics
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/students?page=1&limit=1000`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load data');
        }

        const students = data.data.students || [];
        console.log(`Loaded ${students.length} students for ${currentCampus} campus`);

        // Calculate statistics
        const total = students.length;
        const admitted = students.length; // All students are admitted

        // Update statistics
        document.getElementById('totalStudents').textContent = total;
        document.getElementById('admittedStudents').textContent = admitted;

        // Load recent students
        loadRecentStudents(students.slice(0, 5));

        // Log statistics
        console.log(`Dashboard Statistics for ${currentCampus}:`, {
            total,
            admitted
        });

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification(`Failed to load dashboard data: ${error.message}`, 'error');

        // Show error state in UI
        document.getElementById('totalStudents').textContent = '0';
        document.getElementById('admittedStudents').textContent = '0';

        const container = document.getElementById('recentStudents');
        container.innerHTML = '<p class="no-data">Error loading data. Please try again.</p>';
    }
}

// Load recent students
function loadRecentStudents(students) {
    const container = document.getElementById('recentStudents');
    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<p class="no-data">No recent applications</p>';
        return;
    }

    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        studentItem.onclick = () => viewStudentDetails(student.admission_number);

        let statusClass = 'status-pending';
        if (student.status === 'admitted') statusClass = 'status-admitted';
        if (student.status === 'rejected') statusClass = 'status-rejected';

        studentItem.innerHTML = `
            <div class="student-info">
                <h4>${student.full_name}</h4>
                <p>${student.admission_number} • ${student.course_name || 'No Course'}</p>
            </div>
            <div class="student-status ${statusClass}">${student.status}</div>
        `;

        container.appendChild(studentItem);
    });
}

// View student details
async function viewStudentDetails(admissionNumber) {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/students/${admissionNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const student = data.data;

            const modalBody = document.getElementById('studentDetails');
            modalBody.innerHTML = `
                <div class="student-detail">
                    <div class="detail-row">
                        <span class="detail-label">Admission Number:</span>
                        <span class="detail-value">${student.admission_number}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Full Name:</span>
                        <span class="detail-value">${student.full_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${student.email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${student.phone_number || 'Not provided'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Course:</span>
                        <span class="detail-value">${student.course_name || 'Not assigned'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Department:</span>
                        <span class="detail-value">${student.department_name || 'Not assigned'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value status-${student.status}">${student.status}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Admission Date:</span>
                        <span class="detail-value">${new Date(student.admission_date).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${student.address || 'Not provided'}</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="downloadPDF('${student.admission_number}')">
                        <i class="fas fa-file-pdf"></i> Admission Letter
                    </button>
                    ${student.fee_structure_pdf_name ? `
                    <button class="btn btn-primary" style="background-color: #27ae60;" onclick="downloadFeePDF('${student.fee_structure_pdf_name}')">
                        <i class="fas fa-file-invoice-dollar"></i> Fee Structure
                    </button>
                    ` : ''}
                </div>
            `;

            document.getElementById('studentModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading student details:', error);
        showNotification('Failed to load student details', 'error');
    }
}

// Download admission letter PDF
function downloadPDF(admissionNumber) {
    window.open(`${API_BASE_URL}/${currentCampus}/students/download/${admissionNumber}`, '_blank');
}

// Download fee structure PDF
function downloadFeePDF(filename) {
    window.open(`${API_BASE_URL}/${currentCampus}/fees/download/${filename}`, '_blank');
}

// Update student status
async function updateStatus(admissionNumber, status) {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/students/${admissionNumber}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showNotification(`Student status updated to ${status}`, 'success');
            closeModal();
            loadDashboardData(); // Refresh dashboard data
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Failed to update student status', 'error');
    }
}

// Admin login
document.getElementById('adminLoginForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Determine campus from password (simplified logic)
    // In real app, this would be handled by the backend
    let campus = 'west'; // Default
    if (password.includes('twon') || password.toLowerCase().includes('town')) {
        campus = 'twon';
    }

    try {
        const loginBtn = document.querySelector('.btn-login');
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/${campus}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user data
            localStorage.setItem('admin_token', data.data.token);
            localStorage.setItem('admin_data', JSON.stringify(data.data.admin));

            // Redirect to dashboard
            window.location.href = 'index.html';
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        const loginBtn = document.querySelector('.btn-login');
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        loginBtn.disabled = false;
    }
});

// Logout
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    window.location.href = 'login.html';
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Close modal
function closeModal() {
    document.getElementById('studentModal').style.display = 'none';
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = 'var(--success-color)';
    } else if (type === 'error') {
        notification.style.backgroundColor = 'var(--accent-color)';
    } else if (type === 'warning') {
        notification.style.backgroundColor = 'var(--warning-color)';
    } else {
        notification.style.backgroundColor = 'var(--secondary-color)';
    }

    // Add close button styles
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        margin-left: 15px;
    `;

    // Add keyframes for animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Add to document
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Close modal on outside click
window.onclick = function (event) {
    const modal = document.getElementById('studentModal');
    if (event.target === modal) {
        closeModal();
    }
};
