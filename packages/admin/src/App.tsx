import { useEffect, useMemo, useState } from "react";
import ProductPicker, {
  type ProductOption,
} from "./components/ProductPicker";
import BundleEditor from "./components/BundleEditor";
import ComplementaryPicker from "./components/ComplementaryPicker";
import { useSession } from "./hooks/useSession";
import type { BundleConfig } from "./types";
import { defaultConfig } from "./types";
import { createApiClient } from "./api/client";

export default function App() {
  const session = useSession();
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    null,
  );
  const [config, setConfig] = useState<BundleConfig>(defaultConfig);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const productId = selectedProduct?.id;
    if (!productId) return;
    async function fetchConfig() {
      setLoadingConfig(true);
      try {
        const api = await createApiClient();
        const { data } = await api.get(`/bundles/${productId}`);
        if (data?.data) {
          setConfig({
            ...defaultConfig,
            ...data.data,
            complementaries: data.data.complementaries ?? [],
          });
        } else {
          setConfig(defaultConfig);
        }
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, [selectedProduct]);

  async function handleSave() {
    if (!selectedProduct) throw new Error("Tenés que elegir un producto");
    setSaving(true);
    try {
      const api = await createApiClient();
      await api.post(`/bundles/${selectedProduct.id}`, config);
    } finally {
      setSaving(false);
    }
  }

  const disabledComplementaryIds = useMemo(
    () => (selectedProduct ? [selectedProduct.id] : []),
    [selectedProduct],
  );

  if (session.status === "loading") {
    return (
      <div className="app-shell">
        <div className="app-content">
          <div className="card">Cargando sesión…</div>
        </div>
      </div>
    );
  }

  if (session.status === "error") {
    return (
      <div className="app-shell">
        <div className="app-content">
          <div className="card" style={{ color: "#dc2626" }}>
            {session.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-content">
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Bundle Packs para Tiendanube</h1>
          <p style={{ marginTop: 8, color: "#6b7280" }}>
            Hola {session.permanentDomain} 👋 Configurá los bundles y complementarios
            que se inyectarán automáticamente en tu tienda.
          </p>
        </header>

        <ProductPicker
          value={selectedProduct?.id ?? null}
          onChange={(product) => {
            setSelectedProduct(product);
            setConfig(defaultConfig);
          }}
        />

        {selectedProduct && (
          <>
            {loadingConfig ? (
              <div className="card">Cargando configuración del bundle…</div>
            ) : (
              <>
                <BundleEditor
                  config={config}
                  onChange={setConfig}
                  onSave={handleSave}
                  saving={saving}
                />
                <ComplementaryPicker
                  selected={config.complementaries.map((product) => ({
                    id: product.productId,
                    name: product.title,
                    image: product.image,
                  }))}
                  disabledIds={disabledComplementaryIds}
                  onChange={(list) =>
                    setConfig({
                      ...config,
                      complementaries: list.map((item) => ({
                        productId: item.id,
                        title: item.name,
                        image: item.image,
                      })),
                    })
                  }
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
