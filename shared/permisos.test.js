import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERMISOS_DISPONIBLES,
  PERMISOS_DEFAULT_OPERADOR,
  PERMISOS_DEFAULT_ADMIN,
  tienePermiso,
  normalizarPermisos,
} from './permisos.js';

test('administrador siempre tiene todos los permisos', () => {
  const admin = { id: 1, usuario: 'admin', rol: 'admin', permisos: {} };
  for (const p of PERMISOS_DISPONIBLES) {
    assert.equal(tienePermiso(admin, p.id), true, `Admin debe tener permiso ${p.id}`);
  }
});

test('operador con permisos por defecto', () => {
  const op = { id: 2, usuario: 'juan', rol: 'operador' };
  assert.equal(tienePermiso(op, 'recepcion'), true);
  assert.equal(tienePermiso(op, 'choferes'), true);
  assert.equal(tienePermiso(op, 'historial'), true);
  assert.equal(tienePermiso(op, 'clientes'), true);
  assert.equal(tienePermiso(op, 'admin'), false);
  assert.equal(tienePermiso(op, 'cancelar_viajes'), true);
  assert.equal(tienePermiso(op, 'editar_viajes'), true);
  assert.equal(tienePermiso(op, 'exportar_csv'), true);
});

test('operador con permisos personalizados', () => {
  const op = {
    id: 3,
    usuario: 'maria',
    rol: 'operador',
    permisos: {
      recepcion: true,
      choferes: false,
      historial: false,
      clientes: true,
      admin: false,
      cancelar_viajes: false,
      editar_viajes: false,
      exportar_csv: false,
    },
  };
  assert.equal(tienePermiso(op, 'recepcion'), true);
  assert.equal(tienePermiso(op, 'choferes'), false);
  assert.equal(tienePermiso(op, 'historial'), false);
  assert.equal(tienePermiso(op, 'clientes'), true);
  assert.equal(tienePermiso(op, 'admin'), false);
  assert.equal(tienePermiso(op, 'cancelar_viajes'), false);
  assert.equal(tienePermiso(op, 'editar_viajes'), false);
  assert.equal(tienePermiso(op, 'exportar_csv'), false);
});

test('normalizarPermisos completa campos ausentes con valores por defecto', () => {
  const perms = normalizarPermisos({ recepcion: false }, 'operador');
  assert.equal(perms.recepcion, false);
  assert.equal(perms.choferes, true);
  assert.equal(perms.admin, false);

  const permsAdmin = normalizarPermisos({ recepcion: false }, 'admin');
  assert.equal(permsAdmin.admin, true);
});
