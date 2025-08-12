import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  userProfiles: defineTable({
    userId: v.id("users"),
    sustainabilityScore: v.number(),
    wellbeingIndex: v.number(),
    preferences: v.object({
      categories: v.array(v.string()),
      budget: v.number(),
      location: v.string(),
    }),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    category: v.string(),
    description: v.string(),
    fraudProbability: v.number(),
    isFlagged: v.boolean(),
  }).index("by_user", ["userId"]),

  wellbeingCheckins: defineTable({
    userId: v.id("users"),
    mood: v.number(),
    stress: v.number(),
    energy: v.number(),
    sleep: v.number(),
    notes: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  alerts: defineTable({
    type: v.string(),
    severity: v.string(),
    message: v.string(),
    location: v.optional(v.string()),
    isActive: v.boolean(),
  }),

  // schema.ts
  purchases: defineTable({
    productName: v.string(),
    category: v.string(),
    price: v.number(),
    impactScore: v.number(),
    date: v.string(), // ISO date string
  }),

};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});