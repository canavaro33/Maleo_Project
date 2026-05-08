import api from "../lib/axios";

export const apiService = {
  getAll: async (endpoint: string, params?: any) => {
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  getById: async (endpoint: string, id: string | number) => {
    const response = await api.get(`${endpoint}/${id}`);
    return response.data;
  },

  create: async (endpoint: string, data: any, config?: any) => {
    const response = await api.post(endpoint, data, config);
    return response.data;
  },

  update: async (endpoint: string, id: string | number, data: any) => {
    const response = await api.put(`${endpoint}/${id}`, data);
    return response.data;
  },

  remove: async (endpoint: string, id: string | number) => {
    const response = await api.delete(`${endpoint}/${id}`);
    return response.data;
  },
};
