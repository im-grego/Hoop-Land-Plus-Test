// Direct upload to Dropbox (OAuth 2 PKCE, no redirect: the user pastes the
// code Dropbox shows them). Uses the user's own Dropbox app key; tokens stay
// in this browser's storage.

const KEY = 'hlc:dropbox';
// The app's own Dropbox app key (public; PKCE needs no secret). When set,
// nobody has to create a Dropbox app: Connect just works.
export const BUILT_IN_APP_KEY = 'yo328m6ytsdzugc';
const AUTH_URL = 'https://www.dropbox.com/oauth2/authorize';
const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload';
const DOWNLOAD_URL = 'https://content.dropboxapi.com/2/files/download';
const API = 'https://api.dropboxapi.com/2';

export function dropboxConfig() {
  const base = { folder: BUILT_IN_APP_KEY ? '' : '/Hoop Land', overwrite: false, appKey: BUILT_IN_APP_KEY || '' };
  try { const c = { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; if (!c.appKey) c.appKey = base.appKey; return c; }
  catch { return base; }
}
export function saveDropboxConfig(patch) {
  const c = { ...dropboxConfig(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* storage unavailable */ }
  return c;
}
export const dropboxConnected = () => !!dropboxConfig().refreshToken;
export const disconnectDropbox = () => saveDropboxConfig({ refreshToken: null, accessToken: null, expires: 0, verifier: null });

const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Step 1: returns the URL to open; the verifier is kept for step 2.
export async function dropboxAuthUrl(appKey, redirect = null) {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  saveDropboxConfig({ appKey, verifier, redirect });
  const q = new URLSearchParams({
    client_id: appKey, response_type: 'code', code_challenge: challenge,
    code_challenge_method: 'S256', token_access_type: 'offline', ...(redirect ? { redirect_uri: redirect } : {}),
  });
  return `${AUTH_URL}?${q}`;
}

async function tokenRequest(body) {
  const res = await fetch(TOKEN_URL, { method: 'POST', body: new URLSearchParams(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error_description || json.error || `Dropbox said ${res.status}`);
  return json;
}

// Step 2: exchange the pasted code for tokens.
export async function dropboxFinishAuth(code) {
  const c = dropboxConfig();
  if (!c.appKey || !c.verifier) throw new Error('Start the connection again.');
  const t = await tokenRequest({ code: code.trim(), grant_type: 'authorization_code', code_verifier: c.verifier, client_id: c.appKey, ...(c.redirect ? { redirect_uri: c.redirect } : {}) });
  saveDropboxConfig({ verifier: null, redirect: null, refreshToken: t.refresh_token, accessToken: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000 });
}

async function accessToken() {
  const c = dropboxConfig();
  if (!c.refreshToken) throw new Error('Not connected to Dropbox.');
  if (c.accessToken && Date.now() < c.expires) return c.accessToken;
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: c.refreshToken, client_id: c.appKey });
  saveDropboxConfig({ accessToken: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000 });
  return t.access_token;
}

// Dropbox-API-Arg must be ASCII: escape everything else as \uXXXX.
const headerJson = obj => JSON.stringify(obj).replace(/[\u007f-￿]/g, ch => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);

// Dropbox refuses some characters in a name (\ : ? * " < > | and control characters) and names ending in a dot or a
// space ("disallowed name"); each part of the path is cleaned so an upload never fails on the file's name.
const cleanPart = part => part.replace(/[\\:?*"<>|\u0000-\u001f\u007f]/g, '_').replace(/[. ]+$/, '').trim() || '_';
export function dropboxPath(name, folder = dropboxConfig().folder) {
  const parts = [...String(folder || '').split('/'), ...String(name || 'file').split('/')].filter(x => x.trim()).map(cleanPart);
  return `/${parts.join('/')}`;
}

// Upload a Blob/File. Returns the saved path (Dropbox may rename on conflict).
export async function dropboxUpload(blob, name) {
  const c = dropboxConfig();
  const arg = { path: dropboxPath(name, c.folder), mode: c.overwrite ? 'overwrite' : 'add', autorename: true, mute: false };
  const send = async token => fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Dropbox-API-Arg': headerJson(arg), 'Content-Type': 'application/octet-stream' },
    body: blob,
  });
  let res = await send(await accessToken());
  if (res.status === 401) { saveDropboxConfig({ accessToken: null, expires: 0 }); res = await send(await accessToken()); }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error_summary || `Upload failed (${res.status})`);
  return json.path_display;
}

// A content call with one retry on an expired token.
async function contentCall(url, arg, body = undefined) {
  const send = async token => fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Dropbox-API-Arg': headerJson(arg), ...(body !== undefined ? { 'Content-Type': 'application/octet-stream' } : {}) },
    ...(body !== undefined ? { body } : {}),
  });
  let res = await send(await accessToken());
  if (res.status === 401) { saveDropboxConfig({ accessToken: null, expires: 0 }); res = await send(await accessToken()); }
  return res;
}
// Write text at an exact path, replacing what's there (small app files such as a save's traits).
export async function dropboxPut(path, text) {
  const res = await contentCall(UPLOAD_URL, { path, mode: 'overwrite', autorename: false, mute: true }, new Blob([text], { type: 'application/json' }));
  if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error_summary || `Upload failed (${res.status})`); }
  return true;
}
// Read a file's text; null when there's no file at that path.
export async function dropboxGet(path) {
  const res = await contentCall(DOWNLOAD_URL, { path });
  if (res.status === 409) return null;
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.text();
}

