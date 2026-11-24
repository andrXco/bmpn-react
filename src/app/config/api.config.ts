// El frontend y la API comparten origen. En desarrollo, proxy.conf.json reenvía
// /api al backend local; en Docker, Nginx reenvía /api al servicio de backend.
export const API_URL = '/api';
