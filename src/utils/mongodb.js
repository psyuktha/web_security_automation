// MongoDB API client for frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Helper to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

// Helper to get auth headers
const getAuthHeaders = (customHeaders = {}) => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...customHeaders,
  };
};

export const mongodbAPI = {
  // Get all scan history
  async getScanHistory(userId = null) {
    try {
      const url = userId 
        ? `${API_BASE_URL}/scan-history/user/${userId}`
        : `${API_BASE_URL}/scan-history`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch scan history");
      
      const data = await response.json();
      // Convert MongoDB _id to id for compatibility
      return data.map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
      }));
    } catch (error) {
      console.error("Error fetching scan history:", error);
      throw error;
    }
  },

  // Create scan history entry
  async createScanHistory(scanData) {
    try {
      const response = await fetch(`${API_BASE_URL}/scan-history`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(scanData),
      });

      if (!response.ok) throw new Error("Failed to create scan history");

      const data = await response.json();
      return {
        ...data,
        id: data._id ? data._id.toString() : data.id,
      };
    } catch (error) {
      console.error("Error creating scan history:", error);
      throw error;
    }
  },

  // Delete scan history entry
  async deleteScanHistory(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/scan-history/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to delete scan history");

      return await response.json();
    } catch (error) {
      console.error("Error deleting scan history:", error);
      throw error;
    }
  },

  // Update scan history entry
  async updateScanHistory(id, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/scan-history/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update scan history");

      const data = await response.json();
      return {
        ...data,
        id: data._id ? data._id.toString() : data.id,
      };
    } catch (error) {
      console.error("Error updating scan history:", error);
      throw error;
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error("Error checking API health:", error);
      return { status: "error" };
    }
  },
};

