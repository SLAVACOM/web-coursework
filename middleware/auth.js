function requireAuth(req, res, next) {
  if (!req.session.user) {
    if (req.xhr) return res.status(401).json({ error: 'Не авторизован' });
    return res.redirect('/login');
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      if (req.xhr) return res.status(401).json({ error: 'Не авторизован' });
      return res.redirect('/login');
    }
    if (!roles.includes(req.session.user.role)) {
      if (req.xhr) return res.status(403).json({ error: 'Нет доступа' });
      return res.status(403).render('403');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
