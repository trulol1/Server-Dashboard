// API communication module for authentication
// Allows override via <script>window.API_BASE_URL = "https://your-backend.com/api"</script> in HTML
const API_BASE_URL = window.API_BASE_URL || `${window.location.origin}/api`;

class AuthAPI {
  constructor() {
    this.token = null;
    this.loadTokenFromStorage();
  }

  // Load token from localStorage on page load
  loadTokenFromStorage() {
    this.token = localStorage.getItem('authToken');
  }

  // Save token to localStorage
  saveToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear token from storage
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get authorization header
  getAuthHeader() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Login with TOTP code
  async login(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      this.saveToken(data.token);
      return { success: true, token: data.token };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get setup QR code for first-time setup
  async getSetupQRCode() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/setup`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get QR code');
      }

      return { success: true, ...data };
    } catch (error) {
      console.error('Setup error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify token is valid
  async verify() {
    if (!this.token) {
      return { valid: false };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        this.clearToken();
        return { valid: false };
      }

      return { valid: true };
    } catch (error) {
      console.error('Verification error:', error);
      this.clearToken();
      return { valid: false };
    }
  }

  // Logout
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeader()
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.clearToken();
  }

  // Check if authenticated
  isAuthenticated() {
    return this.token !== null && this.token !== undefined;
  }
}

// Create global instance
const authAPI = new AuthAPI();
