import { useState } from "react";
import type { BundleConfig, BundlePack } from "../types";

type Props = {
  config: BundleConfig;
  onChange: (config: BundleConfig) => void;
  onSave: () => Promise<void>;
  saving: boolean;
};

function PackRow({
  pack,
  index,
  onUpdate,
}: {
  pack: BundlePack;
  index: number;
  onUpdate: (next: BundlePack) => void;
}) {
  return (
    <div className="card">
      <h3 className="section-title">Pack #{index + 1}</h3>
      <div className="grid two">
        <div>
          <label>Cantidad de unidades</label>
          <input
            type="number"
            min={1}
            value={pack.units}
            onChange={(event) =>
              onUpdate({ ...pack, units: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <label>Descuento (%)</label>
          <input
            type="number"
            min={0}
            max={90}
            value={Math.round(pack.discount * 100)}
            onChange={(event) =>
              onUpdate({ ...pack, discount: Number(event.target.value) / 100 })
            }
          />
        </div>
      </div>
      <div className="grid">
        <div>
          <label>Título visible</label>
          <input
            type="text"
            value={pack.label}
            onChange={(event) => onUpdate({ ...pack, label: event.target.value })}
          />
        </div>
        <div>
          <label>Subtítulo</label>
          <input
            type="text"
            value={pack.subheadline ?? ""}
            onChange={(event) =>
              onUpdate({ ...pack, subheadline: event.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function BundleEditor({
  config,
  onChange,
  onSave,
  saving,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setMessage(null);
    setError(null);
    try {
      await onSave();
      setMessage("Guardamos los cambios. Recordá probarlo en tu tienda 🛒");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos guardar la configuración",
      );
    }
  }

  function updatePack(index: number, next: BundlePack) {
    const packs = [...config.packs];
    packs[index] = next;
    onChange({ ...config, packs });
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 className="section-title">Textos principales</h2>
        <div className="grid">
          <div>
            <label>Título del módulo</label>
            <input
              type="text"
              value={config.mainTitle}
              onChange={(event) =>
                onChange({ ...config, mainTitle: event.target.value })
              }
            />
          </div>
          <div>
            <label>Mensaje de ayuda</label>
            <input
              type="text"
              value={config.helpText}
              onChange={(event) =>
                onChange({ ...config, helpText: event.target.value })
              }
            />
          </div>
          <div className="grid two">
            <div>
              <label>Texto botón principal</label>
              <input
                type="text"
                value={config.buttonText}
                onChange={(event) =>
                  onChange({ ...config, buttonText: event.target.value })
                }
              />
            </div>
            <div>
              <label>Texto mientras agrega</label>
              <input
                type="text"
                value={config.addingText}
                onChange={(event) =>
                  onChange({ ...config, addingText: event.target.value })
                }
              />
            </div>
          </div>
          <div className="grid two">
            <div>
              <label>Mensaje de éxito</label>
              <input
                type="text"
                value={config.successMessage}
                onChange={(event) =>
                  onChange({ ...config, successMessage: event.target.value })
                }
              />
            </div>
            <div>
              <label>Error sin pack seleccionado</label>
              <input
                type="text"
                value={config.selectPackError}
                onChange={(event) =>
                  onChange({ ...config, selectPackError: event.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label>Error sin variantes</label>
            <input
              type="text"
              value={config.selectVariantsError}
              onChange={(event) =>
                onChange({ ...config, selectVariantsError: event.target.value })
              }
            />
          </div>
        </div>
      </div>

      {config.packs.map((pack, index) => (
        <PackRow
          key={index}
          pack={pack}
          index={index}
          onUpdate={(next) => updatePack(index, next)}
        />
      ))}

      <div className="card">
        <h2 className="section-title">Colores y badges</h2>
        <div className="grid two">
          <div>
            <label>Color primario</label>
            <input
              type="text"
              value={config.colors.primary}
              onChange={(event) =>
                onChange({
                  ...config,
                  colors: { ...config.colors, primary: event.target.value },
                })
              }
            />
          </div>
          <div>
            <label>Color hover primario</label>
            <input
              type="text"
              value={config.colors.primaryHover}
              onChange={(event) =>
                onChange({
                  ...config,
                  colors: { ...config.colors, primaryHover: event.target.value },
                })
              }
            />
          </div>
          <div>
            <label>Color éxito</label>
            <input
              type="text"
              value={config.colors.success}
              onChange={(event) =>
                onChange({
                  ...config,
                  colors: { ...config.colors, success: event.target.value },
                })
              }
            />
          </div>
        </div>
        <div className="grid two" style={{ marginTop: 16 }}>
          <div>
            <label>Envío gratis desde ($)</label>
            <input
              type="number"
              value={config.freeShippingThreshold}
              onChange={(event) =>
                onChange({
                  ...config,
                  freeShippingThreshold: Number(event.target.value),
                })
              }
            />
          </div>
          <div>
            <label>Texto badge envío gratis</label>
            <input
              type="text"
              value={config.freeShippingBadgeText}
              onChange={(event) =>
                onChange({
                  ...config,
                  freeShippingBadgeText: event.target.value,
                })
              }
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label>Ubicación complementarios</label>
          <select
            value={config.complementariesPosition}
            onChange={(event) =>
              onChange({
                ...config,
                complementariesPosition: event.target.value as
                  | "inside"
                  | "bottom",
              })
            }
          >
            <option value="bottom">Debajo del botón</option>
            <option value="inside">Dentro del pack</option>
          </select>
        </div>
      </div>

      <div className="card">
        <button
          type="button"
          className="primary"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Guardando…" : "Guardar bundle"}
        </button>
        {message && (
          <p style={{ color: "#047857", marginTop: 12, fontWeight: 600 }}>
            {message}
          </p>
        )}
        {error && (
          <p style={{ color: "#dc2626", marginTop: 12, fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