// An RPC call with one retry on an expired token.
async function apiCall(route, body) {
  const send = async token => fetch(`${API}/${route}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let res = await send(await accessToken());
  if (res.status === 401) { saveDropboxConfig({ accessToken: null, expires: 0 }); res = await send(await accessToken()); }
  return { res, json: await res.json().catch(() => ({})) };
}
// The file's share link (the kind you'd copy in the Dropbox app), made once and reused after that.
export async function dropboxShareLink(path) {
  let { res, json } = await apiCall('sharing/create_shared_link_with_settings', { path, settings: { audience: 'public', access: 'viewer' } });
  if (res.ok) return json.url;
  if (json.error?.['.tag'] === 'shared_link_already_exists' && json.error.shared_link_already_exists?.metadata?.url) return json.error.shared_link_already_exists.metadata.url;
  ({ res, json } = await apiCall('sharing/list_shared_links', { path, direct_only: true }));
  if (res.ok && json.links?.length) return json.links[0].url;
  throw new Error(json.error_summary || `Couldn't make a share link (${res.status})`);
}
// Upload a file in place (one file per save name, so its share link stays the same export after export).
// The upload with progress (onProgress(0..1)): XMLHttpRequest, since fetch can't report how much has gone up.
function xhrUpload(url, arg, blob, token, onProgress) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', url);
    x.setRequestHeader('Authorization', `Bearer ${token}`);
    x.setRequestHeader('Dropbox-API-Arg', headerJson(arg));
    x.setRequestHeader('Content-Type', 'application/octet-stream');
    if (onProgress) x.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    x.onload = () => { let json = {}; try { json = JSON.parse(x.responseText); } catch { /* not JSON */ } resolve({ status: x.status, json }); };
    x.onerror = () => reject(new Error('Network error: check your connection'));
    x.send(blob);
  });
}
export async function dropboxUploadFixed(blob, name, onProgress = null) {
  const path = dropboxPath(name, dropboxConfig().folder), arg = { path, mode: 'overwrite', autorename: false, mute: true };
  let r = await xhrUpload(UPLOAD_URL, arg, blob, await accessToken(), onProgress);
  if (r.status === 401) { saveDropboxConfig({ accessToken: null, expires: 0 }); onProgress?.(0); r = await xhrUpload(UPLOAD_URL, arg, blob, await accessToken(), onProgress); }
  if (r.status < 200 || r.status >= 300) throw new Error(r.json.error_summary || `Upload failed (${r.status})`);
  return r.json.path_display || path;
}

// A Dropbox share link as a direct download (dl.dropboxusercontent.com, dl=1), and the file's name from its path.
export function dropboxLinkInfo(link) {
  let u;
  try { u = new URL(String(link || '').trim()); } catch { throw new Error('Paste the whole Dropbox link.'); }
  if (!/(^|\.)dropbox(usercontent)?\.com$/i.test(u.hostname)) throw new Error('That isn\'t a Dropbox link.');
  const name = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || 'season');
  const direct = new URL(u.toString());
  direct.hostname = 'dl.dropboxusercontent.com';
  direct.searchParams.set('dl', '1');
  return { name, direct: direct.toString(), shared: u.toString() };
}
// Read a shared file: straight from Dropbox's download address; if that's refused and Dropbox is connected, through
// the API (sharing/get_shared_link_file).
export async function dropboxFetchShared(link) {
  const info = dropboxLinkInfo(link);
  try {
    const r = await fetch(info.direct);
    if (r.ok) { const text = await r.text(); if (text && !/^\s*<!doctype html|^\s*<html/i.test(text)) return { text, name: info.name }; }
  } catch { /* fall through to the API */ }
  if (dropboxConnected()) {
    const res = await fetch('https://content.dropboxapi.com/2/sharing/get_shared_link_file', {
      method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Dropbox-API-Arg': headerJson({ url: info.shared }) },
    });
    if (res.ok) return { text: await res.text(), name: info.name };
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error_summary || `Dropbox said ${res.status}`);
  }
  throw new Error('Dropbox wouldn\'t hand the file over. Connect Dropbox on the Export screen, or download the file and load it.');
}
