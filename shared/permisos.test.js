import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MODULOS_PERMISOS,
  PERMISOS_DEFAULT_OPERADOR,
  PERMISOS_DEFAULT_ADMIN,
  tienePermiso,
  normalizarPermisos,
} from './permisos.js';

test('administrador siempre tiene todos los permisos en todos los módulos y subsecciones', () => {
  const admin = { id: 1, usuario: 'admin', rol: 'admin', permisos: {} };
  for (const m of MODULOS_PERMISOS) {
    assert.equal(tienePermiso(admin, m.id), true, `Admin debe tener permiso en módulo ${m.id}`);
    for (const sub of m.subpermisos) {
      assert.equal(tienePermiso(admin, sub.id), true, `Admin debe tener permiso en subsección ${sub.id}`);
    }
  }
});

test('operador con permisos por defecto', () => {
  const op = { id: 2, usuario: 'juan', rol: 'operador' };
  assert.equal(tienePermiso(op, 'recepcion'), true);
  assert.equal(tienePermiso(op, 'recepcion_toma'), true);
  assert.equal(tienePermiso(op, 'recepcion_cancelar'), true);
  assert.equal(tienePermiso(op, 'choferes'), true);
  assert.equal(tienePermiso(op, 'historial'), true);
  assert.equal(tienePermiso(op, 'clientes'), true);
  assert.equal(tienePermiso(op, 'admin'), false);
  assert.equal(tienePermiso(op, 'admin_calles'), false);
  assert.equal(tienePermiso(op, 'admin_choferes'), false);
});

test('operador con permisos personalizados por subsección de Administración', () => {
  const op = {
    id: 3,
    usuario: 'maria',
    rol: 'operador',
    permisos: normalizarPermisos({
      admin: true,
      admin_choferes: true,
      admin_calles: true,
      admin_operadores: false,
      admin_configuracion: false,
      admin_identidad: false,
    }, 'operador'),
  };
  assert.equal(tienePermiso(op, 'admin'), true, 'Debe poder acceder a Admin porque tiene subsecciones activas');
  assert.equal(tienePermiso(op, 'admin_choferes'), true);
  assert.equal(tienePermiso(op, 'admin_calles'), true);
  assert.equal(tienePermiso(op, 'admin_operadores'), false);
  assert.equal(tienePermiso(op, 'admin_configuracion'), false);
  assert.equal(tienePermiso(op, 'admin_identidad'), false);
});

test('si todas las subsecciones están apagadas el módulo padre se desactiva', () => {
  const op = {
    id: 4,
    usuario: 'pedro',
    rol: 'operador',
    permisos: normalizarPermisos({
      recepcion_toma: false,
      recepcion_chofer: false,
      recepcion_avisar: false,
      recepcion_cancelar: false,
      recepcion_ficha: false,
    }, 'operador'),
  };
  assert.equal(tienePermiso(op, 'recepcion'), false);
  assert.equal(tienePermiso(op, 'recepcion_toma'), false);
});
