import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api.js";

const revokeIfBlobUrl = (url) => {
  if (url && typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

export default function useProductImages({ authToken, visibleProducts }) {
  const [imageUrls, setImageUrls] = useState({});
  const imageUrlsRef = useRef({});

  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  const setProductImageUrl = useCallback((productId, url) => {
    setImageUrls((prev) => {
      const current = prev[productId];
      if (current && current !== url) {
        revokeIfBlobUrl(current);
      }
      return { ...prev, [productId]: url };
    });
  }, []);

  const fetchProductImage = useCallback(
    async (productId) => {
      if (!authToken) return;
      try {
        const response = await apiFetch(`/api/catalog/products/${productId}/image`, {}, authToken);
        if (!response.ok) return;
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setProductImageUrl(productId, url);
      } catch {
        // ignore image fetch failures
      }
    },
    [authToken, setProductImageUrl]
  );

  useEffect(() => {
    if (!authToken) return;
    visibleProducts.forEach((product) => {
      if (product.hasImage && !imageUrls[product.id]) {
        fetchProductImage(product.id);
      }
    });
  }, [authToken, fetchProductImage, imageUrls, visibleProducts]);

  useEffect(() => {
    return () => {
      Object.values(imageUrlsRef.current).forEach((url) => revokeIfBlobUrl(url));
    };
  }, []);

  return {
    imageUrls,
    setProductImageUrl,
  };
}
