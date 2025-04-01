import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Make environment variables available to the browser
if (typeof window !== 'undefined') {
  (window as any).__env = {
    FINNHUB_API_KEY: environment.finnhub.apiKey,
    MAPBOX_ACCESS_TOKEN: environment.mapbox.accessToken,
    FLIGHT_AWARE_USER: environment.flightAware.username,
    FLIGHT_AWARE_API_KEY: environment.flightAware.apiKey,
    HUGGING_FACE_AFP: environment.huggingFace.apiKey,
    DEEPSEEK_ENABLED: environment.aiModels.deepseekEnabled ? 'true' : 'false',
    MISTRAL_ENABLED: environment.aiModels.mistralEnabled ? 'true' : 'false',
    OPENAI_ENABLED: environment.aiModels.openaiEnabled ? 'true' : 'false',
    OPENAI_API_KEY: environment.aiModels.openaiApiKey,
    API_URL: environment.apiUrl
  };
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));

