// ...existing code...

// In the method that initializes the map (around line 124)
initializeMap(city: string): void {
  console.log('STEP 4: Initializing map for city', city);
  
  // Clear the container element first
  const mapContainer = document.getElementById('map-container-' + this.alertId);
  if (mapContainer) {
    // Clear any existing content before map initialization
    while (mapContainer.firstChild) {
      mapContainer.removeChild(mapContainer.firstChild);
    }
  }
  
  // Now proceed with map initialization
  this.map = new mapboxgl.Map({
    container: 'map-container-' + this.alertId,
    // ...existing options...
  });
  
  // ...existing code...
}

// ...existing code...