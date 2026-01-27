// WhatsApp Share Script
let selectedStudentsMap = new Map();

// Default message for PDF sharing
const defaultWhatsAppMessage = `Dear [Name],

Your admission letter has been generated. 

Download Admission Letter: [PDFLink]
Download Fee Structure: [FeeLink]

Best regards,
East Africa Vision Institute`;

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadCoursesForShare();
    loadStudentsForShare();

    // Add event listeners
    document.getElementById('shareCourse').addEventListener('change', loadStudentsForShare);
    document.getElementById('shareStatus').addEventListener('change', loadStudentsForShare);
    document.getElementById('shareSearch').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') searchStudents();
    });
});

// Load courses for share filter
async function loadCoursesForShare() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const courseSelect = document.getElementById('shareCourse');

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

// Load students for share
async function loadStudentsForShare() {
    try {
        const token = localStorage.getItem('admin_token');
        const courseId = document.getElementById('shareCourse').value;
        const status = document.getElementById('shareStatus').value;

        let url = `${API_BASE_URL}/${currentCampus}/students?limit=100`;
        if (courseId) url += `&course_id=${courseId}`;
        if (status) url += `&status=${status}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderWhatsAppTable(data.data.students);
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification('Failed to load students', 'error');
    }
}

// Search students
function searchStudents() {
    const searchTerm = document.getElementById('shareSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#whatsappTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Render WhatsApp table
function renderWhatsAppTable(students) {
    const tbody = document.getElementById('whatsappTableBody');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-users-slash" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>No students found</p>
                </td>
            </tr>
        `;
        return;
    }

    students.forEach(student => {
        const row = document.createElement('tr');
        const studentId = student.admission_number;
        const isSelected = selectedStudentsMap.has(studentId);

        let statusClass = 'status-pending';
        if (student.status === 'admitted') statusClass = 'status-admitted';
        if (student.status === 'rejected') statusClass = 'status-rejected';

        // Check if PDF exists
        const hasPDF = student.status === 'admitted' || student.status === 'pending';

        row.innerHTML = `
            <td>
                <input type="checkbox" class="table-checkbox" 
                       data-id="${studentId}" 
                       data-name="${student.full_name}"
                       data-course="${student.course_name || 'N/A'}"
                       data-phone="${student.phone_number || 'N/A'}"
                       data-feepdf="${student.fee_structure_pdf_name || ''}"
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleTableSelection('${studentId}')">
            </td>
            <td>${student.admission_number}</td>
            <td>${student.full_name}</td>
            <td>${student.course_name || 'N/A'}</td>
            <td>${student.phone_number || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${student.status}</span></td>
            <td>
                ${hasPDF ?
                '<span class="pdf-status available"><i class="fas fa-check-circle"></i> Available</span>' :
                '<span class="pdf-status unavailable"><i class="fas fa-times-circle"></i> Not Generated</span>'
            }
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" onclick="viewStudent('${studentId}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action whatsapp" onclick="shareSingleStudent('${studentId}')" title="Share">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateSelectedCount();
}

// Toggle table select all
function toggleTableSelectAll() {
    const selectAll = document.getElementById('tableSelectAll');
    const checkboxes = document.querySelectorAll('.table-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        const studentId = checkbox.dataset.id;

        if (selectAll.checked) {
            // Add to selection if not already selected
            if (!selectedStudentsMap.has(studentId)) {
                const row = checkbox.closest('tr');
                const studentData = {
                    id: studentId,
                    name: checkbox.dataset.name,
                    course: checkbox.dataset.course,
                    phone: checkbox.dataset.phone,
                    feePdf: checkbox.dataset.feepdf
                };
                selectedStudentsMap.set(studentId, studentData);
            }
        } else {
            // Remove from selection
            selectedStudentsMap.delete(studentId);
        }
    });

    updateSelectedCount();
    updateSelectedList();
}

// Toggle individual selection from table
function toggleTableSelection(studentId) {
    const checkbox = document.querySelector(`.table-checkbox[data-id="${studentId}"]`);
    const row = checkbox.closest('tr');

    if (checkbox.checked) {
        const studentData = {
            id: studentId,
            name: checkbox.dataset.name,
            course: checkbox.dataset.course,
            phone: checkbox.dataset.phone,
            feePdf: checkbox.dataset.feepdf
        };
        selectedStudentsMap.set(studentId, studentData);
    } else {
        selectedStudentsMap.delete(studentId);
        document.getElementById('tableSelectAll').checked = false;
    }

    updateSelectedCount();
    updateSelectedList();
}

// Select all students
function selectAllStudents() {
    const checkboxes = document.querySelectorAll('.table-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        const studentId = checkbox.dataset.id;
        const row = checkbox.closest('tr');

        if (!selectedStudentsMap.has(studentId)) {
            const studentData = {
                id: studentId,
                name: checkbox.dataset.name,
                course: checkbox.dataset.course,
                phone: checkbox.dataset.phone,
                feePdf: checkbox.dataset.feepdf
            };
            selectedStudentsMap.set(studentId, studentData);
        }
    });

    document.getElementById('tableSelectAll').checked = true;
    updateSelectedCount();
    updateSelectedList();
}

// Clear selection
function clearSelection() {
    selectedStudentsMap.clear();
    const checkboxes = document.querySelectorAll('.table-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('tableSelectAll').checked = false;
    updateSelectedCount();
    updateSelectedList();
}

// Update selected count
function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = `(${selectedStudentsMap.size})`;
}

// Update selected students list
function updateSelectedList() {
    const container = document.getElementById('selectedStudents');

    if (selectedStudentsMap.size === 0) {
        container.innerHTML = `
            <div class="empty-selection">
                <i class="fas fa-user-plus"></i>
                <p>No students selected yet</p>
                <small>Use the filters and table below to select students</small>
            </div>
        `;
        return;
    }

    let html = '<div class="selected-list">';

    selectedStudentsMap.forEach((student, id) => {
        html += `
            <div class="selected-item" data-id="${id}">
                <div class="item-info">
                    <strong>${student.name}</strong>
                    <small>${id} • ${student.course}</small>
                </div>
                <button class="item-remove" onclick="removeSelectedStudent('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Remove selected student
function removeSelectedStudent(studentId) {
    selectedStudentsMap.delete(studentId);

    // Uncheck in table
    const checkbox = document.querySelector(`.table-checkbox[data-id="${studentId}"]`);
    if (checkbox) checkbox.checked = false;

    // Uncheck select all if any checkbox is unchecked
    const allChecked = document.querySelectorAll('.table-checkbox:checked').length ===
        document.querySelectorAll('.table-checkbox').length;
    document.getElementById('tableSelectAll').checked = allChecked;

    updateSelectedCount();
    updateSelectedList();
}

// View student details
function viewStudent(admissionNumber) {
    window.open(`students.html?search=${admissionNumber}`, '_blank');
}

// Share single student
function shareSingleStudent(studentId) {
    const student = selectedStudentsMap.get(studentId);
    if (!student) {
        showNotification('Student not found in selection', 'warning');
        return;
    }

    // Get PDF link from backend
    const pdfLink = `${API_BASE_URL}/${currentCampus}/students/download/${studentId}`;

    // Generate message with student info
    const message = generateMessageForStudent(student, pdfLink);

    // Generate WhatsApp link
    const whatsappLink = generateWhatsAppLink(student.phone, message);

    // Open in new tab
    window.open(whatsappLink, '_blank');
}

// Generate share links for all selected students
function generateShareLinks() {
    if (selectedStudentsMap.size === 0) {
        showNotification('Please select at least one student', 'warning');
        return;
    }

    const resultsContainer = document.getElementById('linksContainer');
    const linksCount = document.getElementById('linksCount');
    const templateUsed = document.getElementById('templateUsed');

    resultsContainer.innerHTML = '';

    // Generate links for each student
    selectedStudentsMap.forEach((student, studentId) => {
        // Get PDF link from backend
        const pdfLink = `${API_BASE_URL}/${currentCampus}/students/download/${studentId}`;

        // Generate message with student info
        const message = generateMessageForStudent(student, pdfLink);
        const whatsappLink = generateWhatsAppLink(student.phone, message);

        const linkElement = document.createElement('div');
        linkElement.className = 'share-link-item';
        linkElement.innerHTML = `
            <div class="link-info">
                <div class="link-header">
                    <strong>${student.name}</strong>
                    <span class="link-admission">${studentId}</span>
                </div>
                <div class="link-details">
                    <small>Course: ${student.course}</small>
                    <small>Phone: ${student.phone || 'N/A'}</small>
                </div>
                <div class="link-url">
                    <input type="text" readonly value="${whatsappLink}" id="link-${studentId}">
                    <button class="btn-copy" onclick="copyLink('${studentId}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="link-actions">
                <button class="btn btn-sm btn-primary" onclick="window.open('${whatsappLink}', '_blank')">
                    <i class="fab fa-whatsapp"></i> Open
                </button>
            </div>
        `;

        resultsContainer.appendChild(linkElement);
    });

    // Update counts and show results
    linksCount.textContent = selectedStudentsMap.size;
    templateUsed.textContent = 'Default PDF Sharing';
    document.getElementById('shareResults').style.display = 'block';

    // Scroll to results
    document.getElementById('shareResults').scrollIntoView({ behavior: 'smooth' });
}

// Generate message for a specific student
function generateMessageForStudent(student, pdfLink) {
    const feeLink = student.feePdf ? `${API_BASE_URL}/${currentCampus}/fees/download/${student.feePdf}` : 'N/A';

    // Use default message and replace variables
    return defaultWhatsAppMessage
        .replace(/\[Name\]/g, student.name)
        .replace(/\[AdmissionNo\]/g, student.id)
        .replace(/\[Course\]/g, student.course)
        .replace(/\[PDFLink\]/g, pdfLink)
        .replace(/\[FeeLink\]/g, feeLink);
}

// Generate WhatsApp link
function generateWhatsAppLink(phone, message) {
    // Clean phone number (remove non-numeric characters)
    const cleanPhone = phone.replace(/\D/g, '');

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Generate WhatsApp link
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// Copy single link
function copyLink(studentId) {
    const input = document.getElementById(`link-${studentId}`);
    input.select();
    document.execCommand('copy');
    showNotification('Link copied to clipboard!', 'success');
}

// Copy all links
function copyAllLinks() {
    const links = [];
    selectedStudentsMap.forEach((student, studentId) => {
        // Get PDF link from backend
        const pdfLink = `${API_BASE_URL}/${currentCampus}/students/download/${studentId}`;

        // Generate message with student info
        const message = generateMessageForStudent(student, pdfLink);
        const whatsappLink = generateWhatsAppLink(student.phone, message);

        links.push(`${student.name} (${studentId}): ${whatsappLink}`);
    });

    const textToCopy = links.join('\n\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
        document.getElementById('successModal').style.display = 'flex';
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showNotification('Failed to copy links to clipboard', 'error');
    });
}

// Open all links
function openAllLinks() {
    selectedStudentsMap.forEach((student, studentId) => {
        // Get PDF link from backend
        const pdfLink = `${API_BASE_URL}/${currentCampus}/students/download/${studentId}`;

        // Generate message with student info
        const message = generateMessageForStudent(student, pdfLink);
        const whatsappLink = generateWhatsAppLink(student.phone, message);

        // Open each link in a new tab
        window.open(whatsappLink, '_blank');
    });
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Close modal on outside click
window.onclick = function (event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeSuccessModal();
    }
};
