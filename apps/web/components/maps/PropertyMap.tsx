'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  propertyName?: string;
  zoom?: number;
  className?: string;
}

export function PropertyMap({
  latitude,
  longitude,
  propertyName,
  zoom = 14,
  className = '',
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
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

    // Initialize Mapbox
    mapboxgl.accessToken = mapboxToken;

    try {
      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: zoom,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Create marker
      marker.current = new mapboxgl.Marker({
        color: '#3B82F6', // blue-500
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Add popup if property name is provided
      if (propertyName) {
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
        }).setHTML(`
          <div style="padding: 8px; font-family: system-ui;">
            <strong style="font-size: 14px; color: #111827;">${propertyName}</strong>
          </div>
        `);

        marker.current.setPopup(popup);

        // Show popup on load
        popup.addTo(map.current);
      }
    } catch (err) {
      setError('Failed to initialize map');
      console.error('Map initialization error:', err);
    }

    // Cleanup
    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [latitude, longitude, propertyName, zoom]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ minHeight: '400px' }}
      >
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={`w-full rounded-lg ${className}`}
      style={{ minHeight: '400px' }}
      role="region"
      aria-label="Property location map"
    />
  );
}
