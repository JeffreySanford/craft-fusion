import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Centralized service to control whether the app is running
 * against simulated data or live data. This lets multiple
 * components subscribe to the same state.
 */
@Injectable({ providedIn: 'root' })
export class DataSimulationService {
  private isSimulatingSubject = new BehaviorSubject<boolean>(false);
  public isSimulating$: Observable<boolean> = this.isSimulatingSubject.asObservable();

  constructor() {
    // default: live data (false)
  }

  setSimulating(value: boolean): void {
    this.isSimulatingSubject.next(value);
  }

  toggleSimulating(): void {
    this.isSimulatingSubject.next(!this.isSimulatingSubject.getValue());
  }

  /**
   * Helper that will later provide richer simulated-data behavior.
   * For now it simply returns the current flag.
   */
  isSimulated(): boolean {
    return this.isSimulatingSubject.getValue();
  }
}
