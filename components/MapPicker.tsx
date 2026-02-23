'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
}

const MapPicker = ({ lat, lng, onChange }: MapPickerProps) => {
    const LocationFinder = () => {
        useMapEvents({
            click(e) {
                onChange(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    };

    const ChangeView = ({ center }: { center: [number, number] }) => {
        const map = L.Map.prototype.isPrototypeOf(useMapEvents({})) ? null : import('react-leaflet').then(m => m.useMap());
        // Using a cleaner approach with a side effect component
        return null;
    };

    // Correct way to react to props in react-leaflet is a separate component
    function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
        const map = require('react-leaflet').useMap();
        useEffect(() => {
            if (lat && lng) {
                map.setView([lat, lng], 13);
            }
        }, [lat, lng, map]);
        return null;
    }

    const [icon, setIcon] = useState<L.Icon | null>(null);

    useEffect(() => {
        // Fix for default marker icons in Leaflet with Next.js
        const DefaultIcon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        });
        setIcon(DefaultIcon);
    }, []);

    return (
        <div className="h-64 w-full rounded-xl overflow-hidden border border-white/10 mt-2">
            <MapContainer
                center={[lat || 10.8505, lng || 76.2711]}
                zoom={8}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationFinder />
                <RecenterMap lat={lat} lng={lng} />
                {lat && lng && icon && <Marker position={[lat, lng]} icon={icon} />}
            </MapContainer>
        </div>
    );
};

export default MapPicker;
