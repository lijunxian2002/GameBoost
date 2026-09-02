import { env } from 'cloudflare:workers';
import { getBucket, getDb, json, releaseError, sha256Hex, signRelease, tokenMatches } from '@/lib/releases';

export const MAX_SAMPLE_BYTES = 8 * 1024 * 1024;
export const MAX_CONFIG_BYTES = 256 * 1024;
const ID = /^[a-f0-9-]{36}$/i;
const HEX = /^[a-f0-9]{64}$/i;
const CODE = /^GB-[A-Z2-9]{10}$/;
export function now() { return new Date().toISOString(); }
export function opaque(bytes = 24) { const a = crypto.getRandomValues(new Uint8Array(bytes)); return btoa(String.fromCharCode(...a)).replace(/[+/=]/g, '').slice(0, bytes * 1.3); }
export function caseCode() { return `GB-${opaque(10).toUpperCase().replace(/[018ILOU]/g, 'X').slice(0, 10)}`; }
export function validInstallation(value: unknown): value is string { return typeof value === 'string' && ID.test(value); }
export function validHash(value: unknown): value is string { return typeof value === 'string' && HEX.test(value); }
export function validCode(value: string) { return CODE.test(value); }
export async function tokenHash(token: string) { return sha256Hex(new TextEncoder().encode(token)); }
export async function audit(event: string, caseId: string | null, detail: string) {
  try { await getDb().prepare('INSERT INTO audit_logs (id,event,case_id,detail,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), event, caseId, detail.slice(0, 500), now()).run(); } catch { /* audit is never allowed to expose internals */ }
}
export async function optimizer(request: Request) {
  const expected = env.OPTIMIZER_TOKEN;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  return Boolean(expected && await tokenMatches(supplied, expected));
}
export async function limit(request: Request, name: string, max: number, seconds: number) {
  const salt = env.RATE_LIMIT_SALT; if (!salt) return false;
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'; const key = await sha256Hex(new TextEncoder().encode(`${salt}:${name}:${ip}`));
  const db = getDb(), t = Math.floor(Date.now() / 1000), expires = t + seconds;
  const row = await db.prepare('SELECT count,expires_at FROM request_limits WHERE bucket_key=?').bind(key).first<{count:number;expires_at:number}>();
  const count = !row || row.expires_at <= t ? 1 : row.count + 1;
  await db.prepare('INSERT INTO request_limits (bucket_key,count,expires_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(bucket_key) DO UPDATE SET count=excluded.count,expires_at=excluded.expires_at,updated_at=excluded.updated_at').bind(key,count,!row || row.expires_at <= t ? expires : row.expires_at,t).run();
  return count <= max;
}
export async function requireLimit(request: Request, name: string, max: number, seconds: number) { try { return await limit(request,name,max,seconds); } catch { return false; } }
export function sampleSummary(s: any) {
  if (!s || !['gameboost.sample/1','gameboost.sample/2'].includes(s.Schema) || !s.SampleId || !s.Device || !s.Game || !s.Frames || !Array.isArray(s.Timeline)) throw new Error('sample_schema_invalid');
  if (typeof s.SampleId !== 'string' || s.SampleId.length > 100 || s.Timeline.length > 7200) throw new Error('sample_structure_invalid');
  return { sample_id:s.SampleId, schema:s.Schema, game:String(s.Game.DisplayName || s.Game.GameId || s.Game.ProcessName || '').slice(0,120), game_id:String(s.Game.GameId || s.Game.ProcessName || '').slice(0,120), device:String(`${s.Device.CpuName || ''} · ${s.Device.GpuName || ''}`).slice(0,240), device_fingerprint:String(s.Device.DeviceFingerprint || '').slice(0,256), average_fps:Number(s.Frames.AverageFps)||0, median_fps:Number(s.Frames.MedianFps)||0, low_fps:Number(s.Frames.TailFps99)||0, warnings:Array.isArray(s.Warnings) ? s.Warnings.slice(0,30).map(String) : [] };
}
export function safePrescription(p: any) {
  const allowed = new Set(['SetFrameCap','SetGraphicsOption','SetWindowsPowerMode','SetProcessorBoostMode']);
  if (!p || p.Schema !== 'gameboost.prescription/1' || !p.PrescriptionId || !p.BasedOnSampleId || !p.DeviceFingerprint || !p.GameId || !Array.isArray(p.Actions)) throw new Error('config_schema_invalid');
  if (p.Actions.some((x:any) => !x || x.Reversible !== true || !allowed.has(x.Type))) throw new Error('unsafe_action');
  return p;
}
export async function readCase(code:string) { return getDb().prepare('SELECT * FROM cases WHERE case_code=?').bind(code).first<any>(); }
export function fail(status:number, code:string, message:string) { return releaseError(status,code,message); }
export { getBucket, getDb, json, sha256Hex, signRelease };
