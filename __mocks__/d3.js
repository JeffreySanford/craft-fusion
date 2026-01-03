// Enhanced minimal d3 mock to satisfy tests that import d3
// Creates lightweight DOM nodes for SVG and path so tests can query fixture.nativeElement

function makeSelection(node) {
  const sel = {
    __node: node,
    append(tag) {
      const isSvgTag = ['svg', 'g', 'path', 'text', 'defs', 'linearGradient', 'stop', 'polyline'].includes(tag);
      const child = isSvgTag
        ? document.createElementNS('http://www.w3.org/2000/svg', tag)
        : document.createElement(tag);
      if (this.__node && this.__node.appendChild) {
        this.__node.appendChild(child);
      }
      child.__data = Array.isArray(this.__data) ? this.__data[0] : this.__data;
      const newSel = makeSelection(child);
      newSel.__data = this.__data;
      return newSel;
    },
    attr(_name, _value) { return this; },
    style(_name, _value) { return this; },
    text(_txt) { 
      if (typeof _txt === 'string') { 
        if (this.__node) {
          // Clear existing text nodes
          Array.from(this.__node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) this.__node.removeChild(child);
          });
          // Add new text node
          this.__node.appendChild(document.createTextNode(_txt));
        }
      } 
      return this; 
    },
    classed(className, value) {
      if (this.__node && this.__node.classList) {
        if (value === true) {
          this.__node.classList.add(className);
        } else if (value === false) {
          this.__node.classList.remove(className);
        }
      }
      return this;
    },
    each(fn) { 
      if (typeof fn === 'function') {
        const d = Array.isArray(this.__data) && this.__data.length > 0 ? this.__data[0] : this.__data;
        fn.call(this.__node, d, 0); 
      }
      return this; 
    },
    selectAll() { return this; },
    select(_sel) {
      // try querySelector on node
      if (this.__node && typeof _sel === 'string') {
        const found = this.__node.querySelector(_sel);
        return makeSelection(found || document.createElement('div'));
      }
      return makeSelection(document.createElement('div'));
    },
    remove() { if (this.__node && this.__node.parentNode) this.__node.parentNode.removeChild(this.__node); },
    data(arr) { this.__data = Array.isArray(arr) ? arr : []; return this; },
    datum(d) { if (this.__node) this.__node.__data = d; return this; },
    enter() { return this; },
    exit() { return this; },
    call(fn) { try { fn(this); } catch (e) {} return this; },
    node() { 
      if (this.__node && this.__node.tagName === 'text') {
        // Mock SVGTextElement
        this.__node.getBBox = () => ({ width: 50, height: 14, x: 0, y: 0 });
      }
      return this.__node; 
    },
    datum(d) { if (this.__node) (this.__node).__data = d; return this; },
    on(event, cb) { 
      if (typeof cb === 'function') {
        const isMouseEvent = ['click', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'].includes(event);
        if (!isMouseEvent) {
          cb.call(this.__node, this.__node.__data);
        } else {
          // For mouse events, add listener but don't call immediately
          this.__node.addEventListener(event, (e) => cb(e, this.__node.__data));
        }
      }
      return this; 
    },
    transition() {
      const sel = this;
      const t = {
        duration(_ms) { return this; },
        ease(_fn) { return this; },
        attr(_name, _value) { return this; },
        style(_name, _value) { return this; },
        delay(_fn) { return this; },
        on(event, cb) { if (event === 'end' && typeof cb === 'function') cb(); return this; },
      };
      return t;
    },
  };
  return sel;
}

const d3 = {
  select(target) {
    if (typeof target === 'string') {
      const el = document.querySelector(target) || document.createElement('div');
      return makeSelection(el);
    }
    if (target && typeof target.appendChild === 'function') {
      return makeSelection(target);
    }
    return makeSelection(document.createElement('div'));
  },
  selectAll(selector) {
    const nodes = Array.from(document.querySelectorAll(selector || 'div'));
    return makeSelection(nodes[0] || document.createElement('div'));
  },
  scaleLinear() {
    const fn = (v) => v;
    fn.domain = () => fn;
    fn.range = () => fn;
    fn.ticks = () => [];
    return fn;
  },
  scaleTime() {
    const fn = (v) => v;
    fn.domain = () => fn;
    fn.range = () => fn;
    return fn;
  },
  timeFormat(fmt) {
    return (d) => {
      try {
        const date = d instanceof Date ? d : new Date(d);
        if (fmt === '%b') return date.toLocaleString('en-US', { month: 'short' });
        if (fmt === '%b %y') return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        return date.toString();
      } catch (e) {
        return String(d);
      }
    };
  },
  extent(arr) {
    if (!arr || arr.length === 0) return [0, 0];
    return [Math.min(...arr), Math.max(...arr)];
  },
  min(arr, accessor) {
    if (!arr || arr.length === 0) return undefined;
    if (typeof accessor === 'function') return Math.min(...arr.map(accessor));
    return Math.min(...arr);
  },
  max(arr, accessor) {
    if (!arr || arr.length === 0) return undefined;
    if (typeof accessor === 'function') return Math.max(...arr.map(accessor));
    return Math.max(...arr);
  },
  axisBottom() {
    const axis = () => axis;
    axis.ticks = () => axis;
    axis.tickSize = () => axis;
    axis.tickFormat = () => axis;
    axis.scale = () => axis;
    return axis;
  },
  axisLeft() {
    const axis = () => axis;
    axis.ticks = () => axis;
    axis.tickSize = () => axis;
    axis.tickFormat = () => axis;
    axis.scale = () => axis;
    return axis;
  },
  easeLinear: () => () => {},
  timeMonth: { every: (n) => ({ _step: n }) },
  line() {
    const gen = function() { return ''; };
    gen.x = () => gen;
    gen.y = () => gen;
    gen.curve = () => gen;
    return gen;
  },
  area() {
    const gen = function() { return ''; };
    gen.x = () => gen;
    gen.y = () => gen;
    gen.curve = () => gen;
    return gen;
  },
  curveMonotoneX: {},
};

module.exports = d3;
