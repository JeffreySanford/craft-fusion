export interface ChartData {
  name: string;
  component: string;
  color: string;
  data: any[];
}

export interface BarChartData {
  date: string;
  value1: number;
  value2: number;
  value3: number;
}

export interface LineChartData {
  date: Date;
  series1: number;
  series2: number;
  series3: number;
}

export interface FintechChartData {
  task: string;
  startTime: Date;
  endTime: Date;
  startValue: number;
  endValue: number;
  group: string;
}

export interface MapChartData {
  name: string;
  coordinates: [number, number];
  city: string;
  state: string;
}