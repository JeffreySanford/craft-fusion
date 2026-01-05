export {};

class MockMap {
  constructor() {}
  addControl() {
    return this;
  }
  removeControl() {
    return this;
  }
  on() {
    return this;
  }
  off() {
    return this;
  }
  getCanvas() {
    return {
      style: {},
    };
  }
}

const mockMapbox = {
  Map: MockMap,
  NavigationControl: class {},
  Marker: class {
    constructor() {}
    setLngLat() {
      return this;
    }
    setPopup() {
      return this;
    }
    addTo() {
      return this;
    }
  },
  Popup: class {},
  LngLatBounds: class {},
  geolocateControl: () => null,
  supported: () => true,
};

(globalThis as any).mapboxgl = mockMapbox;
module.exports = mockMapbox;
