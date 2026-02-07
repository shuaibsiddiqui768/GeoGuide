import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL;

const CitiesContext = createContext();

function CitiesProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState(null);
  const [error, setError] = useState(null);

  // Get auth state from AuthContext
  const { isAuthenticated, user } = useAuth();

  // Helper to get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, []);

  // Stable helper so callbacks depending on it don't change on every render
  const parseJsonSafe = useCallback(async (res) => {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }, []);

  // Fetch cities for the logged-in user
  const fetchCities = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setCities([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/cities`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setCities([]);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await parseJsonSafe(res);
      // Handle both {data: [...]} and direct array response
      const citiesData = data?.data || data;
      setCities(Array.isArray(citiesData) ? citiesData : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load cities");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders, parseJsonSafe]);

  // Fetch cities when user authentication changes
  useEffect(() => {
    fetchCities();
  }, [fetchCities, user]);

  // Memoize getCity so consumers can safely include it in useEffect deps
  const getCity = useCallback(
    async (id) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/cities/${id}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await parseJsonSafe(res);
        setCurrentCity(data);
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load city");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, parseJsonSafe]
  );

  const createCity = useCallback(
    async (newCity) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        setError(null);
        const payload = {
          ...newCity,
          // ISO string (e.g., "2025-09-24T12:00:00.000Z").
          date:
            newCity.date instanceof Date
              ? newCity.date.toISOString()
              : newCity.date,
        };
        const res = await fetch(`${BASE_URL}/cities`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        setCities((prev) => [...prev, data]);
        setCurrentCity(data);
        return data; // Return the created city
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to create city");
        alert("There was an error creating city..");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, parseJsonSafe]
  );

  const deleteCity = useCallback(
    async (id) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/cities/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!res.ok && res.status !== 204) {
          const data = await parseJsonSafe(res);
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        setCities((prev) => prev.filter((city) => city._id !== id));
        setCurrentCity((c) => (c && c._id === id ? null : c));
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to delete city");
        alert("There was an error deleting city..");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, parseJsonSafe]
  );

  const updateCity = useCallback(
    async (id, cityData) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        
         const payload = {
          ...cityData,
          date:
            cityData.date instanceof Date
              ? cityData.date.toISOString()
              : cityData.date,
        };

        const res = await fetch(`${BASE_URL}/cities/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        
        // Update local state
        setCities((prev) => prev.map((city) => (city._id === id ? data : city)));
        setCurrentCity(data);
        return data;
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to update city");
        alert("There was an error updating city..");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, parseJsonSafe]
  );

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        error,
        currentCity,
        getCity,
        createCity,
        deleteCity,
        updateCity,
        refetchCities: fetchCities,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined) {
    throw new Error("CitiesContext was used outside the CitiesProvider");
  }
  return context;
}

export { CitiesProvider, useCities };


