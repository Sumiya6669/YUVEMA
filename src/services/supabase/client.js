import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

const configurationError = new Error(
  "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
);

function createQueryStub() {
  const result = {
    data: [],
    error: configurationError,
  };

  const builder = {
    select() {
      return builder;
    },
    insert() {
      return builder;
    },
    update() {
      return builder;
    },
    delete() {
      return builder;
    },
    eq() {
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },
    contains() {
      return builder;
    },
    single() {
      return Promise.resolve({
        data: null,
        error: configurationError,
      });
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

const supabaseStub = {
  auth: {
    getSession: async () => ({
      data: { session: null },
      error: configurationError,
    }),
    getUser: async () => ({
      data: { user: null },
      error: configurationError,
    }),
    signInWithPassword: async () => ({
      data: null,
      error: configurationError,
    }),
    signUp: async () => ({
      data: null,
      error: configurationError,
    }),
    signOut: async () => ({
      error: configurationError,
    }),
    onAuthStateChange(callback) {
      queueMicrotask(() => callback("INITIAL_SESSION", null));

      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      };
    },
  },
  from() {
    return createQueryStub();
  },
};

export const supabase = env.isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : supabaseStub;
