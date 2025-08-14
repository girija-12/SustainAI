import { query, mutation, action } from "./_generated/server";
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
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("wellbeingCheckins", {
      userId,
      mood: args.mood,
      stress: args.stress,
      energy: args.energy,
      sleep: args.sleep,
      notes: args.notes,
      timestamp: args.timestamp || Date.now(),
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

export const getWellbeingTrends = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const days = args.days || 7;
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const checkins = await ctx.db
      .query("wellbeingCheckins")
      .withIndex("by_user_timestamp", (q) => 
        q.eq("userId", userId).gte("timestamp", cutoffTime)
      )
      .order("desc")
      .collect();

    // Calculate averages and trends
    const totalCheckins = checkins.length;
    if (totalCheckins === 0) return { averages: null, trends: [], totalCheckins: 0 };

    const averages = {
      mood: checkins.reduce((sum, c) => sum + c.mood, 0) / totalCheckins,
      stress: checkins.reduce((sum, c) => sum + c.stress, 0) / totalCheckins,
      energy: checkins.reduce((sum, c) => sum + c.energy, 0) / totalCheckins,
      sleep: checkins.reduce((sum, c) => sum + c.sleep, 0) / totalCheckins,
    };

    return { averages, trends: checkins, totalCheckins };
  },
});

export const saveEcoHabits = mutation({
  args: {
    date: v.string(),
    reusableProducts: v.boolean(),
    plantBasedMeals: v.boolean(),
    timeInNature: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if entry for this date already exists
    const existing = await ctx.db
      .query("ecoHabits")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        reusableProducts: args.reusableProducts,
        plantBasedMeals: args.plantBasedMeals,
        timeInNature: args.timeInNature,
        timestamp: Date.now(),
      });
      return existing._id;
    } else {
      // Create new entry
      return await ctx.db.insert("ecoHabits", {
        userId,
        ...args,
        timestamp: Date.now(),
      });
    }
  },
});

export const getEcoHabits = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const days = args.days || 30;
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    return await ctx.db
      .query("ecoHabits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .order("desc")
      .collect();
  },
});

export const addMenstrualLog = mutation({
  args: {
    cycleStartDate: v.string(),
    symptoms: v.string(),
    flow: v.optional(v.string()),
    mood: v.optional(v.array(v.string())),
    pain: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("menstrualLogs", {
      userId,
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getMenstrualLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("menstrualLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 12);
  },
});

export const getUserSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Return default settings if none exist
    if (!settings) {
      return {
        language: "en",
        timezone: "UTC",
        notifications: {
          wellbeingReminders: true,
          ecoHabits: true,
          menstrualCycle: true,
          dailyTips: true,
        },
        privacy: {
          shareData: false,
          anonymousAnalytics: true,
        },
        accessibility: {
          voiceEnabled: true,
          highContrast: false,
          fontSize: "medium",
        },
      };
    }

    return settings;
  },
});

