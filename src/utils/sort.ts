import type { Quote, SortType } from '@/types';

export function sortQuotes(quotes: Quote[], sortType: SortType = 'price_asc'): Quote[] {
  const sorted = [...quotes];

  switch (sortType) {
    case 'price_asc':
      return sorted.sort((a, b) => a.totalPrice - b.totalPrice);

    case 'price_desc':
      return sorted.sort((a, b) => b.totalPrice - a.totalPrice);

    case 'distance':
      return sorted.sort((a, b) => a.distanceKm - b.distanceKm);

    case 'reputation':
      return sorted.sort((a, b) => {
        const repA = a.supplier.reputation;
        const repB = b.supplier.reputation;

        const scoreA = repA.positiveRate * 0.4 + repA.starRating * 0.1 + (1 - repA.pigeonRate) * 0.3 + (1 - repA.wrongShipRate) * 0.2;
        const scoreB = repB.positiveRate * 0.4 + repB.starRating * 0.1 + (1 - repB.pigeonRate) * 0.3 + (1 - repB.wrongShipRate) * 0.2;

        if (scoreB !== scoreA) return scoreB - scoreA;
        return repB.totalDeals - repA.totalDeals;
      });

    case 'speed':
      return sorted.sort((a, b) => {
        if (b.canShipToday !== a.canShipToday) {
          return b.canShipToday ? 1 : -1;
        }
        if (a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    default:
      return sorted;
  }
}

export function sortQuotesComprehensive(quotes: Quote[], buyerCity?: string): Quote[] {
  return [...quotes].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const priceWeight = 0.35;
    const repWeight = 0.25;
    const speedWeight = 0.2;
    const distanceWeight = 0.15;
    const warrantyWeight = 0.05;

    const allPrices = quotes.map(q => q.totalPrice);
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    scoreA += (1 - (a.totalPrice - minPrice) / priceRange) * priceWeight;
    scoreB += (1 - (b.totalPrice - minPrice) / priceRange) * priceWeight;

    const repA = a.supplier.reputation;
    const repB = b.supplier.reputation;
    const repScoreA = repA.positiveRate * 0.5 + repA.starRating / 5 * 0.2 + (1 - repA.pigeonRate) * 0.2 + (1 - repA.wrongShipRate) * 0.1;
    const repScoreB = repB.positiveRate * 0.5 + repB.starRating / 5 * 0.2 + (1 - repB.pigeonRate) * 0.2 + (1 - repB.wrongShipRate) * 0.1;

    scoreA += repScoreA * repWeight;
    scoreB += repScoreB * repWeight;

    const speedScoreA = (a.canShipToday ? 1 : 0) * 0.6 + 0.4;
    const speedScoreB = (b.canShipToday ? 1 : 0) * 0.6 + 0.4;

    scoreA += speedScoreA * speedWeight;
    scoreB += speedScoreB * speedWeight;

    const allDistances = quotes.map(q => q.distanceKm);
    const maxDistance = Math.max(...allDistances);
    const minDistance = Math.min(...allDistances);
    const distanceRange = maxDistance - minDistance || 1;

    scoreA += (1 - (a.distanceKm - minDistance) / distanceRange) * distanceWeight;
    scoreB += (1 - (b.distanceKm - minDistance) / distanceRange) * distanceWeight;

    const maxWarranty = Math.max(...quotes.map(q => q.warrantyDays));
    const warrantyScoreA = maxWarranty > 0 ? a.warrantyDays / maxWarranty : 0;
    const warrantyScoreB = maxWarranty > 0 ? b.warrantyDays / maxWarranty : 0;

    scoreA += warrantyScoreA * warrantyWeight;
    scoreB += warrantyScoreB * warrantyWeight;

    if (buyerCity) {
      const cityBonus = 0.05;
      if (a.sourceCity === buyerCity) scoreA += cityBonus;
      if (b.sourceCity === buyerCity) scoreB += cityBonus;
    }

    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.totalPrice - b.totalPrice;
  });
}

export function filterQuotesByConditions(
  quotes: Quote[],
  conditions: {
    canShipToday?: boolean;
    conditionType?: ('new' | 'used' | 'refurbished')[];
    minPrice?: number;
    maxPrice?: number;
    maxDistance?: number;
    minWarrantyDays?: number;
    minReputation?: number;
  }
): Quote[] {
  return quotes.filter(quote => {
    if (conditions.canShipToday !== undefined && quote.canShipToday !== conditions.canShipToday) {
      return false;
    }

    if (conditions.conditionType && conditions.conditionType.length > 0) {
      if (!conditions.conditionType.includes(quote.conditionType)) {
        return false;
      }
    }

    if (conditions.minPrice !== undefined && quote.totalPrice < conditions.minPrice) {
      return false;
    }

    if (conditions.maxPrice !== undefined && quote.totalPrice > conditions.maxPrice) {
      return false;
    }

    if (conditions.maxDistance !== undefined && quote.distanceKm > conditions.maxDistance) {
      return false;
    }

    if (conditions.minWarrantyDays !== undefined && quote.warrantyDays < conditions.minWarrantyDays) {
      return false;
    }

    if (conditions.minReputation !== undefined) {
      if (quote.supplier.reputation.starRating < conditions.minReputation) {
        return false;
      }
    }

    return true;
  });
}

export function getQuoteScores(quote: Quote, allQuotes: Quote[]) {
  const allPrices = allQuotes.map(q => q.totalPrice);
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  const allDistances = allQuotes.map(q => q.distanceKm);
  const maxDistance = Math.max(...allDistances);
  const minDistance = Math.min(...allDistances);
  const distanceRange = maxDistance - minDistance || 1;

  const maxWarranty = Math.max(...allQuotes.map(q => q.warrantyDays));

  const priceScore = (1 - (quote.totalPrice - minPrice) / priceRange) * 100;
  const distanceScore = (1 - (quote.distanceKm - minDistance) / distanceRange) * 100;
  const warrantyScore = maxWarranty > 0 ? (quote.warrantyDays / maxWarranty) * 100 : 0;

  const rep = quote.supplier.reputation;
  const reputationScore = (
    rep.positiveRate * 0.5 +
    rep.starRating / 5 * 0.2 +
    (1 - rep.pigeonRate) * 0.2 +
    (1 - rep.wrongShipRate) * 0.1
  ) * 100;

  const overallScore = (
    priceScore * 0.35 +
    reputationScore * 0.25 +
    (quote.canShipToday ? 90 : 50) * 0.2 +
    distanceScore * 0.15 +
    warrantyScore * 0.05
  );

  return {
    priceScore: Math.round(priceScore),
    distanceScore: Math.round(distanceScore),
    warrantyScore: Math.round(warrantyScore),
    reputationScore: Math.round(reputationScore),
    overallScore: Math.round(overallScore),
  };
}
