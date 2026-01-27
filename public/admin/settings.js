// Settings Page Script

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadSettings();

    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
});

// Load campus settings
async function loadSettings() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/settings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            const settings = result.data;
            document.getElementById('numberFormat').value = settings.admission_number_format || '';
            document.getElementById('startingNumber').value = settings.admission_starting_number || '';

            // Populate dates if they exist
            if (settings.reporting_date_term1) document.getElementById('term1Date').value = formatDateForInput(settings.reporting_date_term1);
            if (settings.reporting_date_term2) document.getElementById('term2Date').value = formatDateForInput(settings.reporting_date_term2);
            if (settings.reporting_date_term3) document.getElementById('term3Date').value = formatDateForInput(settings.reporting_date_term3);

        } else {
            showNotification(result.error || 'Failed to load settings', 'error');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Failed to load settings', 'error');
    }
}

// Helper to format ISO date to YYYY-MM-DD
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
}

// Save campus settings
async function saveSettings(e) {
    e.preventDefault();

    const token = localStorage.getItem('admin_token');
    if (!token) {
        showNotification('Authentication required', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const data = {
        admission_number_format: document.getElementById('numberFormat').value,
        admission_starting_number: parseInt(document.getElementById('startingNumber').value),
        reporting_date_term1: document.getElementById('term1Date').value,
        reporting_date_term2: document.getElementById('term2Date').value,
        reporting_date_term3: document.getElementById('term3Date').value
    };

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/${currentCampus}/settings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showNotification('Settings saved successfully', 'success');
        } else {
            // Display strict validation error from backend
            showNotification(result.error || 'Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
