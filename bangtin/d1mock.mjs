import { DatabaseSync } from 'node:sqlite';
export function makeD1() {
  const db = new DatabaseSync(':memory:');
  const norm = a => a.map(x => x === undefined ? null : (typeof x === 'boolean' ? (x ? 1 : 0) : x));
  const wrap = (sql, args = []) => ({
    bind: (...a) => wrap(sql, a),
    first: async () => db.prepare(sql).get(...norm(args)) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...norm(args)) }),
    run: async () => { const r = db.prepare(sql).run(...norm(args)); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: Number(r.changes) } }; },
    _exec: async () => { const st = db.prepare(sql); if (/^\s*(select|with)/i.test(sql)) return { results: st.all(...norm(args)) }; const r = st.run(...norm(args)); return { results: [], meta: { last_row_id: Number(r.lastInsertRowid), changes: Number(r.changes) } }; }
  });
  return { prepare: s => wrap(s), batch: async sts => { const out = []; for (const s of sts) out.push(await s._exec()); return out; } };
}
