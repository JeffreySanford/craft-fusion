export interface ChartData {
  name: string;
  component: string;
  data: any;
  color: string;
}

export interface BarChartData {
  month: string;
  values: {
    label: string;
    amount: number;
  }[];
}

export interface LineChartData {
  date: Date;
  series1: number;
  series2: number;
  series3: number;
}

export interface FintechChartData {
  stockIndicator: string;
  trade: string;
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