// Course Management Script
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadDepartments();
    loadCourses();
    loadFeePdfs();

    // Add event listeners
    document.getElementById('searchCourse').addEventListener('input', debounce(loadCourses, 300));
    document.getElementById('departmentFilter').addEventListener('change', loadCourses);

    // Form submissions
    document.getElementById('addCourseForm').addEventListener('submit', addCourse);
    document.getElementById('editCourseForm').addEventListener('submit', updateCourse);
});

// Load departments for filters and forms
async function loadDepartments() {
    try {
        const token = localStorage.getItem('admin_token');

        // Fetch departments from API (you'll need to create this endpoint)
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/departments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const deptFilter = document.getElementById('departmentFilter');
            const addDeptSelect = document.getElementById('department');
            const editDeptSelect = document.getElementById('editDepartment');

            // Clear existing options except the first one
            while (deptFilter.children.length > 1) deptFilter.removeChild(deptFilter.lastChild);
            while (addDeptSelect.children.length > 1) addDeptSelect.removeChild(addDeptSelect.lastChild);
            while (editDeptSelect.children.length > 1) editDeptSelect.removeChild(editDeptSelect.lastChild);

            // Add department options
            data.data.forEach(dept => {
                // For filter
                const filterOption = document.createElement('option');
                filterOption.value = dept.id;
                filterOption.textContent = dept.name;
                deptFilter.appendChild(filterOption);

                // For add form
                const addOption = document.createElement('option');
                addOption.value = dept.id;
                addOption.textContent = dept.name;
                addDeptSelect.appendChild(addOption);

                // For edit form
                const editOption = document.createElement('option');
                editOption.value = dept.id;
                editOption.textContent = dept.name;
                editDeptSelect.appendChild(editOption);
            });
        } else {
            // If no departments endpoint, use sample data
            const departments = [
                { id: 1, name: 'Computer Science' },
                { id: 2, name: 'Engineering' },
                { id: 3, name: 'Business Administration' },
                { id: 4, name: 'Arts and Humanities' }
            ];

            populateDepartmentDropdowns(departments);
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        // Use sample data on error
        const departments = [
            { id: 1, name: 'Computer Science' },
            { id: 2, name: 'Engineering' },
            { id: 3, name: 'Business Administration' },
            { id: 4, name: 'Arts and Humanities' }
        ];

        populateDepartmentDropdowns(departments);
    }
}

function populateDepartmentDropdowns(departments) {
    const deptFilter = document.getElementById('departmentFilter');
    const addDeptSelect = document.getElementById('department');
    const editDeptSelect = document.getElementById('editDepartment');

    departments.forEach(dept => {
        // For filter
        const filterOption = document.createElement('option');
        filterOption.value = dept.id;
        filterOption.textContent = dept.name;
        deptFilter.appendChild(filterOption);

        // For add form
        const addOption = document.createElement('option');
        addOption.value = dept.id;
        addOption.textContent = dept.name;
        addDeptSelect.appendChild(addOption);

        // For edit form
        const editOption = document.createElement('option');
        editOption.value = dept.id;
        editOption.textContent = dept.name;
        editDeptSelect.appendChild(editOption);
    });
}