export const updateUserSettings = mutation({
  args: {
    language: v.optional(v.string()),
    timezone: v.optional(v.string()),
    notifications: v.optional(v.object({
      wellbeingReminders: v.boolean(),
      ecoHabits: v.boolean(),
      menstrualCycle: v.boolean(),
      dailyTips: v.boolean(),
    })),
    privacy: v.optional(v.object({
      shareData: v.boolean(),
      anonymousAnalytics: v.boolean(),
    })),
    accessibility: v.optional(v.object({
      voiceEnabled: v.boolean(),
      highContrast: v.boolean(),
      fontSize: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const settingsData = {
      userId,
      language: args.language || "en",
      timezone: args.timezone || "UTC",
      notifications: args.notifications || {
        wellbeingReminders: true,
        ecoHabits: true,
        menstrualCycle: true,
        dailyTips: true,
      },
      privacy: args.privacy || {
        shareData: false,
        anonymousAnalytics: true,
      },
      accessibility: args.accessibility || {
        voiceEnabled: true,
        highContrast: false,
        fontSize: "medium",
      },
    };

    if (existing) {
      await ctx.db.patch(existing._id, settingsData);
      return existing._id;
    } else {
      return await ctx.db.insert("userSettings", settingsData);
    }
  },
});

export const getChatMessages = query({
  args: { 
    agentType: v.string(),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user_agent", (q) => 
        q.eq("userId", userId).eq("agentType", args.agentType)
      )
      .order("desc")
      .take(args.limit || 50);
  },
});

export const addChatMessage = mutation({
  args: {
    agentType: v.string(),
    role: v.string(),
    content: v.string(),
    metadata: v.optional(v.object({
      recommendations: v.optional(v.array(v.string())),
      actionItems: v.optional(v.array(v.string())),
      relatedData: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("chatMessages", {
      userId,
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getRecommendations = query({
  args: { 
    type: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let recommendations;
    
    if (args.type) {
      recommendations = await ctx.db
        .query("recommendations")
        .withIndex("by_user_type", (q) => 
          q.eq("userId", userId).eq("type", args.type!)
        )
        .order("desc")
        .collect();
    } else {
      recommendations = await ctx.db
        .query("recommendations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    }

    if (args.activeOnly) {
      return recommendations.filter((r) => r.isActive && !r.isCompleted);
    }

    return recommendations;
  },
});

export const generateNutritionRecommendations = mutation({
  args: {
    mood: v.number(),
    stress: v.number(),
    energy: v.number(),
    sleep: v.number(),
    menstrualPhase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate nutrition recommendations based on wellness data
    const recommendations = [];

    // Energy and mood support
    if (args.energy < 6 || args.mood < 6) {
      recommendations.push({
        userId,
        type: "nutrition",
        title: "Energy & Mood Boost",
        description: "Focus on complex carbohydrates, B-vitamins, and omega-3 fatty acids to support energy and mood.",
        priority: 4,
        category: "energy",
        isCompleted: false,
        isActive: true,
        basedOn: ["low_energy", "low_mood"],
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }

    // Stress management
    if (args.stress > 6) {
      recommendations.push({
        userId,
        type: "nutrition",
        title: "Stress-Reducing Foods",
        description: "Include magnesium-rich foods, herbal teas, and probiotics to help manage stress levels.",
        priority: 5,
        category: "stress",
        isCompleted: false,
        isActive: true,
        basedOn: ["high_stress"],
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      });
    }

    // Sleep support
    if (args.sleep < 6) {
      recommendations.push({
        userId,
        type: "nutrition",
        title: "Sleep-Supporting Nutrition",
        description: "Try foods rich in tryptophan, magnesium, and melatonin to improve sleep quality.",
        priority: 4,
        category: "sleep",
        isCompleted: false,
        isActive: true,
        basedOn: ["poor_sleep"],
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      });
    }

    // Menstrual health support
    if (args.menstrualPhase) {
      recommendations.push({
        userId,
        type: "nutrition",
        title: "Menstrual Health Support",
        description: "Focus on iron-rich foods, anti-inflammatory ingredients, and calcium for menstrual health.",
        priority: 3,
        category: "menstrual",
        isCompleted: false,
        isActive: true,
        basedOn: ["menstrual_cycle"],
        timestamp: Date.now(),
        expiresAt: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 days
      });
    }

    // Save all recommendations
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const id = await ctx.db.insert("recommendations", rec);
      savedRecommendations.push(id);
    }

    return savedRecommendations;
  },
});

export const getNutritionPlan = query({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const targetDate = args.date || new Date().toISOString().split('T')[0];

    // Get recent wellness data to inform nutrition plan
    const recentCheckin = await ctx.db
      .query("wellbeingCheckins")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!recentCheckin) {
      return {
        breakfast: "Greek yogurt with granola and fruit",
        lunch: "Grilled chicken with sweet potato and vegetables",
        dinner: "Lentil soup with whole grain bread",
        snacks: ["Mixed nuts", "Apple with almond butter"],
        hydration: "8-10 glasses of water",
        notes: "Complete your wellness check-in for personalized recommendations"
      };
    }

    // Generate personalized meal plan based on wellness data
    const mealPlan = {
      breakfast: recentCheckin.energy < 6 ? 
        "Oatmeal with berries, nuts, and honey" : 
        "Greek yogurt with granola and fruit",
      lunch: recentCheckin.stress > 6 ? 
        "Quinoa salad with leafy greens and avocado" : 
        "Grilled chicken with sweet potato and vegetables",
      dinner: recentCheckin.sleep < 6 ? 
        "Salmon with steamed broccoli and brown rice" : 
        "Lentil soup with whole grain bread",
      snacks: recentCheckin.mood < 6 ? 
        ["Dark chocolate (70% cacao)", "Walnuts"] : 
        ["Mixed nuts", "Apple with almond butter"],
      hydration: (recentCheckin.stress > 6 || recentCheckin.energy < 6) ? 
        "10-12 glasses of water" : "8-10 glasses of water",
      notes: "Meal plan based on your recent wellness check-in"
    };

    return mealPlan;
  },
});

export const saveNutritionLog = mutation({
  args: {
    date: v.string(),
    meals: v.object({
      breakfast: v.optional(v.string()),
      lunch: v.optional(v.string()),
      dinner: v.optional(v.string()),
      snacks: v.optional(v.array(v.string())),
    }),
    waterIntake: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if entry for this date already exists
    const existing = await ctx.db
      .query("nutritionLogs")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", userId).eq("date", args.date)
      )
      .first();

    const logData = {
      userId,
      date: args.date,
      meals: args.meals,
      waterIntake: args.waterIntake || 0,
      notes: args.notes,
      timestamp: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, logData);
      return existing._id;
    } else {
      return await ctx.db.insert("nutritionLogs", logData);
    }
  },
});

export const getNutritionLogs = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const days = args.days || 7;
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    return await ctx.db
      .query("nutritionLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .order("desc")
      .collect();
  },
});

export const saveVoiceCheckin = mutation({
  args: {
    transcription: v.string(),
    audioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Basic sentiment analysis (in a real app, you'd use a proper NLP service)
    const sentiment = analyzeSentiment(args.transcription);

    return await ctx.db.insert("voiceCheckins", {
      userId,
      ...args,
      sentiment,
      timestamp: Date.now(),
    });
  },
});



export const saveChatMessage = mutation({
  args: {
    agentType: v.string(),
    role: v.string(),
    content: v.string(),
    metadata: v.optional(v.object({
      recommendations: v.optional(v.array(v.string())),
      actionItems: v.optional(v.array(v.string())),
      relatedData: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("chatMessages", {
      userId,
      agentType: args.agentType,
      role: args.role,
      content: args.content,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});



// ============================================================================
// INTERNAL HELPER FUNCTIONS FOR ACTIONS
// ============================================================================

async function getWellbeingTrendsInternal(ctx: any, args: { days?: number }) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return [];

  const days = args.days || 7;
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

  const checkins = await ctx.db
    .query("wellbeingCheckins")
    .withIndex("by_user_timestamp", (q: any) => 
      q.eq("userId", userId).gte("timestamp", cutoffTime)
    )
    .order("desc")
    .collect();

  // Calculate averages and trends
  const totalCheckins = checkins.length;
  if (totalCheckins === 0) return { averages: null, trends: [], totalCheckins: 0 };

  const averages = {
    mood: checkins.reduce((sum: number, c: any) => sum + c.mood, 0) / totalCheckins,
    stress: checkins.reduce((sum: number, c: any) => sum + c.stress, 0) / totalCheckins,
    energy: checkins.reduce((sum: number, c: any) => sum + c.energy, 0) / totalCheckins,
    sleep: checkins.reduce((sum: number, c: any) => sum + c.sleep, 0) / totalCheckins,
  };

  return { averages, trends: checkins, totalCheckins };
}

async function getUserSettingsInternal(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const settings = await ctx.db
    .query("userSettings")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  // Return default settings if none exist
  if (!settings) {
    return {
      language: "en",
      timezone: "UTC",
      notifications: {
        wellbeingReminders: true,
        ecoHabits: true,
        menstrualCycle: true,
        dailyTips: true,
      },
      privacy: {
        shareData: false,
        anonymousAnalytics: true,
      },
      accessibility: {
        voiceEnabled: true,
        highContrast: false,
        fontSize: "medium",
      },
    };
  }

  return settings;
}

async function getRecommendationsInternal(ctx: any, args: { type?: string; activeOnly?: boolean }) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return [];

  let recommendations;
  
  if (args.type) {
    recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_user_type", (q: any) => 
        q.eq("userId", userId).eq("type", args.type!)
      )
      .order("desc")
      .collect();
  } else {
    recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();
  }

  if (args.activeOnly) {
    return recommendations.filter((r: any) => r.isActive && !r.isCompleted);
  }

  return recommendations;
}

async function saveChatMessageInternal(ctx: any, args: {
  agentType: string;
  role: string;
  content: string;
  metadata?: any;
}) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  await ctx.db.insert("chatMessages", {
    userId,
    agentType: args.agentType,
    role: args.role,
    content: args.content,
    metadata: args.metadata,
    timestamp: Date.now(),
  });
}

export const generateAIResponse = action({
  args: {
    message: v.string(),
    agentType: v.string(),
  },
  handler: async (ctx: any, args: { message: string; agentType: string }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user context directly from database
    const recentCheckins = await getWellbeingTrendsInternal(ctx, { days: 5 });
    const userSettings = await getUserSettingsInternal(ctx);
    const recommendations = await getRecommendationsInternal(ctx, { activeOnly: true });

    // Generate contextual response based on user data
    const response = await generateContextualResponse(
      args.message,
      args.agentType,
      { recentCheckins, userSettings, recommendations }
    );

    // Save user message
    await saveChatMessageInternal(ctx, {
      agentType: args.agentType,
      role: "user",
      content: args.message,
    });

    // Save AI response
    await saveChatMessageInternal(ctx, {
      agentType: args.agentType,
      role: "assistant",
      content: response.content,
      metadata: response.metadata,
    });

    return response;
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateNutritionAdvice(wellbeingData: any, userSettings: any) {
  const recommendations = [];
  
  if (!wellbeingData || !wellbeingData.trends || wellbeingData.trends.length === 0) {
    // Default recommendations if no data
    return [
      {
        title: "Stay Hydrated",
        description: "Drink at least 8 glasses of water daily to maintain optimal health and energy levels.",
        priority: 3,
        category: "hydration",
        basedOn: ["general_health"]
      },
      {
        title: "Balanced Nutrition",
        description: "Include a variety of fruits, vegetables, whole grains, and lean proteins in your diet.",
        priority: 3,
        category: "general",
        basedOn: ["general_health"]
      }
    ];
  }

  const trends = wellbeingData.trends;
  const averages = wellbeingData.averages || {};
  
  // Analyze mood patterns
  if (averages.mood && averages.mood < 6) {
    recommendations.push({
      title: "Mood-Boosting Foods",
      description: "Include omega-3 rich foods like salmon, walnuts, and chia seeds. Dark chocolate and berries can also help improve mood naturally.",
      priority: 4,
      category: "mood",
      basedOn: ["low_mood", "wellbeing_data"]
    });
    
    recommendations.push({
      title: "Vitamin D Support",
      description: "Consider vitamin D-rich foods like fortified milk, egg yolks, and fatty fish, especially if you're feeling down.",
      priority: 3,
      category: "mood",
      basedOn: ["low_mood", "wellbeing_data"]
    });
  }

  // Analyze stress levels
  if (averages.stress && averages.stress > 6) {
    recommendations.push({
      title: "Stress-Reducing Foods",
      description: "Include magnesium-rich foods like leafy greens, nuts, and seeds. Avoid excessive caffeine and try herbal teas like chamomile.",
      priority: 4,
      category: "stress",
      basedOn: ["high_stress", "wellbeing_data"]
    });
    
    recommendations.push({
      title: "Limit Stimulants",
      description: "Reduce caffeine intake after 2 PM and avoid energy drinks. Consider green tea as a gentler alternative.",
      priority: 3,
      category: "stress",
      basedOn: ["high_stress", "wellbeing_data"]
    });
  }

  // Analyze energy levels
  if (averages.energy && averages.energy < 6) {
    recommendations.push({
      title: "Energy-Boosting Foods",
      description: "Include complex carbohydrates like quinoa, sweet potatoes, and oats. Add iron-rich foods like spinach and lean meats.",
      priority: 4,
      category: "energy",
      basedOn: ["low_energy", "wellbeing_data"]
    });
    
    recommendations.push({
      title: "Stable Blood Sugar",
      description: "Eat regular meals with protein and fiber to maintain steady energy. Avoid sugary snacks that cause energy crashes.",
      priority: 3,
      category: "energy",
      basedOn: ["low_energy", "wellbeing_data"]
    });
  }

  // Analyze sleep quality
  if (averages.sleep && averages.sleep < 6) {
    recommendations.push({
      title: "Sleep-Supporting Foods",
      description: "Include tryptophan-rich foods like turkey, milk, and bananas. Avoid large meals and alcohol before bedtime.",
      priority: 4,
      category: "sleep",
      basedOn: ["poor_sleep", "wellbeing_data"]
    });
    
    recommendations.push({
      title: "Evening Nutrition",
      description: "Have a light snack with complex carbs and protein 2-3 hours before bed. Try a small portion of oatmeal with nuts.",
      priority: 3,
      category: "sleep",
      basedOn: ["poor_sleep", "wellbeing_data"]
    });
  }

  // General wellness recommendations
  if (averages.mood >= 7 && averages.energy >= 7 && averages.stress <= 4) {
    recommendations.push({
      title: "Maintain Your Success",
      description: "You're doing great! Continue your current nutrition habits and consider adding antioxidant-rich foods like berries and green tea.",
      priority: 2,
      category: "maintenance",
      basedOn: ["good_wellbeing", "wellbeing_data"]
    });
  }

  // Add hydration reminder based on energy and mood
  if ((averages.energy && averages.energy < 7) || (averages.mood && averages.mood < 7)) {
    recommendations.push({
      title: "Optimize Hydration",
      description: "Dehydration can affect mood and energy. Aim for 8-10 glasses of water daily, more if you're active.",
      priority: 3,
      category: "hydration",
      basedOn: ["energy_mood_correlation", "wellbeing_data"]
    });
  }

  // Sort by priority (higher priority first) and limit to top 5
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);
}

function analyzeSentiment(text: string) {
  // Simple sentiment analysis - in production, use a proper NLP service
  const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited'];
  const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious', 'worried'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  const totalSentimentWords = positiveCount + negativeCount;
  const score = totalSentimentWords === 0 ? 0 : (positiveCount - negativeCount) / totalSentimentWords;
  
  return {
    score,
    magnitude: totalSentimentWords / words.length,
    emotions: [
      { emotion: 'positive', confidence: positiveCount / Math.max(totalSentimentWords, 1) },
      { emotion: 'negative', confidence: negativeCount / Math.max(totalSentimentWords, 1) },
    ],
  };
}

async function generateContextualResponse(message: string, agentType: string, context: any) {
  // This is a simplified AI response generator
  // In production, you'd integrate with OpenAI, Claude, or similar
  
  const { recentCheckins, userSettings, recommendations } = context;
  
  // Analyze recent wellbeing trends
  let trendAnalysis = "";
  if (recentCheckins && 'trends' in recentCheckins && Array.isArray(recentCheckins.trends) && recentCheckins.trends.length > 0) {
    const trends = recentCheckins.trends;
    const avgMood = trends.reduce((sum: number, c: any) => sum + c.mood, 0) / trends.length;
    const avgStress = trends.reduce((sum: number, c: any) => sum + c.stress, 0) / trends.length;
    
    if (avgMood < 5) {
      trendAnalysis += "I notice your mood has been lower recently. ";
    }
    if (avgStress > 6) {
      trendAnalysis += "Your stress levels seem elevated. ";
    }
  }
  
  // Generate response based on message content and context
  let response = "";
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxious')) {
    response = `${trendAnalysis}I understand you're feeling stressed. Based on your recent check-ins, I recommend trying some deep breathing exercises. Would you like me to guide you through a quick 5-minute relaxation technique?`;
  } else if (lowerMessage.includes('sleep') || lowerMessage.includes('tired')) {
    response = `${trendAnalysis}Sleep is crucial for wellbeing. I see you've been tracking your sleep quality. Consider creating a consistent bedtime routine and avoiding caffeine after 2 PM.`;
  } else if (lowerMessage.includes('mood') || lowerMessage.includes('sad') || lowerMessage.includes('down')) {
    response = `${trendAnalysis}Thank you for sharing how you're feeling. It's important to acknowledge these emotions. Have you tried any of the mood-boosting activities I've recommended, like spending time in nature or connecting with friends?`;
  } else {
    response = `${trendAnalysis}Thank you for sharing that with me. Based on your recent wellbeing data, I'm here to support you. Is there a specific area of your wellness you'd like to focus on today?`;
  }
  
  // Add personalized recommendations
  const activeRecs = Array.isArray(recommendations) ? recommendations : [];
  if (activeRecs.length > 0) {
    response += ` You have ${activeRecs.length} active wellness recommendations. Would you like me to review them with you?`;
  }
  
  return {
    content: response,
    metadata: {
      recommendations: activeRecs.slice(0, 3).map((r: any) => r.title),
      actionItems: ["Check your daily wellness score", "Review active recommendations"],
      relatedData: { trendAnalysis, activeRecommendations: activeRecs.length },
    },
  };
}

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