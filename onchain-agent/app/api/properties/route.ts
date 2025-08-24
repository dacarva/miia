import { NextRequest, NextResponse } from "next/server";
import propertyData from "../mocks/venta_propiedades_subset_valid.json";

export interface Property {
  web_id: string;
  rent_value: number | null;
  business_type: string;
  property_type: string;
  rooms: number;
  bathrooms: number;
  garage: number;
  area: number;
  built_area: number;
  elevator: boolean;
  title: string;
  neighborhood: string;
  city_id: number;
  city_name: string;
  built_time: string | null;
  description: string | null;
  status: string;
  management_value: number | null;
  sale_value: number;
  private_area: number | null;
  floor_num: number | null;
  update_date: string | null;
  check_in_date: string | null;
  published_date: string | null;
  stratum: number | null;
  lon: number | null;
  lat: number | null;
}

export interface PropertyWithInvestmentInfo extends Property {
  min_investment: number;
  max_investment: number;
  total_tokens: number;
  available_tokens: number;
  price_per_token: number;
  formatted_price: string;
  investment_percentage_per_token: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function calculateTokenomics(property: Property): {
  min_investment: number;
  max_investment: number;
  total_tokens: number;
  available_tokens: number;
  price_per_token: number;
  investment_percentage_per_token: number;
} {
  const MIN_INVESTMENT_COP = 400000; // $100 USD = 400,000 COP
  const total_tokens = Math.floor(property.sale_value / MIN_INVESTMENT_COP);
  const price_per_token = property.sale_value / total_tokens;
  const investment_percentage_per_token = (1 / total_tokens) * 100;
  
  return {
    min_investment: MIN_INVESTMENT_COP,
    max_investment: property.sale_value,
    total_tokens,
    available_tokens: total_tokens, // For hackathon, all tokens are available
    price_per_token,
    investment_percentage_per_token
  };
}

function enhancePropertyWithInvestmentInfo(property: Property): PropertyWithInvestmentInfo {
  const tokenomics = calculateTokenomics(property);
  
  return {
    ...property,
    ...tokenomics,
    formatted_price: formatCurrency(property.sale_value)
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const neighborhood = searchParams.get('neighborhood');
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : null;
    const minArea = searchParams.get('minArea') ? parseFloat(searchParams.get('minArea')!) : null;
    const maxArea = searchParams.get('maxArea') ? parseFloat(searchParams.get('maxArea')!) : null;

    let filteredProperties = propertyData as Property[];

    // Apply filters
    if (neighborhood) {
      filteredProperties = filteredProperties.filter(p => 
        p.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())
      );
    }

    if (minPrice) {
      filteredProperties = filteredProperties.filter(p => p.sale_value >= minPrice);
    }

    if (maxPrice) {
      filteredProperties = filteredProperties.filter(p => p.sale_value <= maxPrice);
    }

    if (minArea) {
      filteredProperties = filteredProperties.filter(p => p.area >= minArea);
    }

    if (maxArea) {
      filteredProperties = filteredProperties.filter(p => p.area <= maxArea);
    }

    // Sort by price (ascending by default)
    filteredProperties.sort((a, b) => a.sale_value - b.sale_value);

    // Apply pagination
    const paginatedProperties = filteredProperties.slice(offset, offset + limit);

    // Enhance with investment information
    const enhancedProperties = paginatedProperties.map(enhancePropertyWithInvestmentInfo);

    return NextResponse.json({
      properties: enhancedProperties,
      total: filteredProperties.length,
      limit,
      offset,
      hasMore: offset + limit < filteredProperties.length
    });

  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId } = body;

    const property = propertyData.find((p: Property) => p.web_id === propertyId);
    
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const enhancedProperty = enhancePropertyWithInvestmentInfo(property as Property);

    return NextResponse.json({
      property: enhancedProperty
    });

  } catch (error) {
    console.error("Error fetching property details:", error);
    return NextResponse.json(
      { error: "Failed to fetch property details" },
      { status: 500 }
    );
  }
}