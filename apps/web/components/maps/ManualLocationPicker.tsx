'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

interface ManualLocationPickerProps {
  initialLatitude: number;
  initialLongitude: number;
  onLocationChange: (latitude: number, longitude: number) => void;
  className?: string;
}

export function ManualLocationPicker({
  initialLatitude,
  initialLongitude,
  onLocationChange,
  className = '',
}: ManualLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [coordinates, setCoordinates] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
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
        center: [initialLongitude, initialLatitude],
        zoom: 14,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Create draggable marker
      marker.current = new mapboxgl.Marker({
        draggable: true,
        color: '#EF4444', // red-500
      })
        .setLngLat([initialLongitude, initialLatitude])
        .addTo(map.current);

      // Update coordinates on marker drag
      marker.current.on('dragend', () => {
        if (!marker.current) return;

        const lngLat = marker.current.getLngLat();
        const newCoords = {
          latitude: Number(lngLat.lat.toFixed(6)),
          longitude: Number(lngLat.lng.toFixed(6)),
        };

        setCoordinates(newCoords);
        onLocationChange(newCoords.latitude, newCoords.longitude);
      });

      // Click on map to move marker
      map.current.on('click', (e) => {
        if (!marker.current) return;

        marker.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);

        const newCoords = {
          latitude: Number(e.lngLat.lat.toFixed(6)),
          longitude: Number(e.lngLat.lng.toFixed(6)),
        };

        setCoordinates(newCoords);
        onLocationChange(newCoords.latitude, newCoords.longitude);
      });

      // Change cursor on hover
      map.current.on('mouseenter', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'crosshair';
        }
      });
    } catch (err) {
      setError('Failed to initialize map');
      console.error('Map initialization error:', err);
    }

    // Cleanup
    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [initialLatitude, initialLongitude, onLocationChange]);

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
    <div className={className}>
      {/* Instructions */}
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <strong className="font-medium">Adjust Location:</strong> Drag the red pin
          or click anywhere on the map to set the exact property location.
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapContainer}
        className="w-full rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
        role="region"
        aria-label="Location picker map"
      />

      {/* Coordinates Display */}
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Latitude:</span>
            <span className="ml-2 text-gray-900 font-mono">
              {coordinates.latitude}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Longitude:</span>
            <span className="ml-2 text-gray-900 font-mono">
              {coordinates.longitude}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
