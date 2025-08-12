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
    timestamp: v.optional(v.number()),  // Add this line
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
    quantity: v.number(),
    price: v.number(),
    impactScore: v.number(),
    footprint: v.object({
      co2: v.number(),
      plastic: v.number(),
      water: v.number(),
    }),
    date: v.string(),
    receiptImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const timestamp = Date.now();

    // Insert the purchase into the database
    return await ctx.db.insert("purchases", {
      userId,
      timestamp,
      ...args,
    });
  },
});

// List all purchases for the current user
export const listPurchases = query({
  args: {
    category: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    // Apply category filter if provided
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    // Apply date range filter if provided
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), args.startDate!),
          q.lte(q.field("timestamp"), args.endDate!)
        )
      );
    }

    return await query.order("desc").collect();
  },
});

// Delete a purchase
export const deletePurchase = mutation({
  args: {
    purchaseId: v.id("purchases"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify the purchase belongs to the current user
    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("Purchase not found");
    if (purchase.userId !== userId) throw new Error("Not authorized to delete this purchase");

    // Delete the purchase
    await ctx.db.delete(args.purchaseId);
    return { success: true };
  },
});

// Delete all purchases for the current user
export const deleteAllPurchases = mutation({
  args: {},
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all purchases for the current user
    const userPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Delete all purchases
    const deletePromises = userPurchases.map(purchase => ctx.db.delete(purchase._id));
    await Promise.all(deletePromises);

    return { success: true, deletedCount: userPurchases.length };
  },
});