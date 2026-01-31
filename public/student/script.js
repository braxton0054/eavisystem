// Dynamic course data from API
let coursesData = {};
let departmentsData = {};
let currentCampus = '';
const API_BASE_URL = ''; // Empty string means use relative paths

// Student admission lookup
async function lookupAdmission() {
    const phone = document.getElementById('lookupPhone').value.trim();
    const campus = document.getElementById('lookupCampus').value;
    const resultDiv = document.getElementById('lookupResult');

    if (!phone) {
        alert('Please enter your phone number');
        return;
    }

    // ... (previous code) ...
    try {
        const btn = document.querySelector('.btn-lookup');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        btn.disabled = true;

        let usedCampus = campus;
        let response = await fetch(`/api/${campus}/students/lookup/phone?phone=${encodeURIComponent(phone)}`);

        // If not found in selected campus, try the other one automatically
        if (response.status === 404) {
            const otherCampus = campus === 'west' ? 'twon' : 'west';
            const otherResponse = await fetch(`/api/${otherCampus}/students/lookup/phone?phone=${encodeURIComponent(phone)}`);

            if (otherResponse.ok) {
                response = otherResponse;
                usedCampus = otherCampus;
                // Update the dropdown to match where we found them (optional but helpful)
                document.getElementById('lookupCampus').value = otherCampus;
            }
        }

        const result = await response.json();

        resultDiv.style.display = 'block';

        if (response.ok && result.success) {
            const student = result.data;
            // Use 'usedCampus' which might be different from the originally selected 'campus'
            const pdfUrl = `/api/${usedCampus}/students/download/${encodeURIComponent(student.admission_number)}`;
            const feeUrl = student.fee_structure_pdf_name ? `/fee/${student.fee_structure_pdf_name}` : null;

            resultDiv.innerHTML = `
                <div class="lookup-result-card">
                    <h5 style="color: #27ae60; margin-bottom: 0.5rem;"><i class="fas fa-check-circle"></i> Admission Found!</h5>
                    <p><strong>Name:</strong> ${student.full_name}</p>
                    <p><strong>Admission No:</strong> ${student.admission_number}</p>
                    <p><strong>Course:</strong> ${student.course_name}</p>
                    <div class="download-buttons" style="margin-top: 1rem; justify-content: flex-start;">
                        <a href="${pdfUrl}" class="btn-download" target="_blank" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                            <i class="fas fa-file-pdf"></i> Admission Package
                        </a>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="lookup-result-card" style="border-left-color: #e74c3c;">
                    <h5 style="color: #e74c3c; margin-bottom: 0.5rem;"><i class="fas fa-times-circle"></i> Not Found</h5>
                    <p>${result.error || 'No record found for this phone number at the selected campus.'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lookup error:', error);
        alert('An error occurred while looking up your admission.');
    } finally {
        const btn = document.querySelector('.btn-lookup');
        btn.innerHTML = '<i class="fas fa-search"></i> Check Status';
        btn.disabled = false;
    }
}

// Fetch departments and courses from API
async function fetchCourseData(campus) {
    const departmentSelect = document.getElementById('department');
    const originalText = departmentSelect.options[0].textContent;
    departmentSelect.options[0].textContent = 'Loading Departments...';

    try {
        const courseResponse = await fetch(`/api/${campus}/courses`);
        if (courseResponse.ok) {
            const courseResult = await courseResponse.json();

            if (courseResult.success && courseResult.data && courseResult.data.length > 0) {
                coursesData = {};
                departmentsData = {};

                courseResult.data.forEach(course => {
                    const deptName = course.department || 'General';
                    if (!departmentsData[deptName]) {
                        departmentsData[deptName] = deptName;
                    }

                    if (!coursesData[deptName]) {
                        coursesData[deptName] = [];
                    }
                    coursesData[deptName].push({
                        id: course.course_id,
                        name: course.course_name,
                        duration: `${course.duration_years} year${course.duration_years > 1 ? 's' : ''}`,
                        fee_term: `KSh ${course.fee_per_term}`,
                        fee_year: `KSh ${course.fee_per_year}`,
                        department: course.department,
                        minimum_kcse_grade: course.minimum_kcse_grade || 'C-'
                    });
                });

                updateDepartmentDropdown();
                departmentSelect.options[0].textContent = 'Select Department';
                return;
            }
        }

        console.warn('API fetch returned no data or failed, using fallback');
        useFallbackData();

    } catch (error) {
        console.error('Error fetching course data:', error);
        useFallbackData();
    } finally {
        if (departmentSelect.options[0].textContent === 'Loading Departments...') {
            departmentSelect.options[0].textContent = 'Select Department';
        }
    }
}

// Fallback data if API is not available
function useFallbackData() {
    coursesData = {
        '1': [ // Computer Science Department
            { id: 1, name: 'Computer Science', duration: '4 years', fee_term: 'KSh 1,500', fee_year: 'KSh 4,500' },
            { id: 2, name: 'Software Engineering', duration: '4 years', fee_term: 'KSh 1,600', fee_year: 'KSh 4,800' },
            { id: 3, name: 'Information Technology', duration: '3 years', fee_term: 'KSh 1,400', fee_year: 'KSh 4,200' }
        ],
        '2': [ // Engineering Department
            { id: 4, name: 'Electrical Engineering', duration: '4 years', fee_term: 'KSh 1,600', fee_year: 'KSh 4,800' },
            { id: 5, name: 'Civil Engineering', duration: '4 years', fee_term: 'KSh 1,550', fee_year: 'KSh 4,650' },
            { id: 6, name: 'Mechanical Engineering', duration: '4 years', fee_term: 'KSh 1,650', fee_year: 'KSh 4,950' }
        ],
        '3': [ // Business Department
            { id: 7, name: 'Business Administration', duration: '3 years', fee_term: 'KSh 1,400', fee_year: 'KSh 4,200' },
            { id: 8, name: 'Accounting', duration: '3 years', fee_term: 'KSh 1,350', fee_year: 'KSh 4,050' },
            { id: 9, name: 'Marketing', duration: '3 years', fee_term: 'KSh 1,300', fee_year: 'KSh 3,900' }
        ],
        '4': [ // Arts Department
            { id: 10, name: 'Fine Arts', duration: '3 years', fee_term: 'KSh 1,200', fee_year: 'KSh 3,600' },
            { id: 11, name: 'Journalism', duration: '3 years', fee_term: 'KSh 1,250', fee_year: 'KSh 3,750' },
            { id: 12, name: 'English Literature', duration: '3 years', fee_term: 'KSh 1,150', fee_year: 'KSh 3,450' }
        ]
    };

    departmentsData = {
        '1': 'Computer Science',
        '2': 'Engineering',
        '3': 'Business Administration',
        '4': 'Arts and Humanities'
    };

    updateDepartmentDropdown();
}

// Update department dropdown with fetched data
function updateDepartmentDropdown() {
    const departmentSelect = document.getElementById('department');
    departmentSelect.innerHTML = '<option value="">Select Department</option>';

    Object.keys(departmentsData).forEach(deptName => {
        const option = document.createElement('option');
        option.value = deptName;
        option.textContent = deptName;
        departmentSelect.appendChild(option);
    });
}

let currentStep = 1;
const totalSteps = 3;

// Step navigation
function nextStep() {
    if (!validateCurrentStep()) return;

    if (currentStep === 2) {
        if (!validateCourseEligibility()) return;
    }

    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');

    currentStep++;

    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');

    if (currentStep === 3) {
        updateReviewSection();
    }
}

function prevStep() {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');

    currentStep--;

    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
}

// Calculate age from DOB
function calculateAge(dobString) {
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

// Validate current step
function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input[required], select[required]');

    for (let input of inputs) {
        if (!input.value.trim()) {
            alert(`Please fill in ${input.labels[0].textContent}`);
            input.focus();
            return false;
        }
    }

    // Age validation for Step 1
    if (currentStep === 1) {
        const dobValue = document.getElementById('dob').value;
        if (dobValue) {
            const age = calculateAge(dobValue);
            if (age < 16) {
                alert('DETAILS ERROR CONTACT ADMISSION FOR MORE INFORMATION');
                document.getElementById('dob').focus();
                return false;
            }
        }
    }

    return true;
}

// Validate course eligibility
function validateCourseEligibility() {
    const courseSelect = document.getElementById('course');
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const studentGrade = document.getElementById('kcse_grade').value;

    if (!selectedOption || !selectedOption.value) {
        alert('Please select a course');
        return false;
    }

    const minGrade = selectedOption.dataset.minimumGrade;
    if (!compareGrades(studentGrade, minGrade)) {
        showSuggestionsModal(studentGrade, selectedOption.textContent);
        return false;
    }

    return true;
}

// Show suggestions modal/section
function showSuggestionsModal(studentGrade, attemptedCourse) {
    let suggestionsContainer = document.getElementById('courseSuggestions');

    if (!suggestionsContainer) {
        // Create suggestions container if it doesn't exist
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'courseSuggestions';
        suggestionsContainer.className = 'suggestions-section';
        suggestionsContainer.style.marginTop = '2rem';
        suggestionsContainer.style.padding = '1.5rem';
        suggestionsContainer.style.backgroundColor = '#fff3cd';
        suggestionsContainer.style.border = '1px solid #ffeeba';
        suggestionsContainer.style.borderRadius = '12px';

        const step2 = document.getElementById('step2');
        step2.insertBefore(suggestionsContainer, step2.querySelector('.form-buttons'));
    }

    suggestionsContainer.innerHTML = `
        <h4 style="color: #856404; margin-bottom: 1rem;"><i class="fas fa-exclamation-triangle"></i> Grade Requirement Not Met</h4>
        <p style="margin-bottom: 1rem;">Unfortunately, your grade of <strong>${studentGrade}</strong> is below the requirement for <strong>${attemptedCourse}</strong>. Please choose one of the following courses you are eligible for:</p>
        <div id="suggestionsList" class="suggestions-grid"></div>
    `;

    const list = document.getElementById('suggestionsList');

    // Find all eligible courses
    const eligibleCourses = [];
    Object.keys(coursesData).forEach(deptName => {
        coursesData[deptName].forEach(course => {
            if (compareGrades(studentGrade, course.minimum_kcse_grade)) {
                eligibleCourses.push(course);
            }
        });
    });

    if (eligibleCourses.length === 0) {
        list.innerHTML = '<p>No courses found for your grade level. Please contact admissions for guidance.</p>';
    } else {
        // Show top 6 eligible courses
        eligibleCourses.slice(0, 6).forEach(course => {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.innerHTML = `
                <h5>${course.name}</h5>
                <p><small>Min Grade: ${course.minimum_kcse_grade}</small></p>
                <button type="button" class="btn-select-suggest" onclick="selectSuggestedCourse('${course.department}', ${course.id})">Select This Course</button>
            `;
            list.appendChild(card);
        });
    }

    suggestionsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Select a suggested course
function selectSuggestedCourse(deptName, courseId) {
    document.getElementById('department').value = deptName;
    loadCourses(); // This will trigger reload and reset eligibility status

    // Set the course
    setTimeout(() => {
        const courseSelect = document.getElementById('course');
        courseSelect.value = courseId;
        courseSelect.dispatchEvent(new Event('change'));

        // Remove suggestions once selected
        const suggestions = document.getElementById('courseSuggestions');
        if (suggestions) suggestions.remove();

        // Show success message
        alert('Course switched successfully! You can now proceed to review.');
    }, 100);
}

// Load courses based on department selection
function loadCourses() {
    const departmentId = document.getElementById('department').value;
    const courseSelect = document.getElementById('course');
    const courseDetails = document.getElementById('courseDetails');
    const studentKCSEGrade = document.getElementById('kcse_grade').value;

    if (!departmentId) {
        courseSelect.innerHTML = '<option value="">Select Department First</option>';
        courseSelect.disabled = true;
        courseDetails.style.display = 'none';
        return;
    }

    courseSelect.innerHTML = '<option value="">Select a Course</option>';
    courseSelect.disabled = false;

    const availableCourses = [];
    const unavailableCourses = [];

    coursesData[departmentId].forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        option.dataset.duration = course.duration;
        option.dataset.feeTerm = course.fee_term;
        option.dataset.feeYear = course.fee_year;
        option.dataset.minimumGrade = course.minimum_kcse_grade;

        // Check if student meets KCSE grade requirement
        const meetsRequirement = compareGrades(studentKCSEGrade, course.minimum_kcse_grade);

        if (meetsRequirement) {
            option.style.color = '#28a745'; // Green for eligible
            availableCourses.push(option);
        } else {
            option.style.color = '#dc3545'; // Red for ineligible
            unavailableCourses.push(option);
        }

        courseSelect.appendChild(option);
    });

    // Add separator between available and unavailable courses
    if (unavailableCourses.length > 0) {
        const separator = document.createElement('option');
        separator.value = '';
        separator.textContent = '--- Courses Below Your KCSE Grade ---';
        separator.disabled = true;
        separator.style.color = '#999';
        courseSelect.appendChild(separator);

        unavailableCourses.forEach(option => {
            courseSelect.appendChild(option);
        });
    }

    // Reset course details
    document.getElementById('courseDuration').textContent = '-';
    document.getElementById('courseFeeTerm').textContent = '-';
    document.getElementById('courseFeeYear').textContent = '-';
    courseDetails.style.display = 'none';
}

// Show course details when selected
document.getElementById('course').addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    const courseDetails = document.getElementById('courseDetails');
    const studentKCSEGrade = document.getElementById('kcse_grade').value;

    if (selectedOption && selectedOption.value) {
        const meetsRequirement = compareGrades(studentKCSEGrade, selectedOption.dataset.minimumGrade);

        // Update course details
        document.getElementById('courseDuration').textContent = selectedOption.dataset.duration;
        document.getElementById('courseFeeTerm').textContent = selectedOption.dataset.feeTerm;
        document.getElementById('courseFeeYear').textContent = selectedOption.dataset.feeYear;

        // Show eligibility status
        let eligibilityStatus = document.getElementById('eligibilityStatus');
        if (!eligibilityStatus) {
            eligibilityStatus = document.createElement('div');
            eligibilityStatus.id = 'eligibilityStatus';
            eligibilityStatus.style.marginTop = '1rem';
            eligibilityStatus.style.padding = '0.75rem';
            eligibilityStatus.style.borderRadius = '8px';
            eligibilityStatus.style.textAlign = 'center';
            eligibilityStatus.style.fontWeight = '500';
            courseDetails.appendChild(eligibilityStatus);
        }

        if (meetsRequirement) {
            eligibilityStatus.style.backgroundColor = '#d4edda';
            eligibilityStatus.style.color = '#155724';
            eligibilityStatus.textContent = '✅ You meet the KCSE grade requirement for this course!';
        } else {
            eligibilityStatus.style.backgroundColor = '#f8d7da';
            eligibilityStatus.style.color = '#721c24';
            eligibilityStatus.textContent = '❌ Your KCSE grade is below the minimum requirement (' + selectedOption.dataset.minimumGrade + ')';
        }

        courseDetails.style.display = 'block';
    } else {
        courseDetails.style.display = 'none';
    }
});

// Compare KCSE grades
function compareGrades(studentGrade, minimumGrade) {
    if (!studentGrade || !minimumGrade) return true; // Default to true if grades not set properly

    const gradeOrder = ['A', 'A−', 'A-', 'B+', 'B', 'B−', 'B-', 'C+', 'C', 'C−', 'C-', 'D+', 'D', 'D−', 'D-', 'E'];

    // Standardize grades (handle both dash types)
    const normalize = (g) => g.replace('−', '-');
    const sGrade = normalize(studentGrade);
    const mGrade = normalize(minimumGrade);

    const sIdx = gradeOrder.findIndex(g => normalize(g) === sGrade);
    const mIdx = gradeOrder.findIndex(g => normalize(g) === mGrade);

    // Higher index means lower grade in our list, so student index must be <= minimum index
    return sIdx <= mIdx;
}

// Reload courses when KCSE grade changes
document.getElementById('kcse_grade').addEventListener('change', function () {
    const department = document.getElementById('department').value;
    if (department) {
        loadCourses(); // Reload courses with new grade validation
    }
});

// Update review section
function updateReviewSection() {
    const form = document.getElementById('admissionForm');
    const formData = new FormData(form);

    // Personal Info
    document.getElementById('reviewName').textContent = formData.get('full_name');
    document.getElementById('reviewEmail').textContent = formData.get('email');
    document.getElementById('reviewPhone').textContent = formData.get('phone');
    document.getElementById('reviewDOB').textContent = formData.get('date_of_birth');
    document.getElementById('reviewKCSEGrade').textContent = formData.get('kcse_grade');

    // Campus
    const campus = formData.get('campus');
    document.getElementById('reviewCampus').textContent =
        campus === 'west' ? 'West Campus' : 'Twon Campus';

    // Location
    document.getElementById('reviewLocation').textContent = formData.get('location');

    // Course Info
    const departmentId = formData.get('department');
    const courseId = formData.get('course_id');

    if (departmentId && courseId) {
        const departmentName = departmentsData[departmentId];
        const course = coursesData[departmentId].find(c => c.id == courseId);

        if (departmentName && course) {
            document.getElementById('reviewDepartment').textContent = departmentName;
            document.getElementById('reviewCourse').textContent = course.name;
            document.getElementById('reviewDuration').textContent = course.duration;
            document.getElementById('reviewFee').textContent = course.fee_year;
        }
    }
}

// Campus change handler
document.addEventListener('DOMContentLoaded', function () {
    // Add event listeners to campus radio buttons
    const campusRadios = document.querySelectorAll('input[name="campus"]');
    campusRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.value) {
                currentCampus = this.value;
                fetchCourseData(currentCampus);
            }
        });
    });

    // Initialize with fallback data
    useFallbackData();
});

// Form submission
document.getElementById('admissionForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!document.getElementById('terms').checked) {
        alert('Please agree to the terms and conditions');
        return;
    }

    const form = e.target;
    const formData = new FormData(form);

    // Map frontend form fields to backend schema
    const data = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone_number: formData.get('phone'), // Map 'phone' to 'phone_number'
        date_of_birth: formData.get('date_of_birth'),
        location: formData.get('location'),
        course_id: parseInt(formData.get('course_id')),
        kcse_grade: formData.get('kcse_grade'),
        term: 1 // Default to term 1
    };

    try {
        // Show loading
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        // Get selected campus
        const campus = formData.get('campus');

        // Call the correct API endpoint
        const response = await fetch(`/api/${campus}/registration/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Show success modal with admission details
            document.getElementById('admissionNumber').textContent = result.data.admission_number;

            // Set download links
            const admLink = document.getElementById('downloadLink');
            // const feeLink = document.getElementById('feeDownloadLink'); // Removed

            admLink.href = `/api/${campus}/students/download/${encodeURIComponent(result.data.admission_number)}`;

            // if (result.data.fee_structure_pdf_name) { // Removed
            //     feeLink.href = `/fee/${result.data.fee_structure_pdf_name}`; // Removed
            //     feeLink.style.display = 'inline-block'; // Removed
            // } else { // Removed
            //     feeLink.style.display = 'none'; // Removed
            // } // Removed

            document.getElementById('successModal').style.display = 'flex';

            // Automatic downloads
            setTimeout(() => {
                const triggerDownload = (url, filename) => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => document.body.removeChild(link), 100);
                };

                console.log('Starting automatic downloads...');

                // Download admission package
                triggerDownload(admLink.href, `Admission_${result.data.admission_number}.pdf`);

                // showNotification('Registration successful! Your admission package is downloading.', 'success'); // Assuming this function is defined elsewhere
            }, 800);

            // Reset form
            form.reset();
            currentStep = 1;
            document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
            document.querySelectorAll('.progress-step').forEach(step => step.classList.remove('active'));
            document.getElementById('step1').classList.add('active');
            document.querySelector('[data-step="1"]').classList.add('active');

            // Reset course selection
            document.getElementById('course').innerHTML = '<option value="">Select Department First</option>';
            document.getElementById('course').disabled = true;
            document.getElementById('courseDetails').style.display = 'none';

        } else {
            throw new Error(result.error || result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        // Reset button
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.innerHTML = 'Submit Application';
        submitBtn.disabled = false;
    }
});

// Close modal
function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    window.location.href = '../index.html';
}

// Close modal on outside click
window.onclick = function (event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeModal();
    }
};
