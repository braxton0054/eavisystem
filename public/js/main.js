// Main JavaScript file for the frontend

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuToggle = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (event) {
        if (navLinks && navLinks.classList.contains('active') &&
            !navLinks.contains(event.target) &&
            !mobileMenuToggle.contains(event.target)) {
            navLinks.classList.remove('active');
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (navLinks) {
                    navLinks.style.display = 'none';
                }
            }
        });
    });

    // Add current year to footer
    const yearSpan = document.querySelector('#currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});

// Form validation helper
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--accent-color)';
            isValid = false;

            // Focus on first invalid input
            if (isValid === false) {
                input.focus();
                isValid = null; // Prevent changing focus multiple times
            }
        } else {
            input.style.borderColor = '';
        }
    });

    return isValid;
}

// File upload preview
function setupFileUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (input && preview) {
        input.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (preview.tagName === 'IMG') {
                        preview.src = e.target.result;
                    } else {
                        preview.innerHTML = `
                            <div class="file-preview">
                                <i class="fas fa-file-alt"></i>
                                <div>
                                    <strong>${file.name}</strong>
                                    <small>${formatFileSize(file.size)}</small>
                                </div>
                            </div>
                        `;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Password visibility toggle
function setupPasswordToggle(passwordId, toggleId) {
    const passwordInput = document.getElementById(passwordId);
    const toggleButton = document.getElementById(toggleId);

    if (passwordInput && toggleButton) {
        toggleButton.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
}

// Countdown timer
function startCountdown(elementId, targetDate) {
    const countdownElement = document.getElementById(elementId);

    if (!countdownElement) return;

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = new Date(targetDate).getTime() - now;

        if (distance < 0) {
            countdownElement.innerHTML = 'Expired';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `
            <div class="countdown-item">
                <span class="countdown-value">${days}</span>
                <span class="countdown-label">Days</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${hours}</span>
                <span class="countdown-label">Hours</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${minutes}</span>
                <span class="countdown-label">Minutes</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${seconds}</span>
                <span class="countdown-label">Seconds</span>
            </div>
        `;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Format file size (duplicated from utils.js for standalone use)
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export utility functions to global scope
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.createAlert = createAlert;
window.copyToClipboard = copyToClipboard;
window.formatFileSize = formatFileSize;
