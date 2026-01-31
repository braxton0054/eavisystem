// Settings Page Script

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadSettings();
    loadIntakeDates();

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

// Save campus settings (Sequence + Intake Dates)
async function saveSettings(e) {
    e.preventDefault();

    const token = localStorage.getItem('admin_token');
    if (!token) {
        showNotification('Authentication required', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        // 1. Save General Settings
        const settingsData = {
            admission_number_format: document.getElementById('numberFormat').value,
            admission_starting_number: parseInt(document.getElementById('startingNumber').value),
            // Legacy fields - sending null or current value to satisfy strict schema if needed.
            // But we can likely ignore them if backend allows nullable.
            // Let's check: previous code cleared them to null.
            reporting_date_term1: null,
            reporting_date_term2: null,
            reporting_date_term3: null
        };

        const settingsResponse = await fetch(`${API_BASE_URL}/${currentCampus}/settings`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
        });

        const settingsResult = await settingsResponse.json();
        if (!settingsResponse.ok || !settingsResult.success) throw new Error(settingsResult.error || 'Failed to save general settings');

        // 2. Save Intake Dates
        const intakeDates = [];
        document.querySelectorAll('.month-input').forEach(input => {
            intakeDates.push({
                month: input.dataset.month,
                reporting_date: input.value || null
            });
        });

        const datesResponse = await fetch(`${API_BASE_URL}/${currentCampus}/intake-dates`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ dates: intakeDates })
        });

        const datesResult = await datesResponse.json();
        if (!datesResponse.ok) throw new Error(datesResult.error || 'Failed to save intake dates');

        showNotification('All settings saved successfully', 'success');

    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification(error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Load Intake Dates
async function loadIntakeDates() {
    const container = document.getElementById('intakeCalendarGrid');
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/${currentCampus}/intake-dates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        container.innerHTML = ''; // Clear loading

        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Merge fetched data with default months ensuring order
        const dataMap = new Map();
        if (result.data) {
            result.data.forEach(d => dataMap.set(d.month, d.reporting_date));
        }

        monthOrder.forEach(month => {
            const dateVal = dataMap.get(month);
            const formattedDate = dateVal ? formatDateForInput(dateVal) : '';

            const card = document.createElement('div');
            card.className = 'month-card';
            card.style.border = '1px solid #eee';
            card.style.padding = '1rem';
            card.style.borderRadius = '8px';
            card.style.background = '#f9f9f9';

            card.innerHTML = `
                <h4 style="margin:0 0 0.5rem 0; font-size:1rem; color:#333;">${month}</h4>
                <input type="date" class="form-control month-input" 
                       data-month="${month}" 
                       value="${formattedDate}" 
                       style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:4px;">
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading intake dates:', error);
        container.innerHTML = '<p style="color:red">Failed to load intake calendar.</p>';
    }
}

