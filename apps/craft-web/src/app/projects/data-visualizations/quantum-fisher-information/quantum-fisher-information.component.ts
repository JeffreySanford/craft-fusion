import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import * as d3 from 'd3';
import katex from 'katex';
// Removed import for KatexOptions as it does not exist

// Define interfaces for data types
interface QFICell {
  value: number;
  row: number;
  col: number;
}

@Component({
  selector: 'app-quantum-fisher-tile',
  templateUrl: './quantum-fisher-information.component.html',
  styleUrls: ['./quantum-fisher-information.component.scss'],
  standalone: false
})
export class QuantumFisherInformationComponent implements OnInit, AfterViewInit {
  @Input() dialogMode = false;
  @ViewChild('qfiVisualization') qfiVisualizationRef!: ElementRef;
  
  // Updated state names to better reflect quantum metrology terminology
  currentState = 'Standard Quantum Limit';
  states = ['Classical Correlation', 'Standard Quantum Limit', 'Heisenberg-Limited'];
  
  // UI Control properties
  parameterValue = 50;
  heisenbergValue = 50; // Add new property for Heisenberg slider
  showOverlay = false;
  selectedCell: QFICell | null = null;
  showUseCaseSummary = false;
  
  // QFI data with more realistic values
  qfiData: number[][] = [
    [1.0, 0.8, 0.6, 0.7],
    [0.7, 1.0, 0.65, 0.60],
    [0.6, 0.65, 1.00, 0.45],
    [0.70, 0.55, 0.45, 1.00]
  ];
  
  // Real-world sensor and parameter labels for the quantum sensing network
  readonly sensorLabels = [
    'Magnetic Trap', 
    'Optical Lattice', 
    'Ion Trap', 
    'NV Center'
  ];
  
  readonly paramLabels = [
    'Magnetic Field', 
    'Electric Field', 
    'Temperature', 
    'Acceleration'
  ];
  
  // Detailed descriptions of sensors and parameters
  readonly sensorDescriptions = {
    'Magnetic Trap': 'Uses magnetic fields to confine cold atoms for quantum sensing with precision down to femtotesla.',
    'Optical Lattice': 'Captures neutral atoms in periodic light patterns for quantum simulation and sensing.',
    'Ion Trap': 'Confines charged particles using electromagnetic fields for ultra-precise frequency measurements.',
    'NV Center': 'Nitrogen-vacancy centers in diamond that can sense magnetic fields at nanoscale resolution.'
  };
  
  readonly paramDescriptions = {
    'Magnetic Field': 'Detection of weak magnetic signals with applications in geophysics and medical imaging.',
    'Electric Field': 'Measurement of local electric fields with applications in materials science.',
    'Temperature': 'Quantum-enhanced thermometry with sub-millikelvin resolution.',
    'Acceleration': 'High-precision inertial sensing for navigation and gravimetry.'
  };
  
  // Use case summary
  useCaseSummary = `
    This visualization represents a Distributed Quantum Sensor Network for environmental monitoring. 
    Four different quantum sensor types are deployed to simultaneously measure multiple physical parameters.
    
    The Quantum Fisher Information Matrix (QFIM) quantifies how precisely these parameters can be estimated
    and how the sensor measurements are correlated. Diagonal elements show individual sensor sensitivity,
    while off-diagonal elements reveal quantum correlations between different parameter measurements.
    
    By exploiting quantum entanglement between sensors, this network can achieve measurement precision
    beyond what's possible with classical sensors - approaching the Heisenberg limit in optimal conditions.
  `;
  
  // Reference constants for educational content
  readonly SQL_SCALING: string = '1/\\sqrt{N}';  
  readonly HL_SCALING: string = '1/N';

