// Utility functions for the frontend

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number
function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Show loading spinner
function showLoading(element) {
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    element.disabled = true;
}

// Hide loading spinner
function hideLoading(element, originalText) {
    element.innerHTML = originalText;
    element.disabled = false;
}

// Get query parameters
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Set query parameters
function setQueryParam(name, value) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set(name, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
}

// Create alert message
function createAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles
    alert.style.cssText = `
        padding: 12px 20px;
        border-radius: var(--border-radius);
        margin: 1rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        alert.style.backgroundColor = '#d4edda';
        alert.style.color = '#155724';
        alert.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
        alert.style.backgroundColor = '#f8d7da';
        alert.style.color = '#721c24';
        alert.style.border = '1px solid #f5c6cb';
    } else if (type === 'warning') {
        alert.style.backgroundColor = '#fff3cd';
        alert.style.color = '#856404';
        alert.style.border = '1px solid #ffeaa7';
    } else {
        alert.style.backgroundColor = '#d1ecf1';
        alert.style.color = '#0c5460';
        alert.style.border = '1px solid #bee5eb';
    }
    
    alert.querySelector('button').style.cssText = `
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: inherit;
    `;
    
    return alert;
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showNotification('Failed to copy to clipboard', 'error');
    });
}

// Generate random ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Calculate age from date of birth
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if device is mobile
function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
