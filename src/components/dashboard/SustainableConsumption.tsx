import { ChangeEvent, useState } from "react";
import ChatWidget from "../shared/ChatWidget";

type Category = | "Groceries" | "Apparel" | "Electronics" | "Furniture" | "Beauty" | "Toys" | "Books";

type Purchase = {
  id: number;
  product: string;
  category: Category;
  quantity: number;
  price: number;
  footprint: {
    co2: number;     // kg CO2
    plastic: number; // grams
    water: number;   // liters
  };
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

export default function SustainableConsumption() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState<Category>("Groceries");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [inputMethod, setInputMethod] = useState<"manual" | "receipt">("manual");
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);

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

  // Simple sustainability score based on footprint (lower footprint = higher score)
  const sustainabilityScore = Math.max(
    0,
    Math.min(100, 100 - totalFootprint.co2 * 3)
  );

  const addPurchase = () => {
    if (!product || quantity <= 0 || price <= 0) return alert("Please fill all fields");

    const footprintPerUnit = footprintData[category];
    const newPurchase: Purchase = {
      id: purchases.length + 1,
      product,
      category,
      quantity,
      price,
      footprint: {
        co2: footprintPerUnit.co2 * quantity,
        plastic: footprintPerUnit.plastic * quantity,
        water: footprintPerUnit.water * quantity,
      },
    };

    setPurchases([...purchases, newPurchase]);

    // Reset form
    setProduct("");
    setQuantity(1);
    setPrice(0);
  };

  const handleReceiptUpload = (file: File | null) => {
    if (!file) return;

    setIsProcessingReceipt(true);
    console.log("Processing receipt:", file.name);

    // Simulate receipt processing with timeout
    setTimeout(() => {
      // Mock data - in a real app, this would come from OCR/AI analysis
      const mockPurchase: Purchase = {
        id: purchases.length + 1,
        product: "Receipt items",
        category: "Groceries",
        quantity: 5,
        price: 42.99,
        footprint: {
          co2: 8.5,
          plastic: 120,
          water: 350,
        },
      };

      setPurchases([...purchases, mockPurchase]);
      setIsProcessingReceipt(false);
      alert("Receipt processed successfully! Added estimated footprint data.");
    }, 2000);
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
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g., Organic T-shirt"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
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

        {/* Purchases List */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Tracked Purchases</h3>
          {purchases.length === 0 ? (
            <p className="text-gray-600">No purchases added yet.</p>
          ) : (
            <table className="w-full table-auto border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-gray-300 px-4 py-2">Product</th>
                  <th className="border-b border-gray-300 px-4 py-2">Category</th>
                  <th className="border-b border-gray-300 px-4 py-2">Qty</th>
                  <th className="border-b border-gray-300 px-4 py-2">Price ($)</th>
                  <th className="border-b border-gray-300 px-4 py-2">CO₂ (kg)</th>
                  <th className="border-b border-gray-300 px-4 py-2">Plastic (g)</th>
                  <th className="border-b border-gray-300 px-4 py-2">Water (L)</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200">
                    <td className="px-4 py-2">{p.product}</td>
                    <td className="px-4 py-2">{p.category}</td>
                    <td className="px-4 py-2">{p.quantity}</td>
                    <td className="px-4 py-2">{p.price.toFixed(2)}</td>
                    <td className="px-4 py-2">{p.footprint.co2.toFixed(2)}</td>
                    <td className="px-4 py-2">{p.footprint.plastic.toFixed(0)}</td>
                    <td className="px-4 py-2">{p.footprint.water.toFixed(0)}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="font-semibold border-t border-gray-300">
                  <td className="px-4 py-2" colSpan={4}>Total</td>
                  <td className="px-4 py-2">{totalFootprint.co2.toFixed(2)}</td>
                  <td className="px-4 py-2">{totalFootprint.plastic.toFixed(0)}</td>
                  <td className="px-4 py-2">{totalFootprint.water.toFixed(0)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}