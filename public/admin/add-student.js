// Add Student Script
let selectedCourseData = null;

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadDepartmentsForStudent();

    // Form submission
    document.getElementById('addStudentForm').addEventListener('submit', addStudentManually);

    // Course selection event
    document.getElementById('studentCourse').addEventListener('change', function () {
        updateCoursePreview();
    });
});

// Load departments for student form
async function loadDepartmentsForStudent() {
    try {
        const token = localStorage.getItem('admin_token');
        console.log(`Fetching departments for ${currentCampus}...`);

        // Fetch departments
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/departments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Departments loaded:', data.data);
            const deptSelect = document.getElementById('studentDepartment');

            // Clear existing options except the first one
            while (deptSelect.children.length > 1) deptSelect.removeChild(deptSelect.lastChild);

            // Add department options
            if (data.data && data.data.length > 0) {
                data.data.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.textContent = dept.name;
                    deptSelect.appendChild(option);
                });
            } else {
                console.warn('No departments found in backend');
                showNotification('No departments found. Please add departments first.', 'warning');
            }
        } else {
            console.error('Failed to load departments:', response.status);
            showNotification('Failed to load departments from server.', 'error');
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        showNotification('Error connecting to server to load departments.', 'error');
    }
}

// Load courses for selected department
async function loadStudentCourses() {
    const departmentId = document.getElementById('studentDepartment').value;
    const courseSelect = document.getElementById('studentCourse');
    const coursePreview = document.getElementById('coursePreview');

    console.log('Loading courses for department:', departmentId);

    if (!departmentId) {
        courseSelect.innerHTML = '<option value="">Select Department First</option>';
        courseSelect.disabled = true;
        coursePreview.style.display = 'none';
        selectedCourseData = null;
        return;
    }

    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Filter by department_id and ensure fields match backend names
            const courses = data.data.filter(course =>
                (course.department_id == departmentId || course.department == departmentId) &&
                course.is_active
            );

            console.log('Filtered courses:', courses);

            courseSelect.innerHTML = '<option value="">Select a Course</option>';
            courseSelect.disabled = false;

            if (courses.length === 0) {
                courseSelect.innerHTML = '<option value="">No courses available for this department</option>';
                courseSelect.disabled = true;
                coursePreview.style.display = 'none';
                selectedCourseData = null;
                return;
            }

            courses.forEach(course => {
                const option = document.createElement('option');
                // Backend uses course_id and course_name
                option.value = course.course_id || course.id;
                option.textContent = course.course_name || course.name;
                option.dataset.duration = course.duration_years;
                option.dataset.feeTerm = course.fee_per_term;
                option.dataset.feeYear = course.fee_per_year;
                courseSelect.appendChild(option);
            });

            // Reset preview
            coursePreview.style.display = 'none';
            selectedCourseData = null;
        } else {
            console.error('Failed to load courses:', response.status);
            showNotification('Failed to load courses from server.', 'error');
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        showNotification('Error connecting to server to load courses.', 'error');
    }
}

// Update course preview
function updateCoursePreview() {
    const selectedOption = document.getElementById('studentCourse').selectedOptions[0];
    const coursePreview = document.getElementById('coursePreview');

    if (selectedOption.value) {
        document.getElementById('previewDuration').textContent = `${selectedOption.dataset.duration} year${selectedOption.dataset.duration > 1 ? 's' : ''}`;
        document.getElementById('previewFeeTerm').textContent = `KSh ${parseFloat(selectedOption.dataset.feeTerm).toLocaleString()}`;
        document.getElementById('previewFeeYear').textContent = `KSh ${parseFloat(selectedOption.dataset.feeYear).toLocaleString()}`;
        coursePreview.style.display = 'block';

        selectedCourseData = {
            id: selectedOption.value,
            name: selectedOption.textContent,
            duration: selectedOption.dataset.duration,
            feeTerm: selectedOption.dataset.feeTerm,
            feeYear: selectedOption.dataset.feeYear
        };
    } else {
        coursePreview.style.display = 'none';
        selectedCourseData = null;
    }
}

// Add student manually
async function addStudentManually(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Add campus to data
    data.campus = currentCampus;

    try {
        const token = localStorage.getItem('admin_token');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Student...';
        submitBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/${currentCampus}/registration/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Show success modal
            document.getElementById('generatedAdmissionNumber').textContent = result.data.admission_number;

            const statusSpan = document.getElementById('generatedStatus');
            statusSpan.textContent = data.status;
            statusSpan.className = `status-${data.status}`;

            document.getElementById('successModal').style.display = 'flex';

            // Store admission number for viewing later
            window.lastAddedAdmissionNumber = result.data.admission_number;

            // Reset form
            form.reset();
            loadDepartmentsForStudent(); // Reset department select
        } else {
            throw new Error(result.error || 'Failed to add student');
        }
    } catch (error) {
        console.error('Error adding student:', error);
        showNotification(error.message, 'error');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// View added student
function viewStudent() {
    if (window.lastAddedAdmissionNumber) {
        window.location.href = `students.html?search=${window.lastAddedAdmissionNumber}`;
    } else {
        window.location.href = 'students.html';
    }
}

// Close modal on outside click
window.onclick = function (event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeSuccessModal();
    }
};
