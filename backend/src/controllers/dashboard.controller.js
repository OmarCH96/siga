/**
 * Controlador de Dashboard
 * Maneja las operaciones del dashboard administrativo
 */

const db = require('../config/database');
const { asyncHandler } = require('../middlewares/error.middleware');
const log = require('../utils/logger');

/**
 * Obtiene los datos del dashboard (unidades, métricas, distribución)
 * GET /api/dashboard/datos
 */
const getDatos = asyncHandler(async (req, res) => {
  log.debug('Obteniendo datos del dashboard', { usuarioId: req.user?.id });

  // Obtener unidades administrativas (áreas activas)
  const unidadesQuery = `
    SELECT 
      a.id,
      a.nombre,
      a.clave,
      a.tipo,
      COUNT(DISTINCT d.id) as total_documentos,
      COUNT(DISTINCT u.id) as total_usuarios
    FROM area a
    LEFT JOIN documento d ON d.area_origen_id = a.id
    LEFT JOIN usuario u ON u.area_id = a.id AND u.activo = true
    WHERE a.activa = true
    GROUP BY a.id, a.nombre, a.clave, a.tipo
    ORDER BY a.nombre
  `;

  const unidades = await db.query(unidadesQuery);

  // Obtener métricas semanales (últimos 7 días)
  const metricasQuery = `
    SELECT 
      DATE(fecha_creacion) as fecha,
      COUNT(*) as total
    FROM documento
    WHERE fecha_creacion >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(fecha_creacion)
    ORDER BY fecha
  `;

  const metricas = await db.query(metricasQuery);

  // Obtener distribución por estados
  const distribucionQuery = `
    SELECT 
      estado,
      COUNT(*) as total
    FROM documento
    WHERE fecha_creacion >= NOW() - INTERVAL '30 days'
    GROUP BY estado
    ORDER BY total DESC
  `;

  const distribucion = await db.query(distribucionQuery);

  res.status(200).json({
    success: true,
    data: {
      unidades: unidades.rows.map(u => ({
        id: u.id,
        nombre: u.nombre,
        clave: u.clave,
        tipo: u.tipo,
        totalDocumentos: parseInt(u.total_documentos) || 0,
        totalUsuarios: parseInt(u.total_usuarios) || 0,
      })),
      metricasSemanales: metricas.rows.map(m => ({
        fecha: m.fecha,
        total: parseInt(m.total) || 0,
      })),
      distribucionEstados: distribucion.rows.map(d => ({
        estado: d.estado,
        total: parseInt(d.total) || 0,
      })),
    },
  });
});

/**
 * Obtiene los registros/documentos recientes
 * GET /api/dashboard/registros
 */
const getRegistros = asyncHandler(async (req, res) => {
  log.debug('Obteniendo registros del dashboard', { usuarioId: req.user?.id });

  const query = `
    SELECT 
      d.id,
      d.folio,
      d.asunto,
      d.estado,
      d.prioridad,
      d.fecha_creacion,
      d.fecha_limite as fecha_vencimiento,
      ao.nombre as area_origen,
      td.nombre as tipo_documento,
      u.nombre || ' ' || u.apellidos as creado_por
    FROM documento d
    LEFT JOIN area ao ON d.area_origen_id = ao.id
    LEFT JOIN tipo_documento td ON d.tipo_documento_id = td.id
    LEFT JOIN usuario u ON d.usuario_creador_id = u.id
    ORDER BY d.fecha_creacion DESC
    LIMIT 50
  `;

  const result = await db.query(query);

  res.status(200).json({
    success: true,
    data: result.rows.map(r => ({
      id: r.id,
      folio: r.folio,
      asunto: r.asunto,
      estado: r.estado,
      prioridad: r.prioridad,
      fechaCreacion: r.fecha_creacion,
      fechaVencimiento: r.fecha_vencimiento,
      origenDestino: r.area_origen || 'N/A',
      tipoDocumento: r.tipo_documento,
      creadoPor: r.creado_por,
    })),
  });
});

/**
 * Obtiene la lista de usuarios activos
 * GET /api/dashboard/usuarios
 */
const getUsuarios = asyncHandler(async (req, res) => {
  log.debug('Obteniendo usuarios del dashboard', { usuarioId: req.user?.id });

  const query = `
    SELECT 
      u.id,
      u.nombre,
      u.apellidos,
      u.nombre_usuario,
      u.email,
      u.activo,
      r.nombre as rol,
      a.nombre as area
    FROM usuario u
    INNER JOIN rol r ON u.rol_id = r.id
    INNER JOIN area a ON u.area_id = a.id
    WHERE u.activo = true
    ORDER BY u.nombre, u.apellidos
  `;

  const result = await db.query(query);

  res.status(200).json({
    success: true,
    data: result.rows.map(u => ({
      id: u.id,
      nombre: u.nombre,
      apellidos: u.apellidos,
      nombreUsuario: u.nombre_usuario,
      email: u.email,
      activo: u.activo,
      rol: u.rol,
      area: u.area,
    })),
  });
});

module.exports = {
  getDatos,
  getRegistros,
  getUsuarios,
};
