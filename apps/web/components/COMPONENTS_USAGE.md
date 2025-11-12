# Hoostn Shared Components Usage Guide

This guide provides examples for integrating the shared components created by Agent 5.

## Table of Contents

1. [Image Components](#image-components)
2. [Map Components](#map-components)
3. [Form Components](#form-components)
4. [Environment Setup](#environment-setup)

---

## Image Components

### ImageUploader

Drag-and-drop image uploader with progress tracking.

**Location:** `/home/user/hoostn.com/apps/web/components/images/ImageUploader.tsx`

**Usage:**

```tsx
import { ImageUploader } from '@/components/images';

function MyComponent() {
  const handleUploadComplete = (imageId: string) => {
    console.log('Image uploaded:', imageId);
    // Refresh your image list or perform other actions
  };

  return (
    <ImageUploader
      propertyId="prop_123"
      onUploadComplete={handleUploadComplete}
      maxFiles={10}
    />
  );
}
```

**Props:**
- `propertyId` (string, required): The property ID to associate images with
- `onUploadComplete` (function, optional): Callback when upload succeeds
- `maxFiles` (number, optional): Maximum files allowed (default: 10)

---

### ImageGallery

Grid display of images with lightbox and management actions.

**Location:** `/home/user/hoostn.com/apps/web/components/images/ImageGallery.tsx`

**Usage:**

```tsx
import { ImageGallery } from '@/components/images';
import type { PropertyImage } from '@/types/image';

function MyComponent() {
  const [images, setImages] = useState<PropertyImage[]>([]);

  const handleUpdate = () => {
    // Reload images after delete or primary change
    fetchImages();
  };

  return (
    <ImageGallery
      images={images}
      onUpdate={handleUpdate}
    />
  );
}
```

**Props:**
- `images` (PropertyImage[], required): Array of images to display
- `onUpdate` (function, optional): Callback when images are modified

**Features:**
- 2x2 grid on mobile, 4x3 on desktop
- Hover actions: set primary, view full, delete
- Lightbox with keyboard navigation (arrow keys, ESC)
- Primary badge on main image

---

### PropertyImageManager

Combined uploader and gallery for complete image management.

**Location:** `/home/user/hoostn.com/apps/web/components/images/PropertyImageManager.tsx`

**Usage:**

```tsx
import { PropertyImageManager } from '@/components/images';

function PropertyEditPage({ propertyId }: { propertyId: string }) {
  return (
    <div>
      <h1>Property Images</h1>
      <PropertyImageManager propertyId={propertyId} />
    </div>
  );
}
```

**Props:**
- `propertyId` (string, required): The property ID

**Features:**
- Automatically loads images on mount
- Combines upload and gallery sections
- Handles loading and error states
- Auto-refreshes after uploads/changes

---

## Map Components

### PropertyMap

Display a single property location.

**Location:** `/home/user/hoostn.com/apps/web/components/maps/PropertyMap.tsx`

**Usage:**

```tsx
import { PropertyMap } from '@/components/maps';

function PropertyDetailsPage() {
  return (
    <PropertyMap
      latitude={40.7128}
      longitude={-74.0060}
      propertyName="Downtown Apartment"
      zoom={15}
      className="h-96"
    />
  );
}
```

**Props:**
- `latitude` (number, required): Property latitude
- `longitude` (number, required): Property longitude
- `propertyName` (string, optional): Property name for popup
- `zoom` (number, optional): Initial zoom level (default: 14)
- `className` (string, optional): Additional CSS classes

---

### PropertiesMap

Display multiple properties with markers.

**Location:** `/home/user/hoostn.com/apps/web/components/maps/PropertiesMap.tsx`

**Usage:**

```tsx
import { PropertiesMap } from '@/components/maps';

function PropertyListPage() {
  const properties = [
    {
      id: '1',
      name: 'Downtown Apartment',
      latitude: 40.7128,
      longitude: -74.0060,
      price: 2500,
    },
    // ... more properties
  ];

  const handlePropertyClick = (propertyId: string) => {
    // Navigate to property details or open modal
    router.push(`/properties/${propertyId}`);
  };

  return (
    <PropertiesMap
      properties={properties}
      onPropertyClick={handlePropertyClick}
      className="h-[600px]"
    />
  );
}
```

**Props:**
- `properties` (Property[], required): Array of properties
- `onPropertyClick` (function, optional): Callback when marker is clicked
- `className` (string, optional): Additional CSS classes

**Property Type:**
```tsx
interface Property {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  price?: number;
}
```

---

### PropertiesClusterMap

Display 100+ properties with clustering.

**Location:** `/home/user/hoostn.com/apps/web/components/maps/PropertiesClusterMap.tsx`

**Usage:**

```tsx
import { PropertiesClusterMap } from '@/components/maps';

function PropertySearchPage() {
  const properties = [ /* ... large array of properties ... */ ];

  return (
    <PropertiesClusterMap
      properties={properties}
      onPropertyClick={(id) => console.log('Clicked:', id)}
      className="h-[700px]"
    />
  );
}
```

**Props:**
- Same as PropertiesMap

**Features:**
- Clusters properties when zoomed out
- Click cluster to zoom in and expand
- Color-coded by cluster size (blue gradients)
- Shows count on cluster circles

---

### ManualLocationPicker

Interactive map for selecting exact property location.

**Location:** `/home/user/hoostn.com/apps/web/components/maps/ManualLocationPicker.tsx`

**Usage:**

```tsx
import { ManualLocationPicker } from '@/components/maps';
import { useState } from 'react';

function PropertyCreateForm() {
  const [coordinates, setCoordinates] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
  });

  const handleLocationChange = (lat: number, lng: number) => {
    setCoordinates({ latitude: lat, longitude: lng });
    // Update form values
  };

  return (
    <div>
      <label>Property Location</label>
      <ManualLocationPicker
        initialLatitude={coordinates.latitude}
        initialLongitude={coordinates.longitude}
        onLocationChange={handleLocationChange}
        className="mt-2"
      />
    </div>
  );
}
```

**Props:**
- `initialLatitude` (number, required): Starting latitude
- `initialLongitude` (number, required): Starting longitude
- `onLocationChange` (function, required): Callback with new coordinates
- `className` (string, optional): Additional CSS classes

**Features:**
- Draggable red marker
- Click anywhere to reposition
- Live coordinate display
- Instructions banner

---

## Form Components

### AddressAutocomplete

Address search with Mapbox geocoding.

**Location:** `/home/user/hoostn.com/apps/web/components/forms/AddressAutocomplete.tsx`

**Usage:**

```tsx
import { AddressAutocomplete, AddressResult } from '@/components/forms';
import { useState } from 'react';

function PropertyAddressForm() {
  const [address, setAddress] = useState('');

  const handleSelectAddress = (result: AddressResult) => {
    console.log('Selected:', result);

    // Update form fields
    setFormData({
      streetAddress: result.streetAddress,
      city: result.city,
      state: result.state,
      postalCode: result.postalCode,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  return (
    <AddressAutocomplete
      value={address}
      onChange={setAddress}
      onSelectAddress={handleSelectAddress}
      country="us"
      placeholder="Enter property address..."
      className="w-full"
    />
  );
}
```

**Props:**
- `value` (string, required): Current input value
- `onChange` (function, required): Input change handler
- `onSelectAddress` (function, required): Selection callback
- `country` (string, optional): Country code for bias (default: 'us')
- `placeholder` (string, optional): Input placeholder
- `className` (string, optional): Additional CSS classes

**AddressResult Type:**
```tsx
interface AddressResult {
  fullAddress: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
}
```

**Features:**
- Debounced search (300ms)
- Keyboard navigation (arrow keys, enter, escape)
- Loading indicator
- Clear button
- Dropdown with 5 suggestions
- Returns full address + coordinates

---

## Environment Setup

### Required Environment Variables

Add to `/home/user/hoostn.com/apps/web/.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

**Get a Mapbox Token:**
1. Go to https://www.mapbox.com/
2. Sign up for a free account
3. Navigate to Account → Tokens
4. Create a new token with default permissions
5. Copy the token to your `.env.local`

### Global CSS Import

The Mapbox GL CSS has been automatically imported in:
`/home/user/hoostn.com/apps/web/app/globals.css`

---

## Complete Integration Example

Here's a full example combining multiple components in a property form:

```tsx
'use client';

import { useState } from 'react';
import { AddressAutocomplete, AddressResult } from '@/components/forms';
import { ManualLocationPicker } from '@/components/maps';
import { PropertyImageManager } from '@/components/images';

export default function CreatePropertyPage() {
  const [formData, setFormData] = useState({
    address: '',
    latitude: 40.7128,
    longitude: -74.0060,
  });
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const handleAddressSelect = (result: AddressResult) => {
    setFormData({
      address: result.fullAddress,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Create New Property</h1>

      {/* Address Search */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Property Address
        </label>
        <AddressAutocomplete
          value={formData.address}
          onChange={(val) => setFormData((prev) => ({ ...prev, address: val }))}
          onSelectAddress={handleAddressSelect}
          placeholder="Search for property address..."
        />
      </div>

      {/* Manual Location Adjustment */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Adjust Location
        </label>
        <ManualLocationPicker
          initialLatitude={formData.latitude}
          initialLongitude={formData.longitude}
          onLocationChange={handleLocationChange}
        />
      </div>

      {/* Image Management (after property is created) */}
      {propertyId && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Property Images</h2>
          <PropertyImageManager propertyId={propertyId} />
        </div>
      )}
    </div>
  );
}
```

---

## Dependencies

All required dependencies have been installed:

```json
{
  "dependencies": {
    "react-dropzone": "^14.x",
    "@mapbox/mapbox-sdk": "^0.x",
    "mapbox-gl": "^3.x",
    "react-map-gl": "^7.x"
  },
  "devDependencies": {
    "@types/mapbox-gl": "^3.x"
  }
}
```

---

## Notes for Other Agents

### Agent 2 (Database & Actions)
- These components expect the image types and actions to be created
- Required: `PropertyImage` type in `/home/user/hoostn.com/apps/web/types/image.ts`
- Required actions in `/home/user/hoostn.com/apps/web/lib/actions/image-upload.ts`:
  - `uploadPropertyImage(formData: FormData)`
  - `deletePropertyImage(imageId: string)`
  - `setPrimaryImage(imageId: string)`
  - `getPropertyImages(propertyId: string)`
- Required utility in `/home/user/hoostn.com/apps/web/lib/utils/image.ts`:
  - `getImageDimensions(file: File)`

### Agent 3 (List/Details Pages)
- Use `PropertyMap` for single property details
- Use `PropertiesMap` or `PropertiesClusterMap` for list/search pages
- Use `ImageGallery` to display property images in details view

### Agent 4 (Forms)
- Use `AddressAutocomplete` for address input
- Use `ManualLocationPicker` for fine-tuning location
- Use `PropertyImageManager` or `ImageUploader` for image upload in forms

---

## Support

For questions or issues with these components, check:
1. Console for error messages (especially Mapbox token issues)
2. Network tab for API failures
3. Environment variables are properly set
4. Dependencies are installed

All components include comprehensive error handling and accessibility features.
