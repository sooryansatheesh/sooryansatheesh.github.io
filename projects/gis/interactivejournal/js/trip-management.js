// Global variable to store the ID of the trip being edited
let editingTripId = null;

// Function to generate a unique ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Function to save or update a trip
function saveOrUpdateTrip(event) {
    event.preventDefault();
    console.log("saveOrUpdateTrip function called");

    const tripName = document.getElementById('tripName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    console.log("Trip details:", { tripName, startDate, endDate });

    let trips = [];
    try {
        trips = JSON.parse(localStorage.getItem('trips') || '[]');
        console.log("Existing trips loaded:", trips);
    } catch (error) {
        console.error("Error parsing existing trips:", error);
    }

    if (editingTripId) {
        // Update existing trip
        const tripIndex = trips.findIndex(trip => trip.id === editingTripId);
        if (tripIndex !== -1) {
            trips[tripIndex] = {
                ...trips[tripIndex],
                name: tripName,
                startDate: startDate,
                endDate: endDate
            };
            console.log("Updated trip:", trips[tripIndex]);
        }
    } else {
        // Create new trip
        const newTrip = {
            id: generateUniqueId(),
            name: tripName,
            startDate: startDate,
            endDate: endDate
        };
        trips.push(newTrip);
        console.log("New trip created:", newTrip);
    }

    try {
        localStorage.setItem('trips', JSON.stringify(trips));
        console.log("Updated trips saved to localStorage");
    } catch (error) {
        console.error("Error saving trips to localStorage:", error);
    }

    document.getElementById('tripForm').reset();
    editingTripId = null; // Reset editing state
    displayTrips();
}

// Function to display saved trips
function displayTrips() {
    console.log("displayTrips function called");

    const tripList = document.getElementById('savedTrips');
    if (!tripList) {
        console.error("Element with id 'savedTrips' not found");
        return;
    }

    tripList.innerHTML = '';

    let trips = [];
    try {
        trips = JSON.parse(localStorage.getItem('trips') || '[]');
        console.log("Trips loaded from localStorage:", trips);
    } catch (error) {
        console.error("Error parsing trips from localStorage:", error);
    }

    if (trips.length === 0) {
        console.log("No trips found");
        tripList.innerHTML = '<li>No trips found</li>';
        return;
    }

    trips.forEach(trip => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${trip.name} (${trip.startDate} to ${trip.endDate})
            <button onclick="addNewPlace('${trip.id}')">Add New Place</button>
            <button onclick="deleteTrip('${trip.id}')">Delete Trip</button>
            <button onclick="editTrip('${trip.id}')">Edit Trip</button>
        `;
        tripList.appendChild(li);
        console.log("Trip added to list:", trip);
    });
}

// Function to add a new place
function addNewPlace(tripId) {
    console.log("Adding new place for trip:", tripId);
    window.location.href = `tripdetails.html?tripId=${tripId}`;
}

// Function to delete a trip
function deleteTrip(tripId) {
    console.log("Deleting trip:", tripId);
    
    // Delete the trip
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');
    trips = trips.filter(trip => trip.id !== tripId);
    localStorage.setItem('trips', JSON.stringify(trips));
    
    // Delete associated journal entries
    let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    allEntries = allEntries.filter(entry => entry.tripId !== tripId);
    localStorage.setItem('journalEntries', JSON.stringify(allEntries));
    
    console.log("Trip and associated entries deleted");
    displayTrips();
}

// Function to edit a trip
function editTrip(tripId) {
    console.log("Editing trip:", tripId);
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const trip = trips.find(trip => trip.id === tripId);
    
    if (trip) {
        document.getElementById('tripName').value = trip.name;
        document.getElementById('startDate').value = trip.startDate;
        document.getElementById('endDate').value = trip.endDate;
        editingTripId = tripId; // Set the editing state
        document.getElementById('submitButton').textContent = 'Update Trip';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");

    const tripForm = document.getElementById('tripForm');
    if (tripForm) {
        tripForm.addEventListener('submit', saveOrUpdateTrip);
        console.log("Submit event listener added to trip form");
    } else {
        console.error("Element with id 'tripForm' not found");
    }

    displayTrips();
});