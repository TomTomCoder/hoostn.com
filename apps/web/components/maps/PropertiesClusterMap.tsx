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

interface PropertiesClusterMapProps {
  properties: Property[];
  onPropertyClick?: (propertyId: string) => void;
  className?: string;
}

export function PropertiesClusterMap({
  properties,
  onPropertyClick,
  className = '',
}: PropertiesClusterMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
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
        zoom: 10,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        if (!map.current) return;

        // Convert properties to GeoJSON
        const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: 'FeatureCollection',
          features: properties.map((property) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [property.longitude, property.latitude],
            },
            properties: {
              id: property.id,
              name: property.name,
              price: property.price,
            },
          })),
        };

        // Add source
        map.current?.addSource('properties', {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50, // Radius of each cluster when clustering points
        });

        // Add cluster circles layer
        map.current?.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'properties',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#3B82F6', // blue-500 for small clusters
              10,
              '#2563EB', // blue-600 for medium clusters
              30,
              '#1D4ED8', // blue-700 for large clusters
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20, // Small clusters
              10,
              30, // Medium clusters
              30,
              40, // Large clusters
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        // Add cluster count labels
        map.current?.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'properties',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 14,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Add unclustered points layer
        map.current?.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'properties',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#3B82F6',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        // Click on cluster to zoom in
        map.current?.on('click', 'clusters', (e) => {
          if (!map.current) return;

          const features = map.current.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          });

          if (features.length === 0) return;

          const clusterId = features[0].properties?.cluster_id;
          const source = map.current.getSource('properties') as mapboxgl.GeoJSONSource;

          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || !map.current) return;

            const geometry = features[0].geometry;
            if (geometry.type === 'Point') {
              map.current.easeTo({
                center: geometry.coordinates as [number, number],
                zoom: zoom,
              });
            }
          });
        });

        // Click on unclustered point to show popup
        map.current?.on('click', 'unclustered-point', (e) => {
          if (!map.current || !e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const geometry = feature.geometry;

          if (geometry.type !== 'Point') return;

          const coordinates = geometry.coordinates.slice() as [number, number];
          const { id, name, price } = feature.properties || {};

          // Create popup
          const popupContent = `
            <div style="padding: 12px; font-family: system-ui; min-width: 200px;">
              <strong style="font-size: 16px; color: #111827; display: block; margin-bottom: 4px;">
                ${name}
              </strong>
              ${
                price
                  ? `<p style="font-size: 14px; color: #059669; font-weight: 600; margin: 0;">
                      $${Number(price).toLocaleString()}/month
                    </p>`
                  : ''
              }
            </div>
          `;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map.current);

          // Call callback if provided
          if (onPropertyClick && id) {
            onPropertyClick(id);
          }
        });

        // Change cursor on hover
        map.current?.on('mouseenter', 'clusters', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });

        map.current?.on('mouseleave', 'clusters', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });

        map.current?.on('mouseenter', 'unclustered-point', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });

        map.current?.on('mouseleave', 'unclustered-point', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });

        // Fit bounds to show all properties
        if (properties.length > 1) {
          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15,
          });
        }
      });
    } catch (err) {
      setError('Failed to initialize map');
      console.error('Map initialization error:', err);
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [properties, onPropertyClick]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ minHeight: '600px' }}
      >
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ minHeight: '600px' }}
      >
        <p className="text-gray-600">No properties to display</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={`w-full rounded-lg ${className}`}
      style={{ minHeight: '600px' }}
      role="region"
      aria-label={`Clustered map showing ${properties.length} properties`}
    />
  );
}
