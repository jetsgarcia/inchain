import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://localhost:7140",
  headers: {
    Accept: "application/json",
  },
});

export default apiClient;