// Load existing fee PDFs for selection
async function loadFeePdfs() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/fees`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const existingFeeSelect = document.getElementById('existingFeePdf');
            const editExistingFeeSelect = document.getElementById('editExistingFeePdf');

            // Clear existing options except the first one
            while (existingFeeSelect.children.length > 1) {
                existingFeeSelect.removeChild(existingFeeSelect.lastChild);
            }
            if (editExistingFeeSelect) {
                while (editExistingFeeSelect.children.length > 1) {
                    editExistingFeeSelect.removeChild(editExistingFeeSelect.lastChild);
                }
            }

            // Add fee PDF options to both dropdowns
            data.data.forEach(item => {
                // Add to Add Form
                const option = document.createElement('option');
                option.value = item.filename;
                option.textContent = item.displayName;

                existingFeeSelect.appendChild(option);

                // Add to Edit Form if it exists
                if (editExistingFeeSelect) {
                    const editOption = option.cloneNode(true);
                    editExistingFeeSelect.appendChild(editOption);
                }
            });
        }
    } catch (error) {
        console.error('Error loading fee PDFs:', error);
    }
}

// Toggle fee option sections
function toggleFeeOption(option) {
    const existingSection = document.getElementById('existingFeeSection');
    const newSection = document.getElementById('newFeeSection');

    if (option === 'existing') {
        existingSection.style.display = 'block';
        newSection.style.display = 'none';
    } else {
        existingSection.style.display = 'none';
        newSection.style.display = 'block';
    }
}

// Toggle fee option sections for Edit Modal
function toggleEditFeeOption(option) {
    const existingSection = document.getElementById('editExistingFeeSection');
    const newSection = document.getElementById('editNewFeeSection');

    if (option === 'existing') {
        existingSection.style.display = 'block';
        newSection.style.display = 'none';
    } else {
        existingSection.style.display = 'none';
        newSection.style.display = 'block';
    }
}

// Load courses
async function loadCourses() {
    try {
        const token = localStorage.getItem('admin_token');
        const search = document.getElementById('searchCourse').value;
        const departmentId = document.getElementById('departmentFilter').value;

        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            let courses = data.data;

            // Apply filters
            if (search) {
                const searchLower = search.toLowerCase();
                courses = courses.filter(course =>
                    course.course_name.toLowerCase().includes(searchLower) ||
                    course.course_code.toLowerCase().includes(searchLower) ||
                    course.department.toLowerCase().includes(searchLower)
                );
            }

            if (departmentId) {
                courses = courses.filter(course => course.department_id == departmentId);
            }

            renderCoursesTable(courses);
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        showNotification('Failed to load courses', 'error');
    }
}

// Render courses table
function renderCoursesTable(courses) {
    const tbody = document.getElementById('coursesTableBody');
    tbody.innerHTML = '';

    if (courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-book" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>No courses found</p>
                </td>
            </tr>
        `;
        return;
    }

    courses.forEach(course => {
        const row = document.createElement('tr');

        // Fee document cell content
        let feeDocumentCell = '<span class="text-muted">No fee document</span>';
        if (course.fee_structure_pdf_name) {
            const displayName = course.fee_structure_pdf_name.split('_').slice(1).join('_') || course.fee_structure_pdf_name;
            feeDocumentCell = `
                <a href="/fee/${course.fee_structure_pdf_name}" 
                   target="_blank" 
                   class="fee-pdf-link" 
                   title="View Fee PDF">
                    <i class="fas fa-file-pdf"></i> ${displayName}
                </a>
            `;
        }

        row.innerHTML = `
            <td>${course.course_name}</td>
            <td>${course.department || 'N/A'}</td>
            <td>KSh ${parseFloat(course.fee_per_term).toLocaleString()}</td>
            <td>KSh ${parseFloat(course.fee_per_year).toLocaleString()}</td>
            <td>${course.duration_years} year${course.duration_years > 1 ? 's' : ''}</td>
            <td>${feeDocumentCell}</td>
            <td>
                <span class="status-badge ${course.is_active ? 'status-admitted' : 'status-rejected'}">
                    ${course.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="openEditCourseModal(${course.course_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteCourse(${course.course_id}, '${course.course_name}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Open add course modal
function openAddCourseModal() {
    document.getElementById('addCourseForm').reset();
    document.getElementById('addCourseModal').style.display = 'flex';
}

// Add new course
async function addCourse(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Get fee option
    const feeOption = formData.get('feeOption');
    let feePdfName = '';

    try {
        const token = localStorage.getItem('admin_token');

        // 1. Handle Fee PDF (Selection or Upload)
        if (feeOption === 'new') {
            const feePdfFile = document.getElementById('feePdf').files[0];
            if (!feePdfFile) {
                showNotification('Please select a PDF file to upload', 'warning');
                return;
            }

            // Upload new fee PDF
            const feeFormData = new FormData();
            feeFormData.append('feePdf', feePdfFile);

            const uploadResponse = await fetch(`${API_BASE_URL}/${currentCampus}/fees/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: feeFormData
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResponse.ok) throw new Error(uploadResult.error || 'Failed to upload fee PDF');

            feePdfName = uploadResult.filename;
        } else {
            feePdfName = formData.get('existingFeePdf');
            if (!feePdfName) {
                showNotification('Please select an existing fee PDF', 'warning');
                return;
            }
        }

        // 2. Add course to both campuses with the PDF link
        const deptSelect = document.getElementById('department');
        const departmentName = deptSelect.options[deptSelect.selectedIndex].text;

        const courseData = {
            course_code: formData.get('course_code'),
            course_name: formData.get('name'),
            department: departmentName,
            department_id: parseInt(formData.get('department_id')),
            duration_years: parseInt(formData.get('duration_years')),
            fee_per_term: parseFloat(formData.get('fee_per_term')),
            fee_per_year: parseFloat(formData.get('fee_per_year')),
            minimum_kcse_grade: formData.get('minimum_kcse_grade'),
            fee_structure_pdf_name: feePdfName
        };

        const courseResponse = await fetch(`${API_BASE_URL}/courses/add-to-both`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });

        const courseResult = await courseResponse.json();
        if (!courseResponse.ok) throw new Error(courseResult.error || 'Failed to add course');

        showNotification('Course added successfully to both campuses', 'success');
        closeModal('addCourseModal');
        loadCourses();
        loadFeePdfs();

    } catch (error) {
        console.error('Error adding course:', error);
        showNotification(error.message, 'error');
    }
}

