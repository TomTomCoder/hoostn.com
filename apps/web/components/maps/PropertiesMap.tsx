'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Property {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  price?: number;
}

interface PropertiesMapProps {
  properties: Property[];
  onPropertyClick?: (propertyId: string) => void;
  className?: string;
}

export function PropertiesMap({
  properties,
  onPropertyClick,
  className = '',
}: PropertiesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get Mapbox token from environment
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      setError('Mapbox token not configured');
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
      return;
    }

    if (!mapContainer.current) return;
    if (properties.length === 0) return;

    // Initialize Mapbox
    mapboxgl.accessToken = mapboxToken;

    try {
      // Calculate center and bounds
      const bounds = new mapboxgl.LngLatBounds();
      properties.forEach((property) => {
        bounds.extend([property.longitude, property.latitude]);
      });

      const center = bounds.getCenter();

      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [center.lng, center.lat],
        zoom: 12,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Fit bounds to show all properties
      map.current.once('load', () => {
        if (map.current && properties.length > 1) {
          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15,
          });
        }
      });

      // Clear existing markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      // Add markers for each property
      properties.forEach((property) => {
        if (!map.current) return;

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.backgroundImage =
          'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iIzNCODJGNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+)';
        el.style.backgroundSize = 'contain';
        el.style.cursor = 'pointer';

        // Create popup content
        const popupContent = `
          <div style="padding: 12px; font-family: system-ui; min-width: 200px;">
            <strong style="font-size: 16px; color: #111827; display: block; margin-bottom: 4px;">
              ${property.name}
            </strong>
            ${
              property.price
                ? `<p style="font-size: 14px; color: #059669; font-weight: 600; margin: 0;">
                    $${property.price.toLocaleString()}/month
                  </p>`
                : ''
            }
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: true,
        }).setHTML(popupContent);

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([property.longitude, property.latitude])
          .setPopup(popup)
          .addTo(map.current);

        // Add click handler
        el.addEventListener('click', () => {
          if (onPropertyClick) {
            onPropertyClick(property.id);
          }
        });

        markers.current.push(marker);
      });
    } catch (err) {
      setError('Failed to initialize map');
      console.error('Map initialization error:', err);
    }

    // Cleanup
    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, [properties, onPropertyClick]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ minHeight: '500px' }}
      >
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ minHeight: '500px' }}
      >
        <p className="text-gray-600">No properties to display</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={`w-full rounded-lg ${className}`}
      style={{ minHeight: '500px' }}
      role="region"
      aria-label={`Map showing ${properties.length} properties`}
    />
  );
}
