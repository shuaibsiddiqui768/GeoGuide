import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL;

const SocialContext = createContext();

function SocialProvider({ children }) {
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    if (!isAuthenticated) {
      setFriends([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_URL}/friends/list`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (e) {
      console.error("Failed to fetch friends:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders]);

  // Fetch friend requests
  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) {
      setSentRequests([]);
      setReceivedRequests([]);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/friends/requests`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSentRequests(data.sent || []);
        setReceivedRequests(data.received || []);
      }
    } catch (e) {
      console.error("Failed to fetch requests:", e);
    }
  }, [isAuthenticated, getAuthHeaders]);

  // Fetch all on mount and auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchFriends();
      fetchRequests();
    } else {
      setFriends([]);
      setSentRequests([]);
      setReceivedRequests([]);
    }
  }, [isAuthenticated, fetchFriends, fetchRequests]);

  // Search users
  const searchUsers = useCallback(
    async (query) => {
      if (!isAuthenticated || !query || query.length < 2) return [];

      try {
        setIsLoading(true);
        const res = await fetch(
          `${BASE_URL}/friends/search?q=${encodeURIComponent(query)}`,
          { headers: getAuthHeaders() }
        );
        if (res.ok) {
          return await res.json();
        }
        return [];
      } catch (e) {
        console.error("Search failed:", e);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Get user profile
  const getUserProfile = useCallback(
    async (identifier) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        const res = await fetch(`${BASE_URL}/friends/profile/${identifier}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          return await res.json();
        }
        return null;
      } catch (e) {
        console.error("Failed to get profile:", e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Send friend request
  const sendFriendRequest = useCallback(
    async (userId) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/friends/request/${userId}`, {
          method: "POST",
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        // Refresh requests
        await fetchRequests();
        if (data.status === "friends") {
          await fetchFriends();
        }
        
        return data;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, fetchRequests, fetchFriends]
  );

  // Cancel friend request
  const cancelFriendRequest = useCallback(
    async (userId) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/friends/request/${userId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        // Update local state
        setSentRequests(prev => prev.filter(r => r._id !== userId));
        
        return data;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Accept friend request
  const acceptFriendRequest = useCallback(
    async (userId) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/friends/accept/${userId}`, {
          method: "POST",
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        // Refresh both
        await Promise.all([fetchFriends(), fetchRequests()]);
        
        return data;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders, fetchFriends, fetchRequests]
  );

  // Reject friend request
  const rejectFriendRequest = useCallback(
    async (userId) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/friends/reject/${userId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        // Update local state
        setReceivedRequests(prev => prev.filter(r => r._id !== userId));
        
        return data;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Remove friend
  const removeFriend = useCallback(
    async (userId) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/friends/remove/${userId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        // Update local state
        setFriends(prev => prev.filter(f => f._id !== userId));
        
        return data;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Update username
  const updateUsername = useCallback(
    async (username) => {
      if (!isAuthenticated) return null;

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/friends/username`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ username }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        return data;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Check if user is a friend
  const isFriend = useCallback(
    (userId) => {
      return friends.some(f => f._id === userId);
    },
    [friends]
  );

  return (
    <SocialContext.Provider
      value={{
        friends,
        sentRequests,
        receivedRequests,
        isLoading,
        error,
        searchUsers,
        getUserProfile,
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        updateUsername,
        isFriend,
        fetchFriends,
        fetchRequests,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}

function useSocial() {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error("SocialContext was used outside the SocialProvider");
  }
  return context;
}

export { SocialProvider, useSocial };
