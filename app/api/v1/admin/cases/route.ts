import { fail, getDb, json, optimizer } from '@/lib/p1';
export async function GET(request:Request) { if(!await optimizer(request))return fail(401,'unauthorized','仅优化师可访问'); const r=await getDb().prepare('SELECT case_code,status,player_description,created_at,updated_at FROM cases ORDER BY updated_at DESC LIMIT 100').all(); return json({cases:r.results||[]}); }
