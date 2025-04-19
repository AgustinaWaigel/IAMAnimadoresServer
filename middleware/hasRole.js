module.exports = function hasRole(rolRequerido) {
    return (req, res, next) => {
      if (!req.user || req.user.rol !== rolRequerido) {
        return res.status(403).json({ success: false, message: "No autorizado" });
      }
      next();
    };
  };
  