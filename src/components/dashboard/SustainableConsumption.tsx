import { ChangeEvent, useEffect, useState, useMemo } from "react";
import ChatWidget from "../shared/ChatWidget";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api"; // adjust path as per your setup

type Category = | "Groceries" | "Apparel" | "Electronics" | "Furniture" | "Beauty" | "Toys" | "Books";

type Purchase = {
  id: number | string;
  product: string;
  category: Category;
  quantity: number;
  price: number;
  footprint: {
    co2: number;     // kg CO2
    plastic: number; // grams
    water: number;   // liters
  };
  timestamp?: number; // Unix timestamp
};

const footprintData: Record<Category, { co2: number; plastic: number; water: number }> = {
  Groceries: { co2: 2, plastic: 50, water: 100 },
  Apparel: { co2: 10, plastic: 200, water: 500 },
  Electronics: { co2: 50, plastic: 300, water: 800 },
  Furniture: { co2: 40, plastic: 150, water: 600 },
  Beauty: { co2: 5, plastic: 100, water: 200 },
  Toys: { co2: 15, plastic: 250, water: 300 },
  Books: { co2: 3, plastic: 20, water: 50 },
};

// Product categorization keywords
const categoryKeywords: Record<Category, string[]> = {
  Groceries: [
    // Food items
    'bread', 'milk', 'cheese', 'butter', 'yogurt', 'eggs', 'meat', 'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna',
    'rice', 'pasta', 'noodles', 'cereal', 'oats', 'flour', 'sugar', 'salt', 'pepper', 'spices', 'herbs',
    'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'mango', 'pineapple', 'watermelon', 'lemon',
    'tomato', 'potato', 'onion', 'garlic', 'carrot', 'broccoli', 'spinach', 'lettuce', 'cucumber', 'bell pepper',
    'coffee', 'tea', 'juice', 'soda', 'water', 'beer', 'wine', 'alcohol', 'beverage', 'drink',
    'chocolate', 'candy', 'cookies', 'cake', 'ice cream', 'snacks', 'chips', 'crackers',
    // Additional food keywords
    'organic', 'fresh', 'frozen', 'canned', 'packaged', 'dairy', 'produce', 'bakery', 'deli',
    'sandwich', 'pizza', 'burger', 'salad', 'soup', 'sauce', 'oil', 'vinegar', 'nuts', 'seeds',
    // Receipt-specific items
    'mint', 'elec', 'crcncry', 'assorted', 'fajitas', 'surf', 'grocery', 'food'
  ],
  Apparel: [
    'shirt', 'pants', 'jeans', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'hoodie', 'blouse',
    'shoes', 'boots', 'sneakers', 'sandals', 'heels', 'flats', 'socks', 'underwear', 'bra',
    'hat', 'cap', 'scarf', 'gloves', 'belt', 'tie', 'suit', 'blazer', 'shorts', 'swimwear',
    'clothing', 'apparel', 'fashion', 'wear', 'outfit', 't-shirt', 'polo',
    // Additional apparel keywords
    'cotton', 'denim', 'leather', 'wool', 'silk', 'polyester', 'organic cotton', 'sustainable fashion',
    'vintage', 'designer', 'brand', 'size', 'xl', 'large', 'medium', 'small', 'casual', 'formal'
  ],
  Electronics: [
    'phone', 'smartphone', 'iphone', 'android', 'tablet', 'ipad', 'laptop', 'computer', 'desktop', 'monitor',
    'tv', 'television', 'speaker', 'headphones', 'earbuds', 'camera', 'gaming', 'console', 'xbox', 'playstation',
    'charger', 'cable', 'battery', 'power bank', 'router', 'modem', 'keyboard', 'mouse', 'printer',
    'smartwatch', 'fitness tracker', 'drone', 'electronic', 'tech', 'gadget', 'device', 'airpods',
    // Additional electronics keywords
    'wireless', 'bluetooth', 'wifi', 'usb', 'hdmi', 'led', 'oled', '4k', '5g', 'smart', 'digital',
    'apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'lenovo', 'asus', 'nintendo', 'microsoft'
  ],
  Furniture: [
    'chair', 'table', 'desk', 'bed', 'mattress', 'sofa', 'couch', 'cabinet', 'dresser', 'wardrobe',
    'shelf', 'bookshelf', 'lamp', 'mirror', 'curtain', 'blinds', 'rug', 'carpet', 'pillow', 'cushion',
    'furniture', 'home decor', 'decoration', 'interior', 'furnishing', 'ottoman', 'nightstand'
  ],
  Beauty: [
    'shampoo', 'conditioner', 'soap', 'lotion', 'cream', 'moisturizer', 'cleanser', 'toner', 'serum',
    'makeup', 'foundation', 'concealer', 'lipstick', 'mascara', 'eyeshadow', 'blush', 'powder',
    'perfume', 'cologne', 'deodorant', 'toothpaste', 'toothbrush', 'razor', 'shaving cream',
    'nail polish', 'nail care', 'skincare', 'haircare', 'cosmetics', 'beauty', 'personal care'
  ],
  Toys: [
    'toy', 'doll', 'action figure', 'lego', 'puzzle', 'board game', 'card game', 'ball', 'bike', 'scooter',
    'stuffed animal', 'teddy bear', 'robot', 'car toy', 'train', 'airplane toy', 'building blocks',
    'educational toy', 'baby toy', 'kids', 'children', 'play', 'game', 'barbie', 'pokemon'
  ],
  Books: [
    'book', 'novel', 'textbook', 'magazine', 'newspaper', 'journal', 'diary', 'notebook', 'pen', 'pencil',
    'marker', 'highlighter', 'eraser', 'ruler', 'calculator', 'stationery', 'office supplies',
    'reading', 'literature', 'education', 'study', 'writing', 'comic', 'manga'
  ]
};

