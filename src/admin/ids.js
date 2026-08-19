// Rows get their id in the browser so a new row and an existing one can be
// written by the same upsert. Its own module so the pure shape helpers in
// menuShape.js need nothing from the Supabase client — that is what lets
// scripts/verify.mjs exercise them under plain Node.
export const newId = () => crypto.randomUUID();
