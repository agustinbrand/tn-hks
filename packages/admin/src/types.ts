export type BundlePack = {
  units: number;
  label: string;
  subheadline?: string;
  discount: number;
  badges?: { text: string; className: string }[];
};

export type BundleConfig = {
  mainTitle: string;
  helpText: string;
  buttonText: string;
  addingText: string;
  successMessage: string;
  selectPackError: string;
  selectVariantsError: string;
  packs: BundlePack[];
  freeShippingThreshold: number;
  freeShippingBadgeText: string;
  complementariesPosition: "inside" | "bottom";
  colors: {
    primary: string;
    primaryHover: string;
    success: string;
  };
  complementaries: {
    productId: number;
    title: string;
    image: string | null;
  }[];
};

export const defaultConfig: BundleConfig = {
  mainTitle: "ARMÁ TU PACK AUREN",
  helpText: "Podés combinar talles/colores distintos en el mismo pack.",
  buttonText: "AGREGAR AL CARRITO",
  addingText: "Agregando…",
  successMessage: "✅ Todo agregado correctamente",
  selectPackError: "Elegí un pack primero.",
  selectVariantsError: "⚠️ Tenés que elegir todas las variantes.",
  packs: [
    {
      units: 1,
      label: "1 Auren Ear Flat (8 Correctores)",
      subheadline: "Pensado para cubrir 1 mes",
      discount: 0,
      badges: [],
    },
    {
      units: 2,
      label: "2 Auren Ear Flat (16 Correctores)",
      subheadline: "Pensado para cubrir 2 meses",
      discount: 0.25,
      badges: [{ text: "MÁS VENDIDO", className: "mb-badge" }],
    },
    {
      units: 3,
      label: "3 Auren Ear Flat (24 Correctores)",
      subheadline: "Pensado para cubrir 3 meses",
      discount: 0.35,
      badges: [{ text: "MEJOR AHORRO", className: "mb-badge--green" }],
    },
  ],
  freeShippingThreshold: 69000,
  freeShippingBadgeText: "ENVÍO GRATIS",
  complementariesPosition: "bottom",
  colors: {
    primary: "#1CBCC2",
    primaryHover: "#2563EB",
    success: "#22c55e",
  },
  complementaries: [],
};
