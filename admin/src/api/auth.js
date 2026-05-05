import request from './request';

export function loginByPassword(data) {
  return request.post('/admin/auth/login', data);
}

export function getAdminInfo() {
  return request.get('/admin/auth/info');
}

export function logoutRequest() {
  return request.post('/admin/auth/logout');
}