// Function to detect category based on product name
const detectCategory = (productName: string): Category => {
  const lowerProduct = productName.toLowerCase().trim();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerProduct.includes(keyword.toLowerCase())) {
        return category as Category;
      }
    }
  }
  
  // Default to Groceries if no match found
  return "Groceries";
};

export default function SustainableConsumption() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState<Category>("Groceries");
  const [isManualCategoryOverride, setIsManualCategoryOverride] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [inputMethod, setInputMethod] = useState<"manual" | "receipt">("manual");
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");
  const [filterDateRange, setFilterDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Allow letters, numbers, spaces, dashes and common symbols so users can type things like "iPhone 15 Pro - 256GB"
  const productNameRegex = /^[A-Za-z0-9\s\-+&()'.,\/]*$/;
  // Calculate total footprints
  const totalFootprint = purchases.reduce(
    (acc, p) => {
      acc.co2 += p.footprint.co2;
      acc.plastic += p.footprint.plastic;
      acc.water += p.footprint.water;
      return acc;
    },
    { co2: 0, plastic: 0, water: 0 }
  );

  // Calculate date range for filtering
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterDateRange) {
      case "today":
        return {
          startDate: today.getTime(),
          endDate: now.getTime(),
        };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          startDate: weekAgo.getTime(),
          endDate: now.getTime(),
        };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
          startDate: monthAgo.getTime(),
          endDate: now.getTime(),
        };
      default:
        return {};
    }
  };

  const dateRange = useMemo(() => getDateRange(), [filterDateRange]);
  // Build query args without undefined keys to avoid validator issues when switching filters
  const queryArgs = useMemo(() => {
    const args: { category?: Category; startDate?: number; endDate?: number } = {};
    if (filterCategory !== "All") {
      args.category = filterCategory as Category;
    }
    if (filterDateRange !== "all") {
      const { startDate, endDate } = dateRange as { startDate?: number; endDate?: number };
      if (typeof startDate === "number" && typeof endDate === "number") {
        args.startDate = startDate;
        args.endDate = endDate;
      }
    }
    return args;
  }, [filterCategory, filterDateRange, dateRange]);

  const backendPurchases = useQuery(api.sustainai.listPurchases, queryArgs);
  const addPurchaseMutation = useMutation(api.sustainai.addPurchase);
  const deletePurchaseMutation = useMutation(api.sustainai.deletePurchase);
  const deleteAllPurchasesMutation = useMutation(api.sustainai.deleteAllPurchases);

  // Sync backend purchases to local state on load
  useEffect(() => {
    if (backendPurchases) {
      // Map backend purchases to your frontend Purchase type
      let mappedPurchases = backendPurchases.map((p: any) => ({
        id: p._id || p.timestamp, // Use backend ID or timestamp
        product: p.productName,
        category: p.category as Category,
        quantity: p.quantity || 1,
        price: p.price,
        footprint: p.footprint || {
          co2: footprintData[p.category as Category]?.co2 || 0,
          plastic: footprintData[p.category as Category]?.plastic || 0,
          water: footprintData[p.category as Category]?.water || 0,
        },
        timestamp: p.timestamp,
      }));

      // Apply client-side search filter
      if (searchTerm) {
        mappedPurchases = mappedPurchases.filter((p: Purchase) =>
          p.product.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setPurchases(mappedPurchases);
    }
  }, [backendPurchases, searchTerm]);

  // Simple sustainability score based on footprint (lower footprint = higher score)
  const sustainabilityScore = Math.max(
    0,
    Math.min(100, 100 - totalFootprint.co2 * 3)
  );

  // Types for recommendations
  type AlternativeSuggestion = {
    key: string;
    title: string;
    details: string;
    estimatedReduction: number; // 0..1 (percentage reduction)
    tag: string;
    basedOnProduct: string;
    category: Category;
  };

  // Generate alternatives for a single purchase based on simple heuristics
  const generateAlternativesForPurchase = (p: Purchase): AlternativeSuggestion[] => {
    const name = p.product.toLowerCase();
    const recs: AlternativeSuggestion[] = [];

    switch (p.category) {
      case "Groceries": {
        if (/(beef|mutton|pork|lamb|steak|meatball|bacon)/.test(name)) {
          recs.push({
            key: "plant-protein-red-meat",
            title: "Plant-based proteins (tofu, beans, lentils)",
            details: "Red meat has a high carbon footprint. Swap with legumes or tofu in similar recipes.",
            estimatedReduction: 0.6,
            tag: "Food choice",
            basedOnProduct: p.product,
            category: p.category,
          });
        }
        if (/(chicken|fish|salmon|tuna)/.test(name)) {
          recs.push({
            key: "plant-protein-poultry-fish",
            title: "More plant-based meals or certified sustainable fish",
            details: "Shift a few meals per week to plant-based options or choose MSC-certified fish.",
            estimatedReduction: 0.4,
            tag: "Food choice",
            basedOnProduct: p.product,
            category: p.category,
          });
        }
        if (/(milk|cheese|butter|yogurt|dairy)/.test(name)) {
          recs.push({
            key: "plant-dairy",
            title: "Switch to plant-based dairy (oat/soy)",
            details: "Plant-based milks and yogurts generally have lower emissions and water use.",
            estimatedReduction: 0.4,
            tag: "Dairy swap",
            basedOnProduct: p.product,
            category: p.category,
          });
        }
        if (/(bottled water|bottle water|soda|soft drink)/.test(name) || /water/.test(name)) {
          recs.push({
            key: "reusable-bottle",
            title: "Use a reusable bottle + filtered tap water",
            details: "Avoid single-use bottles and reduce plastic waste substantially.",
            estimatedReduction: 0.9,
            tag: "Packaging",
            basedOnProduct: p.product,
            category: p.category,
          });
        }
        // Generic grocery advice
        recs.push({
          key: "local-seasonal-organic",
          title: "Favor local, seasonal, organic options",
          details: "These choices can lower transport emissions and support better farming practices.",
          estimatedReduction: 0.15,
          tag: "Groceries",
          basedOnProduct: p.product,
          category: p.category,
        });
        break;
      }
      case "Apparel": {
        if (/(polyester|nylon|acrylic)/.test(name)) {
          recs.push({
            key: "natural-fibers",
            title: "Choose natural fibers (organic cotton, hemp, linen)",
            details: "Natural, certified fibers often have lower microplastic shedding and better lifecycle impacts.",
            estimatedReduction: 0.3,
            tag: "Materials",
            basedOnProduct: p.product,
            category: p.category,
          });
        }
        if (/leather/.test(name)) {
          recs.push({
            key: "leather-alt",
            title: "Consider plant-based or recycled leather alternatives",
            details: "Alternatives and second-hand leather can reduce emissions and water use.",
            estimatedReduction: 0.4,
            tag: "Materials",
            basedOnProduct: p.product,
            category: p.category,
          });
        }
        recs.push({
          key: "buy-less-better",
          title: "Buy less, choose quality or second-hand",
          details: "Extending garment life by 9 months can reduce its footprint 20–30%.",
          estimatedReduction: 0.25,
          tag: "Behavior",
          basedOnProduct: p.product,
          category: p.category,
        });
        break;
      }
      case "Electronics": {
        if (/(tv|monitor|laptop|computer|desktop)/.test(name)) {
          recs.push({
            key: "energy-star",
            title: "Energy Star or highly efficient devices",
            details: "Efficient models reduce electricity demand over the device lifetime.",
            estimatedReduction: 0.2,
            tag: "Efficiency",
            basedOnProduct: p.product,
            category: p.category,
          });
        }
        recs.push({
          key: "repair-refurbish",
          title: "Repair or buy refurbished where possible",
          details: "Keeps devices in use longer and avoids new manufacturing impacts.",
          estimatedReduction: 0.3,
          tag: "Circular",
          basedOnProduct: p.product,
          category: p.category,
        });
        break;
      }
      case "Furniture": {
        recs.push({
          key: "fsc-reclaimed",
          title: "FSC-certified wood or reclaimed materials",
          details: "Supports sustainable forestry and reduces demand for virgin materials.",
          estimatedReduction: 0.25,
          tag: "Materials",
          basedOnProduct: p.product,
          category: p.category,
        });
        recs.push({
          key: "second-hand-furniture",
          title: "Prefer second-hand or refurbished pieces",
          details: "Lowers manufacturing impacts and extends product life.",
          estimatedReduction: 0.5,
          tag: "Circular",
          basedOnProduct: p.product,
          category: p.category,
        });
        break;
      }
      case "Beauty": {
        recs.push({
          key: "refillable-solid",
          title: "Refillable packaging or solid bars",
          details: "Reduces plastic packaging and shipping weight.",
          estimatedReduction: 0.4,
          tag: "Packaging",
          basedOnProduct: p.product,
          category: p.category,
        });
        break;
      }
      case "Toys": {
        recs.push({
          key: "wooden-battery-free",
          title: "Wooden, battery-free, or second-hand toys",
          details: "Cuts plastic use and extends toy lifespan.",
          estimatedReduction: 0.35,
          tag: "Materials",
          basedOnProduct: p.product,
          category: p.category,
        });
        break;
      }
      case "Books": {
        recs.push({
          key: "ebooks-library",
          title: "E-books or library borrowing",
          details: "Avoids new paper production and shipping for each title.",
          estimatedReduction: 0.6,
          tag: "Access",
          basedOnProduct: p.product,
          category: p.category,
        });
        break;
      }
    }

    return recs;
  };

  // Build personalized recommendations from purchases (behavioral/strategy tips)
  const recommendations = useMemo(() => {
    type Scored = AlternativeSuggestion & { score: number };
    const map = new Map<string, Scored>();

    for (const p of purchases) {
      const recs = generateAlternativesForPurchase(p);
      for (const r of recs) {
        const score = (p.footprint?.co2 || 0) * r.estimatedReduction;
        const existing = map.get(r.key);
        if (!existing || score > existing.score) {
          map.set(r.key, { ...r, basedOnProduct: p.product, score });
        }
      }
    }

    const list = Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ score, ...rest }) => rest);

    return list;
  }, [purchases]);

  // Sustainable alternative products: suggest concrete items by category, weighted by spend
  type ProductAlt = {
    id: string;
    name: string;
    description: string;
    badge: string;
    estImpactLabel: string; // e.g., "Lower CO₂"
    category: Category;
  };

  // Static catalog of sustainable-leaning products (can later be fetched from backend/API)
  const sustainableCatalog: Record<Category, ProductAlt[]> = {
    Groceries: [
      { id: "gro-1", name: "Organic seasonal veg box", description: "Local, seasonal produce reduces transport emissions.", badge: "Local/Seasonal", estImpactLabel: "Lower CO₂", category: "Groceries" },
      { id: "gro-2", name: "Tofu (organic soy)", description: "High-protein plant alternative to meat.", badge: "Plant-based", estImpactLabel: "-60% vs red meat", category: "Groceries" },
      { id: "gro-3", name: "Oat milk", description: "Lower water and CO₂ footprint than dairy.", badge: "Plant-based", estImpactLabel: "Lower water & CO₂", category: "Groceries" },
    ],
    Apparel: [
      { id: "app-1", name: "Organic cotton T-shirt", description: "Certified organic cotton, responsibly made.", badge: "Organic", estImpactLabel: "Fewer pesticides", category: "Apparel" },
      { id: "app-2", name: "Hemp shirt", description: "Durable natural fiber with lower inputs.", badge: "Natural fiber", estImpactLabel: "Lower impact", category: "Apparel" },
      { id: "app-3", name: "Second-hand denim", description: "Circular choice that extends product life.", badge: "Second-hand", estImpactLabel: "Avoids new production", category: "Apparel" },
    ],
    Electronics: [
      { id: "ele-1", name: "Refurbished laptop (certified)", description: "Quality-checked device with warranty.", badge: "Refurbished", estImpactLabel: "Avoids new manufacturing", category: "Electronics" },
      { id: "ele-2", name: "Energy Star monitor", description: "Efficient display reduces electricity use.", badge: "Energy efficient", estImpactLabel: "Lower energy", category: "Electronics" },
    ],
    Furniture: [
      { id: "fur-1", name: "FSC-certified wooden table", description: "Sustainably sourced wood.", badge: "FSC", estImpactLabel: "Responsible forestry", category: "Furniture" },
      { id: "fur-2", name: "Reclaimed wood shelf", description: "Upcycled materials, unique look.", badge: "Reclaimed", estImpactLabel: "Lower material footprint", category: "Furniture" },
    ],
    Beauty: [
      { id: "bea-1", name: "Refillable shampoo", description: "Keep the bottle, refill the contents.", badge: "Refillable", estImpactLabel: "Less plastic", category: "Beauty" },
      { id: "bea-2", name: "Solid soap bar", description: "Package-free cleansing.", badge: "Low-waste", estImpactLabel: "Less plastic", category: "Beauty" },
    ],
    Toys: [
      { id: "toy-1", name: "Wooden blocks", description: "Durable, plastic-free play.", badge: "Plastic-free", estImpactLabel: "Lower plastic", category: "Toys" },
      { id: "toy-2", name: "Second-hand board game", description: "Give games a second life.", badge: "Second-hand", estImpactLabel: "Circular choice", category: "Toys" },
    ],
    Books: [
      { id: "boo-1", name: "E-book of latest read", description: "Digital format avoids paper per copy.", badge: "Digital", estImpactLabel: "Lower materials", category: "Books" },
      { id: "boo-2", name: "Library borrow", description: "Shared copies reduce new printing demand.", badge: "Shared", estImpactLabel: "Avoids new printing", category: "Books" },
    ],
  };
  // Compute spend per category to prioritize product alternatives
  const categorySpend = useMemo(() => {
    const totals = new Map<Category, number>();
    for (const p of purchases) {
      totals.set(p.category, (totals.get(p.category) || 0) + p.price * p.quantity);
    }
    return totals;
  }, [purchases]);

  // --- OpenAI-driven personalized product alternatives ---
  const OPENAI_KEY = import.meta.env.VITE_SUSTAINABILITY_OPENAI_API_KEY as string | undefined;
  const [aiProductAlternatives, setAiProductAlternatives] = useState<ProductAlt[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Build a compact purchase summary for the prompt
  const purchaseSummary = useMemo(() => {
    return purchases.map((p) => ({
      product: p.product,
      category: p.category,
      quantity: p.quantity,
      price: p.price,
      co2: p.footprint.co2,
    }));
  }, [purchases]);

  // Fetch recommendations from OpenAI (chat completions), expect a strict JSON array
  const fetchAIRecommendations = async () => {
    if (!OPENAI_KEY) {
      setAiError('OpenAI API key not found in environment (VITE_SUSTAINABILITY_OPENAI_API_KEY)');
      setAiProductAlternatives(null);
      return;
    }

    if (!purchases || purchases.length === 0) {
      setAiProductAlternatives(null);
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      // Build prompt: include top spent categories and recent purchases
      const topCategories = Array.from(categorySpend.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat)
        .slice(0, 3);

      const system = `You are GreenAdvisor, an assistant that suggests 3-6 concrete sustainable product alternatives tailored to a user's recent purchases. Return ONLY a JSON array of objects (no surrounding text). Each object must have these keys: id (short unique string), name, description, badge, estImpactLabel (short human-readable impact), category (one of Groceries|Apparel|Electronics|Furniture|Beauty|Toys|Books).`; 

      const user = `Top categories by spend: ${topCategories.join(', ') || 'none'}.\nRecent purchases: ${JSON.stringify(purchaseSummary)}.\nReturn 4-8 alternative products prioritized by the user's top categories. Be concise and ensure valid JSON output.`;

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`OpenAI request failed: ${resp.status} ${errText}`);
      }

      const json = await resp.json();
      const content = json?.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in OpenAI response');

      // Try to locate JSON inside the response content
      let parsed: ProductAlt[] | null = null;
      try {
        // Sometimes the model wraps JSON in markdown or backticks; strip them
        const cleaned = content.trim().replace(/^```json\n?|\n?```$/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        // Attempt a more lenient extraction of the first JSON array in the text
        const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw e;
        }
      }

      // Basic validation and normalization
      if (!Array.isArray(parsed)) throw new Error('OpenAI returned unexpected JSON format');

      const normalized: ProductAlt[] = parsed.map((it: any, idx: number) => ({
        id: it.id || `ai-${Date.now()}-${idx}`,
        name: it.name || it.title || 'Unnamed product',
        description: it.description || it.details || '',
        badge: it.badge || it.tag || '',
        estImpactLabel: it.estImpactLabel || it.impact || '',
        category: (it.category || 'Groceries') as Category,
      }));

      setAiProductAlternatives(normalized);
    } catch (err: any) {
      console.error('AI recommendation error', err);
      setAiError(err?.message || String(err));
      setAiProductAlternatives(null);
    } finally {
      setAiLoading(false);
    }
  };

  // Trigger AI recommendations when purchases change (debounced-ish)
  useEffect(() => {
    // Debounce short bursts of updates
    const t = setTimeout(() => {
      fetchAIRecommendations();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases]);

  // Pick top categories by spend, then recommend 2-3 products per top category
  // Use AI results when available, otherwise fall back to static catalog
  const productAlternatives = useMemo(() => {
    if (aiProductAlternatives && aiProductAlternatives.length > 0) return aiProductAlternatives;

    const ranked = Array.from(categorySpend.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 3);

    const items: ProductAlt[] = [];
    for (const cat of ranked) {
      const pool = sustainableCatalog[cat] || [];
      // take top 2 per category to keep list concise
      items.push(...pool.slice(0, 2));
    }
    return items;
  }, [categorySpend, aiProductAlternatives]);

  const addPurchase = async () => {
    if (!product || quantity <= 0 || price <= 0) return alert("Please fill all fields");

    // Auto-detect category based on product name, but allow manual override
    const detectedCategory = detectCategory(product);
    const finalCategory = category === "Groceries" ? detectedCategory : category; // Use detected if default, otherwise use manual selection
    const footprintPerUnit = footprintData[finalCategory];
    const newPurchase: Purchase = {
      id: Date.now(), // Use timestamp to ensure unique IDs
      product,
      category: finalCategory,
      quantity,
      price,
      footprint: {
        co2: footprintPerUnit.co2 * quantity,
        plastic: footprintPerUnit.plastic * quantity,
        water: footprintPerUnit.water * quantity,
      },
    };

    try {
      // Call backend mutation
      await addPurchaseMutation({
        productName: product,
        category: finalCategory,
        quantity,
        price,
        impactScore: footprintPerUnit.co2 * quantity,
        footprint: {
          co2: footprintPerUnit.co2 * quantity,
          plastic: footprintPerUnit.plastic * quantity,
          water: footprintPerUnit.water * quantity,
        },
        date: new Date().toISOString(),
        receiptImage: undefined, // No receipt image for manual entry
      });

      // Don't update local state - let the backend sync handle it
      // The useEffect will automatically update the state when backendPurchases changes

      // Reset form
      setProduct("");
      setQuantity(1);
      setPrice(0);
      setCategory("Groceries");
      setIsManualCategoryOverride(false);
    } catch (err) {
      alert("Failed to add purchase: " + (err as Error).message);
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;

    try {
      await deletePurchaseMutation({ purchaseId: purchaseId as any });
      // The useEffect will automatically update the state when backendPurchases changes
    } catch (err) {
      alert("Failed to delete purchase: " + (err as Error).message);
    }
  };

  const deleteAllPurchases = async () => {
    const purchaseCount = purchases.length;
    if (!confirm(`Are you sure you want to delete all ${purchaseCount} purchases? This action cannot be undone.`)) return;

    try {
      await deleteAllPurchasesMutation({});
      // The useEffect will automatically update the state when backendPurchases changes
    } catch (err) {
      alert("Failed to delete all purchases: " + (err as Error).message);
    }
  };

  const handleReceiptUpload = async (file: File | null) => {
    if (!file) return;

    setIsProcessingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");

      const apiKey = import.meta.env.VITE_OCR_SPACE_API_KEY;

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: apiKey as string,
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.ParsedResults || !data.ParsedResults[0]) {
        throw new Error("No text found in receipt.");
      }
      const text = data.ParsedResults[0].ParsedText;
      console.log("OCR Parsed Text:", text);

      // Split lines, trim, remove empty lines
      const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
      console.log("All Lines:", lines);

      const purchasesExtracted: Purchase[] = [];

      // Universal Receipt Parser - works with any receipt structure
      console.log("Starting universal receipt parsing...");
      
      // Step 1: Find the product section boundaries
      const itemSectionStart = lines.findIndex((line: string) => 
        line.toLowerCase().includes('item') || 
        line.toLowerCase().includes('product') ||
        line.toLowerCase().includes('description') ||
        line.toLowerCase().includes('name') // Add "name" as a product section indicator
      );
      
      const totalSectionStart = lines.findIndex((line: string, idx: number) => 
        idx > itemSectionStart && (
          line.toLowerCase().includes('total quantity') ||
          line.toLowerCase().includes('gross total') ||
          line.toLowerCase().includes('subtotal') ||
          line.toLowerCase().includes('sub total')
        )
      );

      console.log(`Item section starts at line ${itemSectionStart}, total section at ${totalSectionStart}`);

      // Step 2: Extract only lines from the product section
      let productSectionLines: string[] = [];
      
      if (itemSectionStart !== -1) {
        const endIndex = totalSectionStart !== -1 ? totalSectionStart : lines.length;
        productSectionLines = lines.slice(itemSectionStart + 1, endIndex);
      } else {
        // Fallback: look for lines that match known food/product patterns
        productSectionLines = lines;
      }

      console.log("Product section lines:", productSectionLines);

      // Step 3: Filter to get only actual product names
      const potentialProducts = productSectionLines.filter((line: string) => {
        const lower = line.toLowerCase();
        const trimmed = line.trim();
        
        // Skip obvious non-product lines
        if (
          // Store/location info
          lower.includes('supermarket') || lower.includes('store') ||
          lower.includes('city index') || lower.includes('25b') ||
          lower.includes('address') || lower.includes('phone') || lower.includes('tel') ||
          
          // Receipt metadata and codes
          lower.includes('bill') || lower.includes('waiter') || lower.includes('cashier') ||
          lower.includes('manager') || lower.includes('tin') || lower.includes('osc') ||
          lower.includes('cash') || lower.includes('change') || lower.includes('date') || lower.includes('time') ||
          /^\d{2}\/\d{2}\/\d{4}/.test(trimmed) || // dates
          
          // Totals and calculations
          lower.includes('total') || lower.includes('subtotal') || lower.includes('gross') ||
          lower.includes('vat') || lower.includes('tax') || lower.includes('service') ||
          lower.includes('net amount') || lower.includes('get back') ||
          lower.includes('charges') || lower.includes('discount') ||
          
          // Section headers
          lower === 'name' || lower.includes('qty') || lower.includes('quantity') ||
          lower.includes('price') || lower.includes('amount') ||
          
          // Footer messages
          lower.includes('thank you') || lower.includes('glad to see') || 
          lower.includes('visit again') || lower.includes('welcome') ||
          lower.includes('modif.ai') ||
          
          // Staff names and codes
          lower.includes('eric') || lower.includes('steer') ||
          
          // Numbers, prices, codes, or very short text
          /^\d+$/.test(trimmed) || // just numbers
          /^\d+\.\d+$/.test(trimmed) || // decimal numbers
          /^\d+,\d+$/.test(trimmed) || // comma decimals
          /^[\d\s\.,]+$/.test(trimmed) || // only numbers, spaces, dots, commas
          /^[A-Z]{1,3}\d+$/.test(trimmed) || // codes like AS515
          /^\d+\s*(no|NO)$/.test(trimmed) || // "150 no"
          /^[.I]\s*OOO$/.test(trimmed) || // ".OOO", "I OOO"
          /^ecoo$/.test(trimmed) || // "ecoo"
          /^\d+\s*\.\s*CO$/.test(trimmed) || // "160 .CO"
          /^#\d+$/.test(trimmed) || // "#3"
          trimmed.length < 3 // too short
        ) {
          return false;
        }
        
        // Only include lines that look like actual product names
        // Must contain letters and be reasonable length
        if (!/[a-zA-Z]/.test(trimmed) || trimmed.length < 3) {
          return false;
        }
        
        return true;
      });

      console.log("Potential Products:", potentialProducts);

      // Step 4: Extract prices from the price section
      const priceIndex = lines.findIndex((line: string) => line.toLowerCase() === 'price');
      let prices: number[] = [];
      
      if (priceIndex !== -1) {
        // Look for prices after the "price" keyword
        const priceLines = lines.slice(priceIndex + 1);
        
        priceLines.forEach((line: string) => {
          // Match various price formats: $9.20, 330.00, 330,00, etc.
          const pricePatterns = [
            /^\$\d{1,4}\.\d{2}$/,  // $9.20, $19.20 (with dollar sign)
            /^\d{1,4}[.,]\d{2}$/,  // 330.00, 330,00 (exact match)
            /^\d{1,4}\.00$/,       // 330.00 (exact match)
            /^\d{1,4},00$/,        // 330,00 (exact match)
            /^\d{1,4}\.\d{2}$/,    // 170.00 (exact match)
          ];
          
          for (const pattern of pricePatterns) {
            if (pattern.test(line.trim())) {
              let cleanValue = line.trim().replace('$', '').replace(',', '.');
              const numValue = parseFloat(cleanValue);
              if (numValue > 0 && numValue < 10000) { // reasonable price range
                prices.push(numValue);
                break; // Found a price, move to next line
              }
            }
          }
        });
      }

      // Step 5: Extract quantities (look for small numbers that could be quantities)
      let quantities: number[] = [];
      
      // Look for quantity patterns in the receipt
      lines.forEach((line: string) => {
        // Look for standalone small numbers that could be quantities
        if (/^[1-9]$/.test(line.trim()) || /^[1-9]\d$/.test(line.trim())) {
          const qty = parseInt(line.trim());
          if (qty > 0 && qty <= 50) {
            quantities.push(qty);
          }
        }
      });
      
      console.log("Extracted Prices:", prices);
      console.log("Extracted Quantities:", quantities);

      // Step 6: Match products with prices and quantities
      const productCount = potentialProducts.length;
      const priceCount = prices.length;
      const qtyCount = quantities.length;
      
      console.log(`Found ${productCount} products, ${priceCount} prices, ${qtyCount} quantities`);

      // Only process items that have both product name and price
      const itemsToProcess = Math.min(productCount, priceCount);
      
      console.log("Final product matching:");
      for (let i = 0; i < itemsToProcess; i++) {
        const productName = potentialProducts[i].trim();
        const price = prices[i] || 0;
        const quantity = quantities[i] || 1; // Use quantity if available, otherwise default to 1

        // Additional validation: ensure this is actually a product
        const isValidProduct = 
          productName.length > 2 && 
          price > 0 && 
          !/^\d+$/.test(productName) && // not just numbers
          !/^[A-Z]{1,3}\d+$/.test(productName) && // not codes like AS515
          /[a-zA-Z]/.test(productName); // contains letters

        if (isValidProduct) {
          // Auto-detect category based on product name
          const category: Category = detectCategory(productName);
          const footprintPerUnit = footprintData[category];

          purchasesExtracted.push({
            id: Date.now() + i,
            product: productName,
            category,
            quantity,
            price,
            footprint: {
              co2: footprintPerUnit.co2 * quantity,
              plastic: footprintPerUnit.plastic * quantity,
              water: footprintPerUnit.water * quantity,
            },
          });
          
          console.log(`✅ Added: "${productName}" → Qty: ${quantity}, Price: ${price}, Category: ${category}`);
        } else {
          console.log(`❌ Skipped: "${productName}" → Not a valid product`);
        }
      }

      if (purchasesExtracted.length > 0) {
        // Add to backend
        for (const purchase of purchasesExtracted) {
          try {
            await addPurchaseMutation({
              productName: purchase.product,
              category: purchase.category,
              quantity: purchase.quantity,
              price: purchase.price,
              impactScore: purchase.footprint.co2,
              footprint: purchase.footprint,
              date: new Date().toISOString(),
              receiptImage: undefined, // Could be enhanced to store receipt image
            });
          } catch (e) {
            console.error("Failed to save purchase from receipt", e);
          }
        }

        // Don't update local state - let the backend sync handle it
        // The useEffect will automatically update the state when backendPurchases changes
        alert(`Receipt processed successfully! Added ${purchasesExtracted.length} purchase(s).`);
      } else {
        alert("Receipt processed, but no valid purchase found. Please enter manually.");
      }

      setIsProcessingReceipt(false);
    } catch (err: any) {
      setIsProcessingReceipt(false);
      alert("Error processing receipt: " + (err.message || err));
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 p-4">
      

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Sustainability Score */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Your Sustainability Score</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(sustainabilityScore * 2.51).toFixed(2)} 251`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">
                  {Math.round(sustainabilityScore)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-600">
                {sustainabilityScore > 75
                  ? "Excellent progress!"
                  : sustainabilityScore > 50
                    ? "Good, but room for improvement."
                    : "Let's work on reducing your footprint!"}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {purchases.length} purchase{purchases.length !== 1 && "s"} tracked
              </p>
            </div>
          </div>
        </div>

        {/* Input Method Toggle */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Add Purchase Data</h3>
          <div className="flex border rounded-lg overflow-hidden mb-6">
            <button
              className={`flex-1 py-2 px-4 transition ${inputMethod === "manual"
                ? "bg-green-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
                }`}
              onClick={() => setInputMethod("manual")}
            >
              Add Manually
            </button>
            <button
              className={`flex-1 py-2 px-4 transition ${inputMethod === "receipt"
                ? "bg-green-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
                }`}
              onClick={() => setInputMethod("receipt")}
            >
              Upload Receipt
            </button>
          </div>

          {inputMethod === "manual" ? (
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 pr-10 border rounded-lg focus:ring-green-500 focus:border-green-500"
                    value={product}
                    onChange={(e) => {
                      const newProduct = e.target.value;
                      // Soft-validate only (no blocking). Trim very long names.
                      const cleaned = newProduct.slice(0, 80);
                      setProduct(cleaned);
                      
                      // Auto-apply recommended category if user hasn't manually overridden
                      if (!isManualCategoryOverride && cleaned.trim()) {
                        const recommendedCategory = detectCategory(cleaned);
                        setCategory(recommendedCategory);
                      }
                    }}
                    placeholder="e.g., Organic cotton tee, iPhone 15, Running Shoes"
                  />
                  {/* Inline clear button */}
                  {product && (
                    <button
                      type="button"
                      onClick={() => setProduct("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear product name"
                    >
                      ×
                    </button>
                  )}
                </div>
                {product && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-green-700">
                        💡 <strong>Recommended category:</strong> <span className="font-semibold text-green-800">{detectCategory(product)}</span>
                      </div>
                      {category !== detectCategory(product) && (
                        <button
                          onClick={() => {
                            setCategory(detectCategory(product));
                            setIsManualCategoryOverride(false); // Reset override flag
                          }}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {category !== detectCategory(product) && (
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ Current selection: <strong>{category}</strong> (manual override)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as Category);
                    setIsManualCategoryOverride(true); // Mark as manual override
                  }}
                  className="w-full p-3 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Toys">Toys</option>
                  <option value="Books">Books</option>
                </select>
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full p-3 pr-10 border rounded-lg focus:ring-green-500 focus:border-green-500"
                      value={quantity}
                      min={1}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">pcs</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      className="w-full pl-7 p-3 border rounded-lg focus:ring-green-500 focus:border-green-500"
                      value={price}
                      min={0}
                      step={0.01}
                      onChange={(e) => setPrice(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <button
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 flex items-center justify-center gap-2"
                disabled={!product || quantity <= 0 || price <= 0}
                onClick={addPurchase}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Add Purchase
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {isProcessingReceipt ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
                    <p className="text-gray-600">Processing your receipt...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      {isProcessingReceipt ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
                          <p className="text-gray-600">Processing your receipt...</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-center mb-4">
                            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Upload a receipt to automatically calculate your environmental footprint
                          </p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            id="receipt-upload"
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              handleReceiptUpload(e.target.files?.[0] || null)
                            }
                          />
                          <label
                            htmlFor="receipt-upload"
                            className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition cursor-pointer"
                          >
                            Choose File
                          </label>
                          <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG, or PDF</p>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Note: Receipt analysis provides estimates. For more accurate results, enter purchases manually.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {recommendations.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Sustainable Alternatives (Tips)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {recommendations.map((r) => (
                <div key={r.key} className="border rounded-xl p-4 bg-green-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{r.tag}</span>
                    <span className="text-xs text-green-700">up to {Math.round(r.estimatedReduction * 100)}% lower CO₂</span>
                  </div>
                  <div className="font-medium text-green-900">{r.title}</div>
                  <p className="text-sm text-gray-700 mt-1">{r.details}</p>
                  <p className="text-xs text-gray-500 mt-2">Based on: <span className="font-medium">{r.basedOnProduct}</span> ({r.category})</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {productAlternatives.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Sustainable Alternative Products</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {productAlternatives.map((item) => (
                <div key={item.id} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{item.badge}</span>
                    <span className="text-xs text-green-700">{item.estImpactLabel}</span>
                  </div>
                  <div className="font-medium">{item.name}</div>
                  <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-2">Because you spent more on <span className="font-medium">{item.category}</span></p>
                  <div className="mt-2">
                    <button className="text-xs text-green-700 hover:text-green-800 hover:underline" onClick={() => setFilterCategory(item.category)}>See more in {item.category}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Filter Purchases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  className="w-full pl-9 p-3 border rounded-lg focus:ring-green-500 focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by product name..."
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as Category | "All")}
                className="w-full p-3 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="All">All Categories</option>
                <option value="Groceries">Groceries</option>
                <option value="Apparel">Apparel</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Beauty">Beauty</option>
                <option value="Toys">Toys</option>
                <option value="Books">Books</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value as "all" | "today" | "week" | "month")}
                className="w-full p-3 border rounded-lg focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {purchases.length} purchase{purchases.length !== 1 ? 's' : ''}
            {filterCategory !== "All" && ` in ${filterCategory}`}
            {filterDateRange !== "all" && ` from ${filterDateRange === "today" ? "today" : filterDateRange === "week" ? "last 7 days" : "last 30 days"}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>

        {/* Purchases List */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Tracked Purchases</h3>
            {purchases.length > 0 && (
              <button
                onClick={deleteAllPurchases}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded text-sm transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          {purchases.length === 0 ? (
            <p className="text-gray-600">No purchases added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-left text-sm">
                <caption className="sr-only">Tracked purchases with environmental footprint</caption>
                <thead>
                  <tr>
                    <th className="border-b border-gray-300 px-4 py-2">Date</th>
                    <th className="border-b border-gray-300 px-4 py-2">Product</th>
                    <th className="border-b border-gray-300 px-4 py-2">Category</th>
                    <th className="border-b border-gray-300 px-4 py-2">Qty</th>
                    <th className="border-b border-gray-300 px-4 py-2">Price ($)</th>
                    <th className="border-b border-gray-300 px-4 py-2">CO₂ (kg)</th>
                    <th className="border-b border-gray-300 px-4 py-2">Plastic (g)</th>
                    <th className="border-b border-gray-300 px-4 py-2">Water (L)</th>
                    <th className="border-b border-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-b border-gray-200">
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {p.timestamp 
                          ? new Date(p.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-2">{p.product}</td>
                      <td className="px-4 py-2">{p.category}</td>
                      <td className="px-4 py-2">{p.quantity}</td>
                      <td className="px-4 py-2">{p.price.toFixed(2)}</td>
                      <td className="px-4 py-2">{p.footprint.co2.toFixed(2)}</td>
                      <td className="px-4 py-2">{p.footprint.plastic.toFixed(0)}</td>
                      <td className="px-4 py-2">{p.footprint.water.toFixed(0)}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deletePurchase(p.id.toString())}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                          title="Delete purchase"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="font-semibold border-t border-gray-300">
                    <td className="px-4 py-2" colSpan={5}>Total</td>
                    <td className="px-4 py-2">{totalFootprint.co2.toFixed(2)}</td>
                    <td className="px-4 py-2">{totalFootprint.plastic.toFixed(0)}</td>
                    <td className="px-4 py-2">{totalFootprint.water.toFixed(0)}</td>
                    <td className="px-4 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}