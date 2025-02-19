export interface UserState {
  loginDateTime: Date | null;
  visitLength: number | null;
  visitedPages: string[];
}

export interface LoginDateTimeDTO {
  dateTime: string;
}
