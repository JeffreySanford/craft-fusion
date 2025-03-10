import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private selectedModel = { name: 'DeepSeek', apiUrl: 'http://127.0.0.1:11434/api/generate' };

  getSelectedModel() {
    return this.selectedModel;
  }

  setSelectedModel(model: { name: string; apiUrl: string }) {
    this.selectedModel = model;
  }
}
