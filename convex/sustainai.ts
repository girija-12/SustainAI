import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

export const createUserProfile = mutation({
  args: {
    sustainabilityScore: v.number(),
    wellbeingIndex: v.number(),
    preferences: v.object({
      categories: v.array(v.string()),
      budget: v.number(),
      location: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("userProfiles", {
      userId,
      ...args,
    });
  },
});

export const getTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const getWellbeingCheckins = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("wellbeingCheckins")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);
  },
});

export const addWellbeingCheckin = mutation({
  args: {
    mood: v.number(),
    stress: v.number(),
    energy: v.number(),
    sleep: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("wellbeingCheckins", {
      userId,
      ...args,
    });
  },
});

export const getActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("alerts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(10);
  },
});

// Add a purchase
export const addPurchase = mutation({
  args: {
    productName: v.string(),
    category: v.string(),
    price: v.number(),
    impactScore: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("purchases", args);
  },
});

// List all purchases
export const listPurchases = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("purchases").collect();
  },
});