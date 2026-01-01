import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataSimulationService {
  private isSimulatingSubject = new BehaviorSubject<boolean>(false);
  public isSimulating$: Observable<boolean> = this.isSimulatingSubject.asObservable();

  constructor() {

  }

  setSimulating(value: boolean): void {
    this.isSimulatingSubject.next(value);
  }

  toggleSimulating(): void {
    this.isSimulatingSubject.next(!this.isSimulatingSubject.getValue());
  }

  isSimulated(): boolean {
    return this.isSimulatingSubject.getValue();
  }
}
