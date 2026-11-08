module.exports = ({ config }) => {
  const baseUrl = process.env.TERSRH_PAGES_BASE_PATH;
  if (!baseUrl) return config;
  if (!/^\/[a-zA-Z0-9._-]+$/.test(baseUrl)) throw new Error('Invalid GitHub Pages base path');
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
