import { useAuth } from "@/lib/auth/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getCurrencySymbol, formatCurrency } from "@/lib/utils/format";

export function useRestaurantCurrency(restaurantId?: number) {
  const { user } = useAuth();
  const targetId = restaurantId || user?.restaurant_id || 1;

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant-currency", targetId],
    queryFn: async () => {
      const res = await api.get(`/restaurants/${targetId}`);
      return res.data;
    },
    enabled: Boolean(targetId),
    staleTime: 5 * 60 * 1000,
  });

  // Prioritize: fetched restaurant default_currency -> user profile restaurant default_currency -> "PKR"
  const currency =
    restaurant?.default_currency ||
    user?.restaurant?.default_currency ||
    "PKR";

  const symbol = getCurrencySymbol(currency);

  const format = (value: number | string | null | undefined) => {
    return formatCurrency(value, currency);
  };

  return {
    currency,
    symbol,
    format,
  };
}
