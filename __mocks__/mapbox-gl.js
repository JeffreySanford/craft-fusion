// Lightweight Mapbox GL mock for Jest
const Evented = function () {
  this.on = jest.fn();
  this.off = jest.fn();
  this.fire = jest.fn();
};

module.exports = {
  Map: function () {
    this.on = jest.fn();
    this.off = jest.fn();
    this.remove = jest.fn();
    this.getCanvas = () => ({ style: {} });
    this.addControl = jest.fn();
    this.getSource = jest.fn(() => null);
    this.addSource = jest.fn();
    this.addLayer = jest.fn();
    this.flyTo = jest.fn();
    this.easeTo = jest.fn();
  },
  NavigationControl: function () {},
  GeolocateControl: function () {},
  ScaleControl: function () {},
  FullscreenControl: function () {},
  Evented,
};
// Lightweight mock for mapbox-gl used in tests
const mapboxgl = {
  Map: class {
    constructor() {
      this._listeners = {};
    }
    on() {}
    off() {}
    remove() {}
    addControl() {}
    getCenter() { return { lng: 0, lat: 0 }; }
  },
  NavigationControl: class {},
  Marker: class {
    constructor() {}
    setLngLat() { return this; }
    addTo() { return this; }
  },
  Popup: class { setHTML() { return this; } addTo() { return this; } },
  LngLatBounds: class {},
  accessToken: '',
};

module.exports = mapboxgl;
