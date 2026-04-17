/**
 * Controlador de Registro de Accesos
 * Expone los eventos de auditoria_sistema (logins, logouts, etc.)
 * Solo accesible por administradores.
 */

const { asyncHandler } = require('../middlewares/error.middleware');
const auditoriaRepository = require('../repositories/auditoria.repository');
const log = require('../utils/logger');

/**
 * GET /api/accesos
 * Lista los registros de auditoria_sistema con paginación y filtros.
 *
 * Query params:
 *   page        {number}  Página (default 1)
 *   limit       {number}  Registros por página (default 10, max 100)
 *   busqueda    {string}  Filtra por nombre de usuario o IP
 *   estado      {string}  Filtra por acción exacta (LOGIN_EXITOSO, LOGIN_FALLIDO, MFA_REQUERIDO)
 *   dispositivo {string}  'movil' | 'escritorio'
 */
const listarAccesos = asyncHandler(async (req, res) => {
    log.debug('Listando registro de accesos', { usuarioId: req.user?.id });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const busqueda = (req.query.busqueda || '').trim().substring(0, 100);
    const estado = (req.query.estado || '').trim();
    const dispositivo = (req.query.dispositivo || '').trim().toLowerCase();

    const { rows, total } = await auditoriaRepository.listarAccesos({
        page,
        limit,
        busqueda,
        estado,
        dispositivo,
    });

    // Normalizar cada fila para el frontend
    const accesos = rows.map((r) => ({
        id: r.id,
        accion: r.accion,
        descripcion: r.descripcion,
        ipAddress: r.ip_address || 'N/A',
        userAgent: r.user_agent || '',
        fecha: r.fecha,
        detalles: r.detalles,
        usuario: r.usuario_id
            ? {
                id: r.usuario_id,
                nombre: r.usuario_nombre,
                apellidos: r.usuario_apellidos,
                rolNombre: r.rol_nombre,
                areaNombre: r.area_nombre,
            }
            : null,
    }));

    res.status(200).json({
        success: true,
        data: {
            accesos,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});

module.exports = { listarAccesos };
