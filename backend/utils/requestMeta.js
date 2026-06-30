export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}

export function getUserAgent(req) {
  return req.headers['user-agent'] || '';
}

export function parseDeviceLabel(userAgent = '') {
  if (!userAgent) return 'Unknown device';
  if (/Mobile|Android|iPhone/i.test(userAgent)) {
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/Android/i.test(userAgent)) return 'Android phone';
    return 'Mobile device';
  }
  if (/Macintosh/i.test(userAgent)) return 'Mac';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Linux/i.test(userAgent)) return 'Linux';
  if (/Chrome/i.test(userAgent)) return 'Chrome browser';
  if (/Firefox/i.test(userAgent)) return 'Firefox browser';
  if (/Safari/i.test(userAgent)) return 'Safari browser';
  return 'Desktop browser';
}
