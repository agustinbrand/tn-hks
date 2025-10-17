import { useEffect, useState } from "react";
import { createApiClient } from "../api/client";

type ComplementaryProduct = {
  id: number;
  name: string;
  image: string | null;
};

type Props = {
  selected: ComplementaryProduct[];
  onChange: (next: ComplementaryProduct[]) => void;
  disabledIds: number[];
};

export default function ComplementaryPicker({
  selected,
  onChange,
  disabledIds,
}: Props) {
  const [products, setProducts] = useState<ComplementaryProduct[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      const api = await createApiClient();
      const { data } = await api.get("/products", {
        params: { per_page: 50, fields: "id,name,images" },
      });
      const list = (data.data || []).map((product: any) => ({
        id: product.id,
        name:
          product.name?.es || product.name?.pt || product.name?.en || "Producto",
        image: product.images?.[0]?.src ?? null,
      }));
      setProducts(list);
    }
    fetchProducts();
  }, []);

  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(product: ComplementaryProduct) {
    const exists = selected.some((item) => item.id === product.id);
    if (exists) {
      onChange(selected.filter((item) => item.id !== product.id));
    } else {
      onChange([...selected, product]);
    }
  }

  return (
    <div className="card">
      <h2 className="section-title">Productos complementarios</h2>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Seleccioná otros productos que quieras recomendar junto al bundle. Se
        mostrarán con imagen, precios y variantes disponibles.
      </p>
      <label htmlFor="search">Buscar producto</label>
      <input
        id="search"
        type="text"
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div style={{ marginTop: 16 }}>
        {filtered.map((product) => {
          const isDisabled = disabledIds.includes(product.id);
          const isSelected = selected.some((item) => item.id === product.id);
          return (
            <div
              key={product.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #e5e7eb",
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <input
                type="checkbox"
                disabled={isDisabled}
                checked={isSelected}
                onChange={() => toggle(product)}
              />
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: 42, height: 42, borderRadius: 10 }}
                />
              ) : (
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: "#f3f4f6",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                <small style={{ color: "#9ca3af" }}>#{product.id}</small>
              </div>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 className="section-title">Seleccionados</h3>
          <div className="badge-list">
            {selected.map((product) => (
              <span key={product.id} className="badge">
                #{product.id} {product.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
