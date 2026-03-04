import { TestBed } from '@angular/core/testing';
import { DataSimulationService } from './data-simulation.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

describe('DataSimulationService', () => {
  let service: DataSimulationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataSimulationService],
    });
    service = TestBed.inject(DataSimulationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('initial simulation state should be false', async () => {
    const val = await firstValueFrom(service.isSimulating$);
    expect(val).toBe(false);
  });

  it('setSimulating should update observable', async () => {
    service.setSimulating(true);
    const val = await firstValueFrom(service.isSimulating$);
    expect(val).toBe(true);
  });

  it('toggleSimulating switches state', () => {
    service.setSimulating(false);
    service.toggleSimulating();
    expect(service.isSimulated()).toBeTruthy();
    service.toggleSimulating();
    expect(service.isSimulated()).toBeFalsy();
  });
});
