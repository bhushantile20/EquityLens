import api from "./axios";

export const fetchPortfolio = async () => {
  const { data } = await api.get("portfolios/");
  return data;
};

export const createPortfolio = async (payload) => {
  const { data } = await api.post("portfolios/", payload);
  return data;
};

export const updatePortfolio = async (id, payload) => {
  const { data } = await api.patch(`portfolios/${id}/`, payload);
  return data;
};

export const deletePortfolio = async (id) => {
  await api.delete(`portfolios/${id}/`);
};

export const addStockToPortfolio = async (portfolioId, symbol, quantity = 1, buyPrice = null) => {
  const payload = { symbol, quantity };
  if (buyPrice !== null) payload.buy_price = buyPrice;
  const { data } = await api.post(`portfolios/${portfolioId}/add-stock/`, payload);
  return data;
};

export const removeStockFromPortfolio = async (stockId) => {
  await api.delete(`stocks/${stockId}/remove/`);
};

export const fetchStocks = async (portfolioId = null) => {
  const queryParams = new URLSearchParams();
  if (portfolioId) {
    queryParams.set("portfolio", String(portfolioId));
  }
  const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const { data } = await api.get(`stocks/${suffix}`);
  return data;
};

export const searchLiveStocks = async (query, limit = 10) => {
  const queryParams = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  const { data } = await api.get(`stocks/live-search/?${queryParams.toString()}`);
  return data;
};

export const fetchLiveStockBySymbol = async (symbol, options = {}) => {
  const queryParams = new URLSearchParams({ symbol });
  if (options.period) {
    queryParams.set("period", options.period);
  }
  if (options.interval) {
    queryParams.set("interval", options.interval);
  }
  const { data } = await api.get(`stocks/live-detail/?${queryParams.toString()}`);
  return data;
};

export const fetchLiveStockComparison = async (symbolA, symbolB, options = {}) => {
  const queryParams = new URLSearchParams({
    symbol_a: symbolA,
    symbol_b: symbolB,
  });
  if (options.period) {
    queryParams.set("period", options.period);
  }
  if (options.interval) {
    queryParams.set("interval", options.interval);
  }
  const { data } = await api.get(`stocks/live-compare/?${queryParams.toString()}`);
  return data;
};

export const fetchStockById = async (id) => {
  const { data } = await api.get(`stocks/${id}/`);
  return data;
};

export const fetchPortfolioAnalysis = async (portfolioId) => {
  const { data } = await api.get(`portfolios/${portfolioId}/analysis/`);
  return data;
};

export const fetchAssetForecast = async (asset) => {
  const queryParams = new URLSearchParams({ asset });
  const { data } = await api.get(`forecast/?${queryParams.toString()}`);
  return data;
};

export const fetchStockPrediction = async (asset, model = "random_forest", horizon = "30d") => {
  const { data } = await api.get(`predict/?asset=${asset}&model=${model}&horizon=${horizon}`);
  return data;
};
