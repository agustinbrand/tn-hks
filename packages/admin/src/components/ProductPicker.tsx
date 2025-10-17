import { useEffect, useState } from "react";
import { createApiClient } from "../api/client";

export type ProductOption = {
  id: number;
  name: string;
  image?: string;
};

type Props = {
  value: number | null;
  onChange: (value: ProductOption | null) => void;
};

export default function ProductPicker({ value, onChange }: Props) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const api = await createApiClient();
        const { data } = await api.get("/products", {
          params: { per_page: 50, fields: "id,name,images" },
        });
        const options = (data.data || []).map((product: any) => ({
          id: product.id,
          name:
            product.name?.es || product.name?.pt || product.name?.en || "Producto",
          image: product.images?.[0]?.src ?? null,
        }));
        setProducts(options);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <div className="card">
      <h2 className="section-title">Producto principal</h2>
      <label htmlFor="product">Elegí el producto que quieres convertir en bundle</label>
      <select
        id="product"
        disabled={loading}
        value={value ?? ""}
        onChange={(event) => {
          const selected = products.find(
            (product) => product.id === Number(event.target.value),
          );
          onChange(selected ?? null);
        }}
      >
        <option value="">{loading ? "Cargando…" : "Seleccioná un producto"}</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            #{product.id} · {product.name}
          </option>
        ))}
      </select>
    </div>
  );
}
