import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-model-selector',
  templateUrl: './model-selector.component.html',
  styleUrls: ['./model-selector.component.scss'],
  standalone: false,
})
export class ModelSelectorComponent implements OnInit {
  models: { name: string; apiUrl: string }[] = [
    { name: 'DeepSeek', apiUrl: 'http://127.0.0.1:11434/api/generate' },
    { name: 'Mistral', apiUrl: 'http://127.0.0.1:11435/api/generate' },
    { name: 'ChatGPT', apiUrl: 'http://127.0.0.1:11436/api/generate' },
    { name: 'Model 4', apiUrl: 'http://127.0.0.1:11437/api/generate' },
    { name: 'Model 5', apiUrl: 'http://127.0.0.1:11438/api/generate' },
  ];
  selectedModel: string = '';

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    this.selectedModel = this.settingsService.getSelectedModel().name;
  }

  selectModel(model: { name: string; apiUrl: string }) {
    this.settingsService.setSelectedModel(model);
    this.selectedModel = model.name;
  }

  onModelSelectChange(event: any): void {
    const value = event && (event.value || event.target?.value);
    const selectedModel = this.models.find(model => model.name === value);
    if (selectedModel) {
      this.settingsService.setSelectedModel(selectedModel);
    }
  }
}
