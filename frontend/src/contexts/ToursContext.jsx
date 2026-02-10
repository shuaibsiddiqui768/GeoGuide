import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL;

const ToursContext = createContext();

function ToursProvider({ children }) {
  const [tours, setTours] = useState([]);
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTour, setCurrentTour] = useState(null);
  const [activeTourId, setActiveTourId] = useState(null); // For map route display
  const [error, setError] = useState(null);

  const { isAuthenticated } = useAuth();

  // Helper to get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, []);

  // Fetch all tours for the user
  const fetchTours = useCallback(async (isSilent = false) => {
    if (!isAuthenticated) {
      setTours([]);
      return;
    }

    try {
      if (!isSilent) setIsLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/tours`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setTours([]);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTours(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load tours");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders]);

  // Fetch invites
  const fetchInvites = useCallback(async () => {
    if (!isAuthenticated) {
      setInvites([]);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/tours/invites`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (e) {
      console.error("Failed to fetch invites:", e);
    }
  }, [isAuthenticated, getAuthHeaders]);

  // Fetch tours and invites on mount, auth change, and poll
  useEffect(() => {
    fetchTours();
    fetchInvites();

    // Poll for updates (collab changes, new invites) - silent refresh
    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchTours(true);
        fetchInvites();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTours, fetchInvites, isAuthenticated]);

  // Get a single tour
  const getTour = useCallback(
    async (id) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/tours/${id}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCurrentTour(data);
        return data;
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load tour");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Create a new tour
  const createTour = useCallback(
    async (tourData) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/tours`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(tourData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        setTours((prev) => [data, ...prev]);
        return data;
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to create tour");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Update a tour
  const updateTour = useCallback(
    async (id, tourData) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/tours/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(tourData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        setTours((prev) => prev.map((t) => (t._id === id ? data : t)));
        setCurrentTour(data);
        return data;
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to update tour");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Delete a tour
  const deleteTour = useCallback(
    async (id) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/tours/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!res.ok && res.status !== 204) {
          const data = await res.json();
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        setTours((prev) => prev.filter((t) => t._id !== id));
        setCurrentTour((c) => (c && c._id === id ? null : c));
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to delete tour");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Add a city to a tour
  const addCityToTour = useCallback(
    async (tourId, cityId) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/tours/${tourId}/cities`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ cityId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        setTours((prev) => prev.map((t) => (t._id === tourId ? data : t)));
        if (currentTour?._id === tourId) {
          setCurrentTour(data);
        }
        return data;
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to add city to tour");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, currentTour]
  );

  // Remove a city from a tour
  const removeCityFromTour = useCallback(
    async (tourId, cityId) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/tours/${tourId}/cities`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          body: JSON.stringify({ cityId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        setTours((prev) => prev.map((t) => (t._id === tourId ? data : t)));
        if (currentTour?._id === tourId) {
          setCurrentTour(data);
        }
        return data;
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to remove city from tour");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, currentTour]
  );

  // Respond to invite
  const respondToInvite = useCallback(
    async (tourId, status) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const res = await fetch(`${BASE_URL}/tours/respond-invite`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ tourId, status }),
        });
        
        if (!res.ok) throw new Error("Failed to respond");
        
        // Refresh everything
        await Promise.all([fetchInvites(), fetchTours()]);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, fetchInvites, fetchTours]
  );

  // Invite a friend to a tour
  const inviteToTour = useCallback(
    async (tourId, friendId) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const res = await fetch(`${BASE_URL}/tours/${tourId}/invite`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ friendId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        
        // Update local state for current tour if it's the one we're viewing
        if (currentTour?._id === tourId) {
          setCurrentTour(data);
        }
        
        // Update tours list
        setTours(prev => prev.map(t => t._id === tourId ? data : t));
        
        return data;
      } catch (e) {
        console.error("Invite to tour error:", e);
        setError(e.message || "Failed to send invitation");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, currentTour]
  );

  return (
    <ToursContext.Provider
      value={{
        tours,
        isLoading,
        error,
        currentTour,
        fetchTours,
        getTour,
        createTour,
        updateTour,
        deleteTour,
        addCityToTour,
        removeCityFromTour,
        activeTourId,
        setActiveTour: setActiveTourId,
        invites,
        fetchInvites,
        respondToInvite,
        inviteToTour,
      }}
    >
      {children}
    </ToursContext.Provider>
  );
}

function useTours() {
  const context = useContext(ToursContext);
  if (context === undefined) {
    throw new Error("ToursContext was used outside the ToursProvider");
  }
  return context;
}

export { ToursProvider, useTours };
