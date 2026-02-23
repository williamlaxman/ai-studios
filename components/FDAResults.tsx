import React, { useState } from 'react';

interface RecommendedProduct {
  brand: string;
  name: string;
  type: 'Drug' | 'Cosmetic';
}

interface FDAResultsProps {
  ingredients: string[];
  products?: RecommendedProduct[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const FDAResults: React.FC<FDAResultsProps> = ({ ingredients, products, onRefresh, isRefreshing }) => {
  const [productSort, setProductSort] = useState<'brand' | 'type' | 'name'>('brand');
  const [ingredientSort, setIngredientSort] = useState<'alpha' | 'none'>('none');

  const hasIngredients = ingredients && ingredients.length > 0;
  const hasProducts = products && products.length > 0;

  const sortedProducts = products ? [...products].sort((a, b) => {
    if (productSort === 'brand') return a.brand.localeCompare(b.brand);
    if (productSort === 'name') return a.name.localeCompare(b.name);
    if (productSort === 'type') return a.type.localeCompare(b.type);
    return 0;
  }) : [];

  const sortedIngredients = ingredients ? [...ingredients].sort((a, b) => {
    if (ingredientSort === 'alpha') return a.localeCompare(b);
    return 0;
  }) : [];

  if (!hasIngredients && !hasProducts) {
    return (
      <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-[#a53d4c]/20 shadow-lg text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <i className="fa-solid fa-magnifying-glass-location text-[#a53d4c] text-2xl"></i>
          <h2 className="text-xl font-bold text-[#a53d4c] font-oswald uppercase tracking-wide">
            FDA Philippines Verification
          </h2>
        </div>
        <p className="text-sm text-gray-500 italic mb-4">
          No specific active ingredients or products were identified for FDA verification based on this analysis.
        </p>
        
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-[10px] font-bold uppercase tracking-wider text-[#a53d4c] hover:bg-[#a53d4c]/10 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
          >
            <i className={`fa-solid fa-rotate-right ${isRefreshing ? 'animate-spin' : ''}`}></i>
            {isRefreshing ? 'Refreshing...' : 'Try Again'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-[#a53d4c]/20 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-magnifying-glass-location text-[#a53d4c] text-2xl"></i>
          <h2 className="text-2xl font-bold text-[#a53d4c] font-oswald uppercase tracking-wide">
            FDA Philippines Verification
          </h2>
        </div>
        
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-[10px] font-bold uppercase tracking-wider text-[#a53d4c] hover:bg-[#a53d4c]/10 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <i className={`fa-solid fa-rotate-right ${isRefreshing ? 'animate-spin' : ''}`}></i>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        The following products are recommended based on your analysis. Since the FDA Philippines portal does not support direct linking, 
        these buttons will search the <strong>official FDA Philippines database via Google</strong> to verify registration status.
      </p>

      {/* Product Recommendations */}
      {products && products.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Recommended Products (PH Market)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Sort by:</span>
              <select 
                value={productSort} 
                onChange={(e) => setProductSort(e.target.value as any)}
                className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#a53d4c]"
              >
                <option value="brand">Brand</option>
                <option value="type">Type</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProducts.map((product, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${product.type === 'Drug' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {product.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#a53d4c] text-lg leading-tight mb-1">
                    {product.brand}
                  </h3>
                  <p className="text-sm text-gray-700 font-medium mb-4">
                    {product.name}
                  </p>
                </div>
                
                <a 
                  href={`https://www.google.com/search?q=site%3Averification.fda.gov.ph+OR+site%3Afda.gov.ph+${encodeURIComponent(`"${product.name}"`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#fdf2e9] text-orange-800 text-xs px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-center hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                >
                  Verify on FDA Portal <i className="fa-brands fa-google"></i>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredient Search Fallback */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Search by Active Ingredient
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Sort by:</span>
            <select 
              value={ingredientSort} 
              onChange={(e) => setIngredientSort(e.target.value as any)}
              className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#a53d4c]"
            >
              <option value="none">Default</option>
              <option value="alpha">A-Z</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedIngredients.map((ingredient, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
              <span className="font-medium text-gray-700 text-sm">{ingredient}</span>
              <a 
                href={`https://www.google.com/search?q=site%3Averification.fda.gov.ph+OR+site%3Afda.gov.ph+${encodeURIComponent(`"${ingredient}"`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a53d4c] hover:text-[#8b2635] text-xs font-bold whitespace-nowrap"
              >
                Search <i className="fa-brands fa-google ml-1"></i>
              </a>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 text-[10px] text-gray-400 text-center italic">
        Links direct to the official Food and Drug Administration (FDA) Philippines Verification Portal.
      </div>
    </div>
  );
};

export default FDAResults;
