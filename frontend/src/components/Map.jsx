import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
} from "react-leaflet";

import styles from "./Map.module.css";
import { useEffect, useState, useMemo } from "react";
import { useCities } from "../contexts/CitiesContext";
import { useTours } from "../contexts/ToursContext";
import { useGeolocation } from "../hooks/useGeolocation";
import Button from "../components/Button";
import { useUrlPosition } from "../hooks/useUrlPosition";

function Map() {
  const { cities } = useCities();
  const { currentTour, activeTourId } = useTours();
  const [mapPosition, setMapPosition] = useState([20, 78]);

  const {
    isLoading: isLoadingPosition,
    position: geolocationPosition,
    getPosition,
  } = useGeolocation();

  const [mapLat, mapLng] = useUrlPosition();

  useEffect(() => {
    if (mapLat && mapLng) setMapPosition([Number(mapLat), Number(mapLng)]);
  }, [mapLat, mapLng]);

  useEffect(() => {
    if (geolocationPosition)
      setMapPosition([geolocationPosition.lat, geolocationPosition.lng]);
  }, [geolocationPosition]);

  // Get route coordinates for active tour
  const routePositions = useMemo(() => {
    if (!activeTourId || !currentTour || !currentTour.cities) return [];
    
    return currentTour.cities
      .filter(city => city.position?.lat && city.position?.lng)
      .map(city => [Number(city.position.lat), Number(city.position.lng)]);
  }, [activeTourId, currentTour]);

  // Route line options
  const routeOptions = {
    color: "#00c46a",
    weight: 4,
    opacity: 0.8,
    dashArray: "10, 10",
    lineCap: "round",
    lineJoin: "round",
  };

  return (
    <div className={styles.mapContainer}>
      {/* Use user's current position */}
      {!geolocationPosition && (
        <Button type="position" onClick={getPosition}>
          {isLoadingPosition ? "Loading..." : "Use your position"}
        </Button>
      )}

      <MapContainer
        center={mapPosition}
        zoom={6}
        scrollWheelZoom={true}
        className={styles.mapContainer}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />

        {/* City Markers */}
        {cities.map((city) => (
          <Marker
            key={city._id}
            position={[
              Number(city.position.lat),
              Number(city.position.lng),
            ]}
          >
            <Popup>
              <span>{city.emoji}</span> <span>{city.cityName}</span>
            </Popup>
          </Marker>
        ))}

        {/* Route Polyline for Active Tour */}
        {routePositions.length >= 2 && (
          <Polyline positions={routePositions} pathOptions={routeOptions} />
        )}

        {/* Route Markers with numbers */}
        {routePositions.length > 0 && currentTour?.cities?.map((city, index) => (
          city.position?.lat && city.position?.lng && (
            <Marker
              key={`route-${city._id}`}
              position={[Number(city.position.lat), Number(city.position.lng)]}
            >
              <Popup>
                <div style={{ textAlign: "center" }}>
                  <strong>Stop {index + 1}</strong><br />
                  <span>{city.emoji}</span> {city.cityName}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        <ChangeCenter position={mapPosition} />
        <DetectClick />
      </MapContainer>
    </div>
  );
}

// Centers the map to position
function ChangeCenter({ position }) {
  const map = useMap();
  map.setView(position);
  return null;
}

// Navigate to form when clicking on map
function DetectClick() {
  const navigate = useNavigate();
  useMapEvents({
    click: (e) => navigate(`form?lat=${e.latlng.lat}&lng=${e.latlng.lng}`),
  });
  return null;
}

export default Map;
