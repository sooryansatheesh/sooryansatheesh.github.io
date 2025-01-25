document.addEventListener('DOMContentLoaded', () => {
    console.log('Settings JS loaded');
    
    const clearDataBtn = document.getElementById('clearDataBtn');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');
    const exportJSONBtn = document.getElementById('exportJSON');
    const exportCSVBtn = document.getElementById('exportCSV');

    // Verify buttons are found
    console.log('Export JSON button:', exportJSONBtn);
    console.log('Export CSV button:', exportCSVBtn);

    if (exportJSONBtn) {
        exportJSONBtn.addEventListener('click', () => {
            console.log('Export JSON clicked');
            exportDataAsJSON();
        });
    }

    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', () => {
            console.log('Export CSV clicked');
            exportDataAsCSV();
        });
    }

    // Clear data functionality
    clearDataBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'block';
    });

    confirmDelete.addEventListener('click', () => {
        localStorage.removeItem('journalEntries');
        localStorage.removeItem('trips');
        localStorage.removeItem('routes');
        confirmationModal.style.display = 'none';
        alert('All data has been successfully cleared.');
    });

    cancelDelete.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });
});

function exportDataAsJSON() {
    try {
        console.log('Starting JSON export');
        const exportData = {
            trips: JSON.parse(localStorage.getItem('trips') || '[]'),
            journalEntries: JSON.parse(localStorage.getItem('journalEntries') || '[]'),
            routes: JSON.parse(localStorage.getItem('routes') || '[]')
        };
        
        console.log('Data to export:', exportData);

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `waylytics_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        console.log('Triggering download');
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting JSON:', error);
        alert('Error exporting data. Please try again.');
    }
}

function exportDataAsCSV() {
    try {
        console.log('Starting CSV export');
        const trips = JSON.parse(localStorage.getItem('trips') || '[]');
        const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');

        console.log('Retrieved data:', { trips, journalEntries });

        // Prepare trips CSV
        let tripsCSV = 'Trip ID,Trip Name,Trip Notes\n';
        trips.forEach(trip => {
            tripsCSV += `${trip.id},${trip.name.replace(/,/g, ';')},${(trip.tripNotes || '').replace(/,/g, ';')}\n`;
        });

        // Prepare journal entries CSV
        let entriesCSV = 'Trip ID,Location Name,Arrival Date,Departure Date,Notes,Latitude,Longitude\n';
        journalEntries.forEach(entry => {
            entriesCSV += `${entry.tripId},${entry.locationName.replace(/,/g, ';')},${entry.arrivalDate},${entry.departureDate},${(entry.notes || '').replace(/,/g, ';')},${entry.lat},${entry.lng}\n`;
        });

        console.log('CSVs prepared');

        // Create zip file
        const zip = new JSZip();
        zip.file('trips.csv', tripsCSV);
        zip.file('journal_entries.csv', entriesCSV);

        zip.generateAsync({ type: 'blob' })
            .then(function(content) {
                console.log('ZIP generated');
                const url = window.URL.createObjectURL(content);
                const link = document.createElement('a');
                link.href = url;
                link.download = `waylytics_data_${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(link);
                console.log('Triggering download');
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch(function(error) {
                console.error('Error generating ZIP:', error);
                alert('Error creating ZIP file. Please try again.');
            });
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error exporting data. Please try again.');
    }
}