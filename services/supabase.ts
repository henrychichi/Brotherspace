import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const createDisabledSupabaseClient = (message: string) => {
  const failure = new Error(message);
  const result = { data: null, error: failure };

  const makeQuery = () => {
    const query: any = {};
    const finalize = async () => result;
    query.select = () => query;
    query.insert = () => query;
    query.update = () => query;
    query.delete = () => query;
    query.upsert = () => query;
    query.eq = () => query;
    query.or = () => query;
    query.in = () => query;
    query.order = () => query;
    query.limit = () => query;
    query.gte = () => query;
    query.lte = () => query;
    query.contains = () => query;
    query.match = () => query;
    query.single = finalize;
    query.maybeSingle = finalize;
    query.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
    return query;
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithOtp: async () => ({ data: { user: null, session: null }, error: failure }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: failure }),
      signUp: async () => ({ data: { user: null, session: null }, error: failure }),
      signOut: async () => ({ error: failure }),
      resetPasswordForEmail: async () => ({ data: null, error: failure }),
      updateUser: async () => ({ data: { user: null }, error: failure }),
    },
    from: () => makeQuery(),
  } as any;
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Falling back to a disabled client until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are provided.'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createDisabledSupabaseClient(
      'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
