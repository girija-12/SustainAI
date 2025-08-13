import { ChangeEvent, useEffect, useState } from "react";
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
  
  const productNameRegex = /^[A-Za-z\s]+$/;
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

  const dateRange = getDateRange();
  const backendPurchases = useQuery(api.sustainai.listPurchases, {
    category: filterCategory === "All" ? undefined : filterCategory,
    ...dateRange,
  });
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
      {/* Chat Widget */}
      <div className="lg:col-span-1">
        <ChatWidget
          agentName="GreenAdvisor"
          agentDescription="Your AI companion for sustainable shopping decisions"
          messages={[
            {
              role: "assistant",
              content:
                "Hi! I'm GreenAdvisor, your sustainable shopping companion. How can I help you?",
            },
          ]}
          placeholder="Ask about eco-friendly products..."
          bgColor="from-green-500 to-emerald-600"
        />
      </div>

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
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-green-500 focus:border-green-500"
                  value={product}
                  onChange={(e) => {
                    const newProduct = e.target.value;
                    setProduct(newProduct);
                    
                    // Auto-apply recommended category if user hasn't manually overridden
                    if (!isManualCategoryOverride && newProduct.trim()) {
                      const recommendedCategory = detectCategory(newProduct);
                      setCategory(recommendedCategory);
                    }
                  }}
                  placeholder="e.g., Organic T-shirt, iPhone 15, Nike Shoes"
                />
                {product && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
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
                  className="w-full p-2 border rounded focus:ring-green-500 focus:border-green-500"
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
                  <input
                    type="number"
                    className="w-full p-2 border rounded focus:ring-green-500 focus:border-green-500"
                    value={quantity}
                    min={1}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded focus:ring-green-500 focus:border-green-500"
                    value={price}
                    min={0}
                    step={0.01}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Add Button */}
              <button
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-300"
                disabled={!product || quantity <= 0 || price <= 0}
                onClick={addPurchase}
              >
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

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Filter Purchases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name..."
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as Category | "All")}
                className="w-full p-2 border rounded focus:ring-green-500 focus:border-green-500"
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
                className="w-full p-2 border rounded focus:ring-green-500 focus:border-green-500"
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