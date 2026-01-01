export interface ChartData {
  name: string;
  component: string;
  color: string;
  data: any[];
  size?: string;                                                               
  active?: boolean;                            
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

export interface FinanceChartData {
  stockIndicator: string;
  trade: 'buy' | 'sell';                                          
  task: string;
  startTime: Date;
  endTime: Date;
  startValue: number;
  endValue: number;
  group: 'normal' | 'extreme';                                                
}

export interface MapChartData {
  name: string;
  coordinates: [number, number];
  city: string;
  state: string;
}