  // Mathematical equations in KaTeX format with enhanced display
  cramerRaoEquation = '\\Delta \\theta \\geq \\frac{1}{\\sqrt{F_Q}}';
  classicalScalingEquation = '\\Delta \\theta_{\\text{cl}} \\propto \\frac{1}{\\sqrt{N}}';
  heisenbergScalingEquation = '\\Delta \\theta_{\\text{HL}} \\propto \\frac{1}{N}';
  qfiDefinitionEquation = 'F_Q = \\tr[\\rho L^2], \\quad \\frac{\\partial \\rho}{\\partial \\theta} = \\frac{1}{2}(\\rho L + L \\rho)';
  qfiMatrixEquation = 'F_{ij} = \\tr[\\rho \\frac{L_i L_j + L_j L_i}{2}]';
  covarianceEquation = '\\text{Cov}(\\hat{\\theta}) \\geq F^{-1}';
  qfiMatrixDefinitionEquation = 'F_{ij} = \\tr[\\rho L_i L_j], \\quad \\frac{\\partial \\rho}{\\partial \\theta_i} = \\frac{1}{2}(\\rho L_i + L_i \\rho)';
  
  // Fix: Add missing properties for KaTeX component
  katexMacros: any = {
    "\\tr": "\\text{Tr}"
  };

  // Add additional equations needed for tooltips and other displays
  minVarianceEquation(value: number): string {
    return `\\Delta^2 \\theta \\geq ${(1 / value).toFixed(3)}`;
  }
  
  // For showing individual parameter precision in tooltips
  parameterPrecisionEquation(value: number): string {
    return `\\Delta \\theta \\geq ${(1 / Math.sqrt(value)).toFixed(3)}`;
  }
  
  // For showing potential scaling based on regime
  regimeScalingEquation(state: string): string {
    switch(state) {
      case 'Classical Correlation':
        return '\\Delta \\theta \\propto 1/\\sqrt{N}';
      case 'Standard Quantum Limit':
        return '\\Delta \\theta \\propto 1/\\sqrt{N}';
      case 'Heisenberg-Limited':
        return '\\Delta \\theta \\propto 1/N';
      default:
        return '';
    }
  }

  constructor() {}

  ngOnInit(): void {
    // Initialize component state
    if (!this.dialogMode) {
      // Any initialization for standalone mode
      console.log('QFI Component initialized in standalone mode');
    } else {
      console.log('QFI Component initialized in dialog mode');
    }
  }
  
  ngAfterViewInit(): void {
    // Initialize the D3 visualization after the view is ready
    this.initializeVisualization();
  }
  
  // Helper method to flatten the 2D array for D3 compatibility
  private flattenData(data: number[][]): QFICell[] {
    const result: QFICell[] = [];
    
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        result.push({
          value: data[i][j],
          row: i,
          col: j
        });
      }
    }
    
    return result;
  }
  
  // Get the current state's data
  get currentStateData(): number[][] {
    const states: { [key: string]: number[][] } = {
      'Classical Correlation': [
        [1.00, 0.30, 0.20, 0.25],
        [0.30, 1.00, 0.15, 0.20],
        [0.20, 0.15, 1.00, 0.15],
        [0.25, 0.20, 0.15, 1.00]
      ],
      'Standard Quantum Limit': [
        [1.0, 0.5, 0.4, 0.5],
        [0.5, 1.0, 0.45, 0.40],
        [0.4, 0.45, 1.00, 0.35],
        [0.50, 0.40, 0.35, 1.00]
      ],
      'Heisenberg-Limited': [
        [1.00, 0.90, 0.85, 0.95],
        [0.90, 1.00, 0.85, 0.80],
        [0.85, 0.85, 1.00, 0.75],
        [0.95, 0.80, 0.75, 1.00]
      ]
    };
    return states[this.currentState] || this.qfiData;
  }
  
  // Add Heisenberg minimal and maximal entanglement data
  private heisenbergMinData: number[][] = [
    [1.00, 0.70, 0.65, 0.75],
    [0.70, 1.00, 0.65, 0.60],
    [0.65, 0.65, 1.00, 0.55],
    [0.75, 0.60, 0.55, 1.00]
  ];
  
  private heisenbergMaxData: number[][] = [
    [1.00, 0.98, 0.95, 0.99],
    [0.98, 1.00, 0.95, 0.90],
    [0.95, 0.95, 1.00, 0.85],
    [0.99, 0.90, 0.85, 1.00]
  ];
  
  @HostListener('window:resize')
  onResize(): void {
    // Re-render visualization to fill available space
    if (this.qfiVisualizationRef) {
      setTimeout(() => {
        this.initializeVisualization();
      }, 100);
    }
  }
  
  initializeVisualization(): void {
    if (this.qfiVisualizationRef) {
      const element = this.qfiVisualizationRef.nativeElement;
      
      // Clear any existing content
      d3.select(element).selectAll('*').remove();
      
      // Use the current state's data
      this.qfiData = this.currentStateData;
      
      // Get container dimensions for responsive sizing
      const containerWidth = element.clientWidth || 400;
      const containerHeight = Math.min(containerWidth * 0.75, element.clientHeight || 300);
      
      // Setup SVG container for heatmap with responsive dimensions
      const svgWidth = containerWidth;
      const svgHeight = containerHeight;
      const margin = { 
        top: svgHeight * 0.15, 
        right: svgWidth * 0.15, 
        bottom: svgHeight * 0.15, 
        left: svgWidth * 0.18 // Slightly larger to accommodate longer sensor labels
      };
      const width = svgWidth - margin.left - margin.right;
      const height = svgHeight - margin.top - margin.bottom;
      
      const svg = d3.select(element)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('class', 'qfi-heatmap');
        
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Create color scale with scientifically relevant colors
      const colorScale = d3.scaleLinear<string>()
        .domain([0.1, 0.5, 0.9])
        .range(['#002868', '#FFFFFF', '#BF0A30']);
        
      // Create grid for heatmap
      const cellSize = Math.min(width, height) / this.qfiData.length;
      
      // Use our helper method instead of flatMap
      const flattenedData = this.flattenData(this.qfiData);
      
      // Add title that updates based on state
      svg.append('text')
        .attr('class', 'viz-title')
        .attr('text-anchor', 'middle')
        .attr('x', svgWidth / 2)
        .attr('y', margin.top / 2)
        .text(`Quantum Sensor Network: ${this.currentState} Regime`);
      
      // Add cells with interaction
      g.selectAll('rect')
        .data(flattenedData)
        .enter()
        .append('rect')
        .attr('x', (d: QFICell) => d.col * cellSize)
        .attr('y', (d: QFICell) => d.row * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', (d: QFICell) => colorScale(d.value))
        .attr('stroke', '#BBBBBB')
        .attr('stroke-width', 1)
        .attr('rx', 2) // Rounded corners
        .attr('ry', 2)
        .on('mouseover', (event: MouseEvent, d: QFICell) => this.showTooltip(event, d))
        .on('mouseout', () => this.hideTooltip())
        .on('click', (event: MouseEvent, d: QFICell) => this.cellClicked(event, d));
        
      // Add diagonal pattern to highlight the diagonal elements
      g.selectAll('.diagonal-marker')
        .data(flattenedData.filter(d => d.row === d.col))
        .enter()
        .append('rect')
        .attr('class', 'diagonal-marker')
        .attr('x', (d: QFICell) => d.col * cellSize)
        .attr('y', (d: QFICell) => d.row * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 2');
      
      // Add values to cells if there's enough space
      if (cellSize > 40) {
        g.selectAll('.cell-value')
          .data(flattenedData)
          .enter()
          .append('text')
          .attr('class', 'cell-value')
          .attr('x', (d: QFICell) => d.col * cellSize + cellSize / 2)
          .attr('y', (d: QFICell) => d.row * cellSize + cellSize / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', `${Math.min(11, cellSize / 4)}px`)
          .attr('fill', (d: QFICell) => d.value > 0.5 ? '#000' : '#fff')
          .text((d: QFICell) => d.value.toFixed(2));
      }
      
      // Add axis labels
      svg.append('text')
        .attr('class', 'x-label')
        .attr('text-anchor', 'middle')
        .attr('x', svgWidth / 2)
        .attr('y', svgHeight - 5)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('Physical Parameters');
        
      svg.append('text')
        .attr('class', 'y-label')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(15, ${svgHeight / 2}) rotate(-90)`)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('Quantum Sensors');
      
      // Add sensor (row) labels with tooltips
      g.selectAll('.row-label')
        .data(this.sensorLabels)
        .enter()
        .append('text')
        .attr('class', 'row-label')
        .attr('x', -10)
        .attr('y', (_, i) => i * cellSize + cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', `${Math.min(10, cellSize / 4)}px`)
        .attr('font-weight', 'bold')
        .attr('cursor', 'help')
        .text(d => d)
        .append('title')
        .text(d => this.getSensorDescription(d));
        
      // Add parameter (column) labels with tooltips
      g.selectAll('.col-label')
        .data(this.paramLabels)
        .enter()
        .append('text')
        .attr('class', 'col-label')
        .attr('x', (_, i) => i * cellSize + cellSize / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'end')
        .attr('font-size', `${Math.min(10, cellSize / 4)}px`)
        .attr('font-weight', 'bold')
        .attr('cursor', 'help')
        .text(d => d)
        .append('title')
        .text(d => this.getParamDescription(d));
        
      // Add a legend - positioning it based on available space
      const legendWidth = Math.min(100, svgWidth * 0.25);
      const legendX = svgWidth - legendWidth - 10;
      const legendY = svgHeight - 100;
      
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${legendX}, ${legendY})`);
        
      const legendGradient = legend.append('defs')
        .append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
        
      legendGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#BF0A30');
        
      legendGradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', '#FFFFFF');
        
      legendGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#002868');
        
      legend.append('rect')
        .attr('width', 20)
        .attr('height', 60)
        .attr('fill', 'url(#legend-gradient)');
        
      legend.append('text')
        .attr('x', 25)
        .attr('y', 10)
        .attr('font-size', '8px')
        .text('High QFI (1.0)');
        
      legend.append('text')
        .attr('x', 25)
        .attr('y', 30)
        .attr('font-size', '8px')
        .text('Medium QFI (0.7)');
        
      legend.append('text')
        .attr('x', 25)
        .attr('y', 55)
        .attr('font-size', '8px')
        .text('Low QFI (0.4)');
        
      // Add a use case info button
      svg.append('circle')
        .attr('cx', 25)
        .attr('cy', 25)
        .attr('r', 12)
        .attr('fill', '#002868')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('cursor', 'pointer')
        .on('click', () => this.toggleUseCaseSummary());
        
      svg.append('text')
        .attr('x', 25)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .text('i');
    }
  }
  
  changeState(state: string): void {
    // Animate transition to new state with enhanced D3 transitions
    const previousState = this.currentState;
    this.currentState = state;
    
    // Reset parameter values when changing states
    if (previousState !== state) {
      if (state === 'Standard Quantum Limit') {
        this.parameterValue = 50;
      } else if (state === 'Heisenberg-Limited') {
        this.heisenbergValue = 50;
      }
    }
    
    // Update visualization based on state
    if (this.qfiVisualizationRef) {
      const svg = d3.select(this.qfiVisualizationRef.nativeElement).select('svg');
      
      // Update title with transition
      svg.select('.viz-title')
        .transition()
        .duration(500)
        .style('opacity', 0)
        .transition()
        .duration(500)
        .text(`Quantum Sensor Network: ${this.currentState} Regime`)
        .style('opacity', 1);
      
      // Get new data for the selected state
      const newData = this.currentStateData;
      const oldData = previousState ? this.states.includes(previousState) ? 
        this.getStateData(previousState) : this.qfiData : this.qfiData;
      
      // Update the QFI data
      this.qfiData = newData;
      
      // Create a color scale that reflects the current state
      // Classical uses more blue tones, Optimized uses more red tones
      const colorScale = d3.scaleLinear<string>()
        .domain([0, 0.5, 1])
        .range(
          state === 'Classical Correlation' ? 
            ['#002868', '#FFFFFF', '#6A93D4'] : // More blue tones for classical
          state === 'Heisenberg-Limited' ? 
            ['#002868', '#FFFFFF', '#BF0A30'] : // Full red for optimized state
            ['#002868', '#FFFFFF', '#BF8A30'] // Mixed tones for SQL
        );
      
      // Set the transition timing and easing based on which state we're moving to
      const transitionDuration = 750;
      const easing = state === 'Heisenberg-Limited' ? 
        d3.easeBounceOut : // Dramatic bounce effect for optimized state
        state === 'Classical Correlation' ? 
          d3.easeQuadIn : // Quick transition to classical
          d3.easeBackOut; // Elastic effect for SQL transitions
      
      // Use our helper method to flatten the data for D3
      const flattenedData = this.flattenData(newData);
      
      // Store cell dimensions for animations
      const element = this.qfiVisualizationRef.nativeElement;
      const containerWidth = element.clientWidth || 400;
      const containerHeight = Math.min(containerWidth * 0.75, element.clientHeight || 300);
      const margin = { 
        top: containerHeight * 0.15, 
        right: containerWidth * 0.15, 
        bottom: containerHeight * 0.15, 
        left: containerWidth * 0.18
      };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;
      const cellSize = Math.min(width, height) / newData.length;
      
      // Animate with staggered transitions for more engaging effect
      svg.selectAll('rect')
        .data(flattenedData)
        .transition()
        .duration(transitionDuration)
        .delay((d, i) => i * 20) // Stagger the transitions
        .ease(easing)
        .attr('fill', (d: QFICell) => colorScale(d.value))
        // Add subtle scale animation for state changes
        .attr('transform', (d: QFICell) => {
          const scaleFactor = state === 'Heisenberg-Limited' ? 1.05 : 1;
          const centerX = d.col * cellSize + cellSize / 2;
          const centerY = d.row * cellSize + cellSize / 2;
          return `translate(${centerX * (1 - scaleFactor)}, ${centerY * (1 - scaleFactor)}) scale(${scaleFactor})`;
        })
        // Reset scale after transition completes
        .transition()
        .duration(300)
        .attr('transform', 'scale(1)');
      
      // Update cell values with transition if they exist
      if (cellSize > 40) {
        svg.selectAll('.cell-value')
          .data(flattenedData)
          .transition()
          .duration(transitionDuration)
          .delay((d, i) => i * 25 + 100) // Slightly offset from rectangle transitions
          .text((d: QFICell) => d.value.toFixed(2))
          .attr('fill', (d: QFICell) => d.value > 0.5 ? '#000' : '#fff');
      }
      
      // Update diagonal highlights with transition
      svg.selectAll('.diagonal-marker')
        .data(flattenedData.filter(d => d.row === d.col))
        .transition()
        .duration(transitionDuration)
        .delay((d, i) => i * 30 + 200) // Further offset
        .style('stroke-width', state === 'Heisenberg-Limited' ? 3 : 2)
        .style('stroke', state === 'Heisenberg-Limited' ? '#BF0A30' : '#333');
    }
  }
  
  // Helper method to get state data
  private getStateData(state: string): number[][] {
    const states: { [key: string]: number[][] } = {
      'Classical Correlation': [
        [1.00, 0.30, 0.20, 0.25],
        [0.30, 1.00, 0.15, 0.20],
        [0.20, 0.15, 1.00, 0.15],
        [0.25, 0.20, 0.15, 1.00]
      ],
      'Standard Quantum Limit': [
        [1.0, 0.5, 0.4, 0.5],
        [0.5, 1.0, 0.45, 0.40],
        [0.4, 0.45, 1.00, 0.35],
        [0.50, 0.40, 0.35, 1.00]
      ],
      'Heisenberg-Limited': [
        [1.00, 0.90, 0.85, 0.95],
        [0.90, 1.00, 0.85, 0.80],
        [0.85, 0.85, 1.00, 0.75],
        [0.95, 0.80, 0.75, 1.00]
      ]
    };
    return states[state] || this.qfiData;
  }
  
  updateParameter(event: number): void {
    // Handle parameter slider change for Standard Quantum Limit
    const previousValue = this.parameterValue;
    this.parameterValue = event;
    
    // Adjust visualization based on slider
    if (this.currentState === 'Standard Quantum Limit') {
      // Interpolate between classical and SQL levels with slider
      const classicalData = this.getStateData('Classical Correlation');
      const sqlData = this.getStateData('Standard Quantum Limit');
      
      const factor = this.parameterValue / 100; // 0 to 1
      
      // Linear interpolation between the two states
      const updatedData = classicalData.map((row, i) => 
        row.map((val, j) => {
          const sqlVal = sqlData[i][j];
          return val + (sqlVal - val) * factor;
        })
      );
      
      // Update visualization with smoother transition
      this.updateVisualization(updatedData, Math.abs(this.parameterValue - previousValue) < 5);
    } else if (this.currentState === 'Moderate Entanglement') {
      // Existing code for 'Moderate Entanglement'
      const initialState = {
        'Initial State': [
          [1.00, 0.84, 0.60, 0.72],
          [0.84, 1.00, 0.65, 0.56],
          [0.60, 0.65, 1.00, 0.42],
          [0.72, 0.56, 0.42, 1.00]
        ],
        'Moderate Entanglement': [
          [1.0, 0.8, 0.6, 0.7],
          [0.7, 1.0, 0.65, 0.60],
          [0.6, 0.65, 1.00, 0.45],
          [0.70, 0.55, 0.45, 1.00]
        ]
      };
      
      const factor = this.parameterValue / 100; // 0 to 1
      
      // Linear interpolation between the two states
      const updatedData = initialState['Initial State'].map((row, i) => 
        row.map((val, j) => {
          const modVal = initialState['Moderate Entanglement'][i][j];
          return val + (modVal - val) * factor;
        })
      );
      
      // Update visualization
      this.updateVisualization(updatedData);
    }
  }
  
  // Add new method for Heisenberg parameter updates
  updateHeisenbergParameter(event: number): void {
    // Handle Heisenberg entanglement strength slider
    const previousValue = this.heisenbergValue;
    this.heisenbergValue = event;
    
    // Interpolate between minimum and maximum Heisenberg entanglement
    const factor = this.heisenbergValue / 100; // 0 to 1
    
    // Linear interpolation between min and max Heisenberg states
    const updatedData = this.heisenbergMinData.map((row, i) => 
      row.map((val, j) => {
        const maxVal = this.heisenbergMaxData[i][j];
        return val + (maxVal - val) * factor;
      })
    );
    
    // Update visualization with transition
    const quickTransition = Math.abs(this.heisenbergValue - previousValue) < 5;
    this.updateVisualization(updatedData, quickTransition);
    
    // Update title to reflect the entanglement strength
    if (this.qfiVisualizationRef) {
      const svg = d3.select(this.qfiVisualizationRef.nativeElement).select('svg');
      svg.select('.viz-title')
        .text(`Quantum Sensor Network: ${this.currentState} Regime (${this.heisenbergValue}% Entanglement)`);
    }
  }
  
  // Helper method to update visualization with new data
  private updateVisualization(updatedData: number[][], quickTransition: boolean = false): void {
    if (this.qfiVisualizationRef) {
      const svg = d3.select(this.qfiVisualizationRef.nativeElement).select('svg');
      const colorScale = d3.scaleLinear<string>()
        .domain([0, 0.5, 1])
        .range(['#002868', '#FFFFFF', '#BF0A30']);
        
      // Use our helper method instead of flatMap
      const flattenedData = this.flattenData(updatedData);
      
      // Use shorter duration for slider quick changes, longer for more deliberate changes
      const transitionDuration = quickTransition ? 100 : 300;
      
      svg.selectAll('rect')
        .data(flattenedData)
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeQuadOut) // Smooth easing
        .attr('fill', (d: QFICell) => colorScale(d.value));
        
      // Also update text values if present
      svg.selectAll('.cell-value')
        .data(flattenedData)
        .transition()
        .duration(transitionDuration)
        .text((d: QFICell) => d.value.toFixed(2))
        .attr('fill', (d: QFICell) => d.value > 0.5 ? '#000' : '#fff');
      
      // Update title with parameter value
      svg.select('.viz-title')
        .text(`Quantum Sensor Network: ${this.currentState} Regime (${this.parameterValue}% Strength)`);
    }
  }
  
  showTooltip(event: MouseEvent, d: QFICell): void {
    // Create scientifically accurate tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'qfi-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(255, 255, 255, 0.9)')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 6px rgba(0,0,0,0.3)')
      .style('pointer-events', 'none')
      .style('font-size', '14px')
      .style('max-width', '300px')
      .style('top', `${event.pageY + 10}px`)
      .style('left', `${event.pageX + 10}px`);
      
    const isDiagonal = d.row === d.col;
    
    // Get specific sensor and parameter labels
    const sensorLabel = this.sensorLabels[d.row];
    const paramLabel = this.paramLabels[d.col];
    
    // Create a temporary div element for KaTeX rendering
    const tempDiv = document.createElement('div');
    const precisionEq = isDiagonal ? 
      this.parameterPrecisionEquation(d.value) : 
      `\\text{Correlation: } ${d.value.toFixed(2)}`;
    
    // Render KaTeX equation
    katex.render(precisionEq, tempDiv, {
      displayMode: false,
      throwOnError: false,
      macros: this.katexMacros
    });
    
    // Enhanced tooltip with realistic examples and KaTeX equation
    tooltip.html(`
      <div style="border-bottom: 1px solid #ccc; margin-bottom: 8px; padding-bottom: 5px;">
        <strong style="font-size: 16px;">${sensorLabel} – ${paramLabel}</strong>
      </div>
      <div style="margin-bottom: 10px;">
        <span style="display: inline-block; width: 12px; height: 12px; 
        background-color: ${isDiagonal ? '#BF0A30' : '#002868'}; margin-right: 5px;"></span>
        <strong>${isDiagonal ? 'Direct Sensitivity' : 'Correlation'}</strong>: ${d.value.toFixed(2)}
      </div>
      <div style="margin-bottom: 8px;">
        ${isDiagonal ? 'Precision bound: ' + tempDiv.innerHTML : tempDiv.innerHTML}
      </div>
      <div style="font-size: 13px;">${this.getTooltipExplanation(d, sensorLabel, paramLabel)}</div>
      <div style="font-style: italic; margin-top: 8px; font-size: 12px; color: #555;">
        Click for detailed analysis
      </div>
    `);
  }
  
  // Helper method to provide scientifically accurate explanations
  private getTooltipExplanation(cell: QFICell, sensorLabel: string, paramLabel: string): string {
    if (cell.row === cell.col) {
      // Diagonal - direct sensitivity
      return `This shows how sensitive the ${sensorLabel} is to changes in ${paramLabel}. 
      Value of ${cell.value.toFixed(2)} indicates ${cell.value > 0.8 ? 'very high' : cell.value > 0.6 ? 'good' : 'moderate'} 
      measurement precision.`;
    } else {
      // Off-diagonal - correlation
      return `This represents the quantum correlation between ${sensorLabel}'s measurement of ${paramLabel} 
      and ${this.sensorLabels[cell.col]}'s measurement of ${this.paramLabels[cell.row]}. 
      ${cell.value > 0.8 ? 'Strong' : cell.value > 0.5 ? 'Moderate' : 'Weak'} correlation indicates 
      ${cell.value > 0.7 ? 'significant' : 'limited'} entanglement benefits.`;
    }
  }
  
  hideTooltip(): void {
    d3.select('.qfi-tooltip').remove();
  }
  
  cellClicked(event: MouseEvent, d: QFICell): void {
    this.selectedCell = d;
    this.showOverlay = true;
  }
  
  closeOverlay(): void {
    this.showOverlay = false;
    this.selectedCell = null;
  }
  
  toggleExplanation(): void {
    this.showOverlay = !this.showOverlay;
  }
  
  toggleUseCaseSummary(): void {
    this.showUseCaseSummary = !this.showUseCaseSummary;
  }

  // Type-safe getter for sensor descriptions
  getSensorDescription(sensor: string): string {
    return this.sensorDescriptions[sensor as keyof typeof this.sensorDescriptions] || '';
  }

  // Type-safe getter for parameter descriptions
  getParamDescription(param: string): string {
    return this.paramDescriptions[param as keyof typeof this.paramDescriptions] || '';
  }
}

