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
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  ecoHabits: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    reusableProducts: v.boolean(),
    plantBasedMeals: v.boolean(),
    timeInNature: v.boolean(),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  menstrualLogs: defineTable({
    userId: v.id("users"),
    cycleStartDate: v.string(),
    symptoms: v.string(),
    flow: v.optional(v.string()),
    mood: v.optional(v.array(v.string())),
    pain: v.optional(v.number()), // 1-10 scale
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_date", ["userId", "cycleStartDate"]),

  voiceCheckins: defineTable({
    userId: v.id("users"),
    audioUrl: v.optional(v.string()),
    transcription: v.string(),
    sentiment: v.optional(v.object({
      score: v.number(), // -1 to 1
      magnitude: v.number(),
      emotions: v.array(v.object({
        emotion: v.string(),
        confidence: v.number(),
      })),
    })),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),

  chatMessages: defineTable({
    userId: v.id("users"),
    agentType: v.string(), // "wellbeing", "sustainability", etc.
    role: v.string(), // "user" or "assistant"
    content: v.string(),
    metadata: v.optional(v.object({
      recommendations: v.optional(v.array(v.string())),
      actionItems: v.optional(v.array(v.string())),
      relatedData: v.optional(v.any()),
    })),
    timestamp: v.number(),
  }).index("by_user_agent", ["userId", "agentType"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  recommendations: defineTable({
    userId: v.id("users"),
    type: v.string(), // "wellbeing", "eco", "nutrition", "exercise"
    title: v.string(),
    description: v.string(),
    priority: v.number(), // 1-5
    category: v.string(),
    isCompleted: v.boolean(),
    isActive: v.boolean(),
    basedOn: v.array(v.string()), // what data this recommendation is based on
    timestamp: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_user_type", ["userId", "type"]),

  userSettings: defineTable({
    userId: v.id("users"),
    language: v.string(),
    timezone: v.string(),
    notifications: v.object({
      wellbeingReminders: v.boolean(),
      ecoHabits: v.boolean(),
      menstrualCycle: v.boolean(),
      dailyTips: v.boolean(),
    }),
    privacy: v.object({
      shareData: v.boolean(),
      anonymousAnalytics: v.boolean(),
    }),
    accessibility: v.object({
      voiceEnabled: v.boolean(),
      highContrast: v.boolean(),
      fontSize: v.string(),
    }),
  }).index("by_user", ["userId"]),

  nutritionLogs: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    meals: v.object({
      breakfast: v.optional(v.string()),
      lunch: v.optional(v.string()),
      dinner: v.optional(v.string()),
      snacks: v.optional(v.array(v.string())),
    }),
    waterIntake: v.optional(v.number()), // glasses of water
    notes: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  alerts: defineTable({
    type: v.string(),
    severity: v.string(),
    message: v.string(),
    location: v.optional(v.string()),
    isActive: v.boolean(),
  }),

  // schema.ts
  purchases: defineTable({
    userId: v.id("users"),
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
    timestamp: v.number(), // Unix timestamp
    date: v.string(), // ISO date string for display
    receiptImage: v.optional(v.string()), // Optional receipt image URL/path
  }).index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_date", ["timestamp"]),

};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});