import { supabase } from "@/services/supabase/client";
import { createSupabaseEntity } from "@/services/api/supabaseEntity";
import {
  assertNoError,
  getCurrentSessionUser,
  mapTimestampFields,
} from "@/services/api/helpers";
import {
  createLocalCartEntity,
  createLocalWishlistEntity,
} from "@/services/storage/localEntities";

function mapProfile(record) {
  const profile = mapTimestampFields(record);
  return {
    ...profile,
    full_name: profile.full_name || profile.email,
  };
}

async function getProfile(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return null;
  }

  return mapProfile(data);
}

async function getServerResolvedProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  const response = await fetch("/api/auth-profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to resolve auth profile");
  }

  return response.json();
}

async function getUserRecord() {
  const user = await getCurrentSessionUser(supabase);

  if (!user) {
    return null;
  }

  try {
    const serverProfile = await getServerResolvedProfile();

    if (serverProfile?.id) {
      return serverProfile;
    }
  } catch {}

  const profile = await getProfile(user.id);

  return {
    id: user.id,
    email: user.email,
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email ||
      "Пользователь",
    role: profile?.role || "user",
    wholesale_approved: profile?.wholesale_approved || false,
    company_name: profile?.company_name || "",
    company_bin: profile?.company_bin || "",
    city: profile?.city || "",
    phone: profile?.phone || "",
    created_date: profile?.created_date || user.created_at || null,
  };
}

const Product = createSupabaseEntity({
  table: "products",
  defaultOrder: "-created_date",
});

const BlogPost = createSupabaseEntity({
  table: "blog_posts",
  defaultOrder: "-created_date",
});

const Review = createSupabaseEntity({
  table: "reviews",
  defaultOrder: "-created_date",
});

const Order = createSupabaseEntity({
  table: "orders",
  defaultOrder: "-created_date",
  beforeCreate: async (payload) => {
    const currentUser = await getCurrentSessionUser(supabase);

    return {
      ...payload,
      user_id: currentUser?.id || null,
    };
  },
});

const User = createSupabaseEntity({
  table: "profiles",
  defaultOrder: "-created_date",
  mapRecord: mapProfile,
});

const B2BApplication = createSupabaseEntity({
  table: "b2b_applications",
  defaultOrder: "-created_date",
  beforeCreate: async (payload) => {
    const currentUser = await getCurrentSessionUser(supabase);

    return {
      ...payload,
      user_id: currentUser?.id || null,
    };
  },
});

const ContactMessage = createSupabaseEntity({
  table: "contact_messages",
  defaultOrder: "-created_date",
});

const CartItem = createLocalCartEntity();
const WishlistItem = createLocalWishlistEntity();

export const apiClient = {
  auth: {
    async me() {
      return getUserRecord();
    },

    async getSession() {
      return supabase.auth.getSession();
    },

    onAuthStateChange(callback) {
      return supabase.auth.onAuthStateChange(callback);
    },

    async login({ email, password }) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      assertNoError(error, "sign in");
      return getUserRecord();
    },

    async register({ email, password, fullName }) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      assertNoError(error, "sign up");
      return true;
    },

    async updateProfile(payload) {
      const currentUser = await getCurrentSessionUser(supabase);
      if (!currentUser) {
        throw new Error("Сначала войдите в аккаунт");
      }

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", currentUser.id);

      assertNoError(error, "update profile");
      return getUserRecord();
    },

    async logout(redirectTo) {
      const { error } = await supabase.auth.signOut();
      assertNoError(error, "sign out");

      if (redirectTo) {
        window.location.href = redirectTo;
      }
    },

    redirectToLogin(returnTo = window.location.pathname) {
      const next = encodeURIComponent(returnTo);
      window.location.href = `/?auth=login&next=${next}`;
    },
  },

  entities: {
    Product,
    BlogPost,
    Review,
    Order,
    User,
    CartItem,
    WishlistItem,
    B2BApplication,
    ContactMessage,
  },
};
