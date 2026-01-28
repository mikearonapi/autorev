'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import Link from 'next/link';

import { Icons } from '@/components/ui/Icons';

import styles from './EventMap.module.css';
import PremiumGate from './PremiumGate';

/**
 * Format date for tooltip
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Default US center
 */
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }; // Geographic center of continental US
const DEFAULT_ZOOM = 4;

/**
 * Get bounds for events
 */
function getBoundsForEvents(events) {
  const validEvents = events.filter(e => e.latitude && e.longitude);
  if (validEvents.length === 0) return null;
  
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  
  validEvents.forEach(e => {
    minLat = Math.min(minLat, e.latitude);
    maxLat = Math.max(maxLat, e.latitude);
    minLng = Math.min(minLng, e.longitude);
    maxLng = Math.max(maxLng, e.longitude);
  });
  
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Simple static map implementation using OpenStreetMap tiles
 * For a production app, you might want to integrate Mapbox or Google Maps
 */
export default function EventMap({ 
  events = [], 
  onEventSelect,
  selectedEvent,
  height = '500px',
}) {
  const mapRef = useRef(null);
  const [_mapError, setMapError] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [showList, setShowList] = useState(false);

  // Events with coordinates
  const mappableEvents = useMemo(() => 
    events.filter(e => e.latitude && e.longitude),
    [events]
  );

  // Group events by approximate location for clustering
  const clusteredEvents = useMemo(() => {
    const clusters = {};
    const precision = zoom < 6 ? 1 : zoom < 10 ? 2 : 3;
    
    mappableEvents.forEach(event => {
      const key = `${event.latitude.toFixed(precision)},${event.longitude.toFixed(precision)}`;
      if (!clusters[key]) {
        clusters[key] = {
          lat: event.latitude,
          lng: event.longitude,
          events: [],
        };
      }
      clusters[key].events.push(event);
    });
    
    return Object.values(clusters);
  }, [mappableEvents, zoom]);

  // Calculate initial bounds
  useEffect(() => {
    const bounds = getBoundsForEvents(events);
    if (bounds) {
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerLng = (bounds.minLng + bounds.maxLng) / 2;
      setCenter({ lat: centerLat, lng: centerLng });
      
      // Estimate zoom level based on bounds
      const latDiff = bounds.maxLat - bounds.minLat;
      const lngDiff = bounds.maxLng - bounds.minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      if (maxDiff > 40) setZoom(3);
      else if (maxDiff > 20) setZoom(4);
      else if (maxDiff > 10) setZoom(5);
      else if (maxDiff > 5) setZoom(6);
      else if (maxDiff > 2) setZoom(7);
      else if (maxDiff > 1) setZoom(8);
      else setZoom(9);
    }
  }, [events]);

  // Convert lat/lng to pixel position
  const latLngToPixel = useCallback((lat, lng) => {
    if (!mapRef.current) return { x: 0, y: 0 };
    
    const mapWidth = mapRef.current.offsetWidth;
    const mapHeight = mapRef.current.offsetHeight;
    
    // Mercator projection
    const scale = Math.pow(2, zoom) * 256;
    
    const worldX = (lng + 180) / 360 * scale;
    const latRad = lat * Math.PI / 180;
    const worldY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale;
    
    const centerX = (center.lng + 180) / 360 * scale;
    const centerLatRad = center.lat * Math.PI / 180;
    const centerY = (1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * scale;
    
    const x = worldX - centerX + mapWidth / 2;
    const y = worldY - centerY + mapHeight / 2;
    
    return { x, y };
  }, [center, zoom]);

  // Handle zoom
  const handleZoomIn = () => setZoom(z => Math.min(z + 1, 18));
  const handleZoomOut = () => setZoom(z => Math.max(z - 1, 2));

  // Generate tile URLs
  const getTileUrl = useCallback((x, y, z) => {
    // OpenStreetMap tiles with dark mode styling via CartoDB
    return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}.png`;
  }, []);

  // Calculate visible tiles
  const visibleTiles = useMemo(() => {
    if (!mapRef.current) return [];
    
    const mapWidth = mapRef.current.offsetWidth || 800;
    const mapHeight = mapRef.current.offsetHeight || 500;
    
    const scale = Math.pow(2, zoom);
    const centerTileX = Math.floor((center.lng + 180) / 360 * scale);
    const centerLatRad = center.lat * Math.PI / 180;
    const centerTileY = Math.floor((1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * scale);
    
    const tilesX = Math.ceil(mapWidth / 256) + 2;
    const tilesY = Math.ceil(mapHeight / 256) + 2;
    
    const tiles = [];
    for (let dx = -Math.floor(tilesX/2); dx <= Math.ceil(tilesX/2); dx++) {
      for (let dy = -Math.floor(tilesY/2); dy <= Math.ceil(tilesY/2); dy++) {
        const tileX = (centerTileX + dx + scale) % scale;
        const tileY = centerTileY + dy;
        
        if (tileY < 0 || tileY >= scale) continue;
        
        const _offsetX = (dx * 256) + (mapWidth / 2) - ((center.lng + 180) / 360 * scale * 256 / scale % 256);
        const _offsetY = (dy * 256) + (mapHeight / 2) - (((1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * scale * 256 / scale) % 256);
        
        tiles.push({
          x: tileX,
          y: tileY,
          z: zoom,
          offsetX: dx * 256 + mapWidth / 2 - 128,
          offsetY: dy * 256 + mapHeight / 2 - 128,
        });
      }
    }
    
    return tiles;
  }, [center, zoom]);

  if (mappableEvents.length === 0) {
    return (
      <div className={styles.mapContainer} style={{ height }}>
        <div className={styles.emptyState}>
          <Icons.mapPin size={40} />
          <h3>No Events to Map</h3>
          <p>Events with location data will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumGate feature="eventsCalendarView" fallback={
      <div className={styles.mapContainer} style={{ height }}>
        <div className={styles.gatedState}>
          <Icons.mapPin size={40} />
          <h3>Map View</h3>
          <p>Upgrade to Enthusiast tier to view events on a map.</p>
        </div>
      </div>
    }>
      <div className={styles.mapWrapper} style={{ height }}>
        {/* Map Area */}
        <div className={styles.mapContainer} ref={mapRef}>
          {/* Map Tiles */}
          <div className={styles.tileLayer}>
            {visibleTiles.map((tile, _i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${tile.z}-${tile.x}-${tile.y}`}
                src={getTileUrl(tile.x, tile.y, tile.z)}
                alt=""
                className={styles.tile}
                style={{
                  left: tile.offsetX,
                  top: tile.offsetY,
                }}
                onError={() => setMapError(true)}
              />
            ))}
          </div>
          
          {/* Event Markers */}
          <div className={styles.markerLayer}>
            {clusteredEvents.map((cluster, i) => {
              const pos = latLngToPixel(cluster.lat, cluster.lng);
              const isMultiple = cluster.events.length > 1;
              const isSelected = selectedEvent && 
                cluster.events.some(e => e.id === selectedEvent.id);
              
              return (
                <button
                  key={i}
                  className={`${styles.marker} ${isMultiple ? styles.cluster : ''} ${isSelected ? styles.selected : ''}`}
                  style={{ 
                    left: pos.x, 
                    top: pos.y,
                    transform: 'translate(-50%, -100%)',
                  }}
                  onClick={() => onEventSelect?.(cluster.events[0])}
                  title={isMultiple 
                    ? `${cluster.events.length} events`
                    : cluster.events[0].name
                  }
                >
                  {isMultiple ? (
                    <span className={styles.clusterCount}>{cluster.events.length}</span>
                  ) : (
                    <Icons.mapPin size={24} />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Map Controls */}
          <div className={styles.mapControls}>
            <button onClick={handleZoomIn} title="Zoom in">
              <Icons.zoomIn size={18} />
            </button>
            <button onClick={handleZoomOut} title="Zoom out">
              <Icons.zoomOut size={18} />
            </button>
            <button onClick={() => setShowList(!showList)} title="Toggle list">
              <Icons.list size={18} />
            </button>
          </div>
          
          {/* Map Attribution */}
          <div className={styles.attribution}>
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
          </div>
        </div>
        
        {/* Event List Sidebar */}
        {showList && (
          <div className={styles.eventList}>
            <div className={styles.listHeader}>
              <h3>{mappableEvents.length} Events</h3>
              <button onClick={() => setShowList(false)}>
                <Icons.close size={18} />
              </button>
            </div>
            <div className={styles.listItems}>
              {mappableEvents.map(event => (
                <Link
                  key={event.id}
                  href={`/community/events/${event.slug}`}
                  className={`${styles.listItem} ${selectedEvent?.id === event.id ? styles.listItemSelected : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onEventSelect?.(event);
                    setCenter({ lat: event.latitude, lng: event.longitude });
                    setZoom(10);
                  }}
                >
                  <div className={styles.listItemName}>{event.name}</div>
                  <div className={styles.listItemMeta}>
                    {formatDate(event.start_date)} • {event.city}, {event.state}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Selected Event Popup */}
        {selectedEvent && (
          <div className={styles.popup}>
            <button 
              className={styles.popupClose}
              onClick={() => onEventSelect?.(null)}
            >
              <Icons.close size={16} />
            </button>
            <div className={styles.popupContent}>
              <h4>{selectedEvent.name}</h4>
              <p className={styles.popupDate}>{formatDate(selectedEvent.start_date)}</p>
              <p className={styles.popupLocation}>
                {selectedEvent.city}, {selectedEvent.state}
              </p>
              <Link 
                href={`/community/events/${selectedEvent.slug}`}
                className={styles.popupLink}
              >
                View Details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </PremiumGate>
  );
}