// Open edit course modal
async function openEditCourseModal(courseId) {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const course = data.data;

            // Populate form
            document.getElementById('editCourseId').value = course.course_id || course.id;
            document.getElementById('editCourseCode').value = course.course_code;
            document.getElementById('editCourseName').value = course.course_name || course.name;
            document.getElementById('editCourseDescription').value = course.description || '';

            // Fix department selection - ensure value is set correctly
            const editDeptSelect = document.getElementById('editDepartment');
            const departmentId = course.department_id;
            const departmentName = course.department;

            // Check if department option exists, if not, wait a bit and try again (in case departments are still loading)
            if (editDeptSelect.options.length <= 1) {
                await loadDepartments();
            }

            if (departmentId) {
                editDeptSelect.value = departmentId;

                // If still not set (e.g. type mismatch), try setting as string
                if (editDeptSelect.value === "" && departmentId) {
                    editDeptSelect.value = departmentId.toString();
                }
            }

            // Fallback to matching by name if ID didn't work or was null
            if ((!editDeptSelect.value || editDeptSelect.value === "") && departmentName) {
                console.log('Attempting to match department by name:', departmentName);
                for (let i = 0; i < editDeptSelect.options.length; i++) {
                    if (editDeptSelect.options[i].text.trim() === departmentName.trim()) {
                        editDeptSelect.selectedIndex = i;
                        console.log('Matched department by name:', departmentName);
                        break;
                    }
                }
            }

            // Fee Structure Pre-population
            const feePdf = course.fee_structure_pdf_name;
            const editExistingFeeSelect = document.getElementById('editExistingFeePdf');

            // default to existing
            document.querySelector('input[name="editFeeOption"][value="existing"]').checked = true;
            toggleEditFeeOption('existing');

            if (feePdf) {
                // Try to select existing PDF
                // If the list of PDFs comes from files (strings), match directly
                // If it comes from courses (ids), we might not be able to select if it's based on ID but we only have name
                // Assuming the dropdown values are filenames as per loadFeePdfs update for string arrays
                editExistingFeeSelect.value = feePdf;
            } else {
                editExistingFeeSelect.value = "";
            }

            document.getElementById('editDuration').value = course.duration_years;
            document.getElementById('editFeePerTerm').value = course.fee_per_term;
            document.getElementById('editFeePerYear').value = course.fee_per_year;
            document.getElementById('editIsActive').checked = course.is_active;

            document.getElementById('editCourseModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading course details:', error);
        showNotification('Failed to load course details', 'error');
    }
}

// Update course
async function updateCourse(e) {
    e.preventDefault();

    const form = e.target;
    const courseId = document.getElementById('editCourseId').value;
    const formData = new FormData(form);
    const deptSelect = document.getElementById('editDepartment');
    const departmentName = deptSelect.options[deptSelect.selectedIndex].text;

    // Fee Logic
    const feeOption = document.querySelector('input[name="editFeeOption"]:checked').value;
    let feePdfName = formData.get('existingFeePdf'); // Default to existing selection properly from formData if possible OR explicit get

    // Note: formData.get('existingFeePdf') gets the value from the select.

    // Prepare initial data object
    const data = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Convert numeric fields
    data.course_name = data.name || data.course_name;
    data.department = departmentName;
    data.fee_per_term = parseFloat(data.fee_per_term);
    data.fee_per_year = parseFloat(data.fee_per_year);
    data.duration_years = parseInt(data.duration_years);
    data.department_id = parseInt(data.department_id);
    data.is_active = document.getElementById('editIsActive').checked;

    try {
        const token = localStorage.getItem('admin_token');

        // Handle Fee Upload
        if (feeOption === 'new') {
            const feePdfInput = document.getElementById('editFeePdf');
            const feePdfFile = feePdfInput.files[0];

            if (feePdfFile) {
                const feeFormData = new FormData();
                feeFormData.append('feePdf', feePdfFile);

                const uploadResponse = await fetch(`${API_BASE_URL}/${currentCampus}/fees/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: feeFormData
                });

                const uploadResult = await uploadResponse.json();
                if (!uploadResponse.ok) throw new Error(uploadResult.error || 'Failed to upload new fee PDF');
                feePdfName = uploadResult.filename;
            }
        }

        data.fee_structure_pdf_name = feePdfName;

        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showNotification('Course updated successfully', 'success');
            closeModal('editCourseModal');
            loadCourses();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update course');
        }
    } catch (error) {
        console.error('Error updating course:', error);
        showNotification(error.message, 'error');
    }
}

// Delete course
async function deleteCourse(courseId, courseName) {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Course deleted successfully', 'success');
            loadCourses();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete course');
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        showNotification(error.message, 'error');
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Debounce function
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

// Close modal on outside click
window.onclick = function (event) {
    const modals = ['addCourseModal', 'editCourseModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            closeModal(modalId);
        }
    });
};
