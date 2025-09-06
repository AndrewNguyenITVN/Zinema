import { API_BASE_URL } from '@/constants';

/**
 * Custom fetch wrapper with error handling
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function efetch(url, options = {}) {
  let result = {};
  let json = {};

  try {
    result = await fetch(url, options);
    json = await result.json();
  } catch (error) {
    throw new Error(error.message);
  }

  if (!result.ok || json.status !== 'success') {
    throw new Error(json.message || 'Request failed');
  }

  return json.data;
}

function makeStatisticsService() {
    const baseUrl = `${API_BASE_URL}/statistics`;

    function getAuthHeaders() {
        const token = localStorage.getItem('cinema_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async function getDashboardStatistics() {
        return efetch(`${baseUrl}/dashboard`, {
            headers: getAuthHeaders()
        });
    }

    return {
        getDashboardStatistics,
    };
}

export default makeStatisticsService();
