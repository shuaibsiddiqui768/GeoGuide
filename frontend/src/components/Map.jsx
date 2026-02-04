import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import styles from "./Map.module.css";
import { useEffect, useState } from "react";
import { useCities } from "../contexts/CitiesContext";
import { useGeolocation } from "../hooks/useGeolocation";
import Button from "../components/Button";
import { useUrlPosition } from "../hooks/useUrlPosition";

function Map() {
  const { cities } = useCities();
  const [mapPosition, setMapPosition] = useState([20, 78]);
  // hook takes input isLoading and position
  const {
    isLoading: isLoadingPosition,
    position: geolocationPosition,
    getPosition,//getPosition is function returned by hook
  } = useGeolocation();

  //hook takes 2 input latitude and longitude
  const [mapLat, mapLng] = useUrlPosition();

  //take lat and lng and use useEffect hook to render and change current state of setMapPosition
  useEffect(() => {
    if (mapLat && mapLng) setMapPosition([Number(mapLat), Number(mapLng)]);
  }, [mapLat, mapLng]);

  //get current users position by clicking use your position
  useEffect(() => {
    if (geolocationPosition)
      setMapPosition([geolocationPosition.lat, geolocationPosition.lng]);
  }, [geolocationPosition]);

  return (
    <div className={styles.mapContainer}>

      {/* use users current position  */}
      {!geolocationPosition && (
        <Button  type="position" onClick={getPosition}>
          {isLoadingPosition ? "Loading..." : "Use your position"}
        </Button>
      )}
      <MapContainer
        center={mapPosition}
        zoom={6}
        scrollWheelZoom={true}
        className={styles.mapContainer}
      >
        {/* Tile is map design and color */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />

        {/* loop through city and place a marker */}
        {cities.map((city) => (
          <Marker
            key={city._id} // use MongoDB _id
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
        <ChangeCenter position={mapPosition} />
        <DetectClick />
      </MapContainer>
    </div>
  );
}
// immediately centers the map to position (array [lat, lng]) from mapPosition.
function ChangeCenter({ position }) {
  const map = useMap();
  map.setView(position);
  return null;
}

//when ever user click on map the useMapEvents trigger and navigate change the url to form+lat+lng
function DetectClick() {
  const navigate = useNavigate();
  useMapEvents({
    click: (e) => navigate(`form?lat=${e.latlng.lat}&lng=${e.latlng.lng}`),
  });
  return null;
}

export default Map;
