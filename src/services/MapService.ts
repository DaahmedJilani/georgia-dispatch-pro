// Singleton service for Google Maps initialization and management
class MapService {
  private static instance: MapService;
  private googleMapsLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  async loadGoogleMaps(): Promise<void> {
    if (this.googleMapsLoaded && (window as any).google?.maps) {
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise((resolve, reject) => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        const error = 'Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to environment variables.';
        console.error(error);
        reject(new Error(error));
        return;
      }

      if ((window as any).google?.maps) {
        this.googleMapsLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.googleMapsLoaded = true;
        console.log('✅ Google Maps loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        const error = 'Failed to load Google Maps. Please check your API key and billing settings.';
        console.error(error);
        reject(new Error(error));
      };

      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }

  isLoaded(): boolean {
    return this.googleMapsLoaded && !!(window as any).google?.maps;
  }

  getGoogle(): typeof google | null {
    return this.isLoaded() ? (window as any).google : null;
  }
}

export const mapService = MapService.getInstance();
