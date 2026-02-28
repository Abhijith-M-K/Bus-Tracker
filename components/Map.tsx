'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';

// Fix for default Leaflet icons in Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const BusIcon = L.divIcon({
    html: `<div style="width: 32px; height: 32px; display: flex; align-items: center; justify-center; background: var(--primary); border: 2px solid white; border-radius: 9999px; overflow: hidden; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);" class="bus-pulsing">
        <img src="/icon-passenger.png" style="width: 100%; height: 100%; object-fit: contain;" alt="bus" />
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const StopIcon = (isEdge: boolean) => L.divIcon({
    html: isEdge
        ? `<div style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: white; border: 4px solid var(--primary); border-radius: 9999px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);">
             <div style="width: 6px; height: 6px; background: var(--primary); border-radius: 9999px;"></div>
           </div>`
        : `<div style="width: 12px; height: 12px; background: white; border: 2px solid rgba(59, 130, 246, 0.4); border-radius: 9999px; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);"></div>`,
    className: '',
    iconSize: isEdge ? [20, 20] : [12, 12],
    iconAnchor: isEdge ? [10, 10] : [6, 6],
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapEffects({ center, stops }: { center: [number, number], stops?: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (stops && stops.length > 0) {
            const bounds = L.latLngBounds(stops.map(s => [s.location.lat, s.location.lng]));
            bounds.extend(center);
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
        } else {
            map.setView(center, 15);
        }
    }, [center, stops, map]);

    return null;
}

interface MapProps {
    center: [number, number];
    zoom?: number;
    stops?: any[];
}

export default function Map({ center, zoom = 13, stops }: MapProps) {
    const polylinePositions = useMemo(() => {
        if (!stops) return [];
        return stops.map(stop => [stop.location.lat, stop.location.lng] as [number, number]);
    }, [stops]);

    return (
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {stops && stops.length > 0 && (
                <>
                    {/* Outer Glow Line */}
                    <Polyline
                        positions={polylinePositions}
                        pathOptions={{
                            color: '#3b82f6',
                            weight: 12,
                            opacity: 0.15,
                            lineJoin: 'round',
                        }}
                    />
                    {/* Main Route Line */}
                    <Polyline
                        positions={polylinePositions}
                        pathOptions={{
                            color: '#3b82f6',
                            weight: 6,
                            opacity: 0.8,
                            lineJoin: 'round',
                        }}
                    />
                    {stops.map((stop, idx) => {
                        const isEdge = idx === 0 || idx === stops.length - 1;
                        return (
                            <Marker
                                key={`stop-${idx}`}
                                position={[stop.location.lat, stop.location.lng]}
                                icon={StopIcon(isEdge)}
                                zIndexOffset={isEdge ? 100 : 0}
                            >
                                <Popup>
                                    <div className="text-xs font-bold">{stop.name}</div>
                                    <div className="text-[10px] text-gray-500">{isEdge ? (idx === 0 ? 'SOURCE' : 'DESTINATION') : 'STOP'}</div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </>
            )}

            <Marker position={center} icon={BusIcon} zIndexOffset={1000}>
                <Popup>Bus current location</Popup>
            </Marker>

            <MapEffects center={center} stops={stops} />
        </MapContainer>
    );
}
