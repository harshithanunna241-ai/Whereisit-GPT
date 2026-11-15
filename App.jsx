
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8765";

function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    room: "",
    specific_location: "",
    description: "",
  });

  const [selectedItem, setSelectedItem] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [detections, setDetections] = useState([]);
  const [recognitionError, setRecognitionError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/items/`);

      if (!response.ok) {
        throw new Error("Unable to load belongings.");
      }

      const data = await response.json();
      const savedItems = normalizeItems(data);

      setItems(savedItems);

      setSelectedItem((current) => {
        if (
          current &&
          savedItems.some((item) => String(item.id) === String(current))
        ) {
          return String(current);
        }
        return "";
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (page === "AI Recognition") {
      loadItems();
    }
  }, [page]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [
        item.name,
        item.category,
        item.room,
        item.specific_location,
        item.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [items, search]);

  const roomsCount = new Set(
    items.map((item) => item.room).filter(Boolean)
  ).size;

  const categoriesCount = new Set(
    items.map((item) => item.category).filter(Boolean)
  ).size;

  async function handleAddItem(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setForm({
        name: "",
        category: "",
        room: "",
        specific_location: "",
        description: "",
      });

      setShowAddForm(false);
      await loadItems();
      setPage("My Belongings");
    } catch (err) {
      setError(err.message || "Unable to save belonging.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this belonging?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete belonging.");
      }

      setItems((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );

      if (String(selectedItem) === String(id)) {
        setSelectedItem("");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPhoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : "");
    setDetections([]);
    setRecognitionError("");
  }

  async function handleRecognition() {
    setRecognitionError("");
    setDetections([]);

    if (!selectedItem) {
      setRecognitionError("Please select a saved belonging.");
      return;
    }

    if (!photo) {
      setRecognitionError("Please upload a photo.");
      return;
    }

    const selected = items.find(
      (item) => String(item.id) === String(selectedItem)
    );

    if (!selected) {
      setRecognitionError("Selected belonging not found. Refresh the list.");
      return;
    }

    setRecognizing(true);

    try {
      const formData = new FormData();
      formData.append("file", photo);

      const response = await fetch(
        `${API_URL}/items/${selected.id}/photo`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.detail || result.message || "Recognition failed."
        );
      }

      setDetections(
        Array.isArray(result.detections) ? result.detections : []
      );

      await loadItems();
    } catch (err) {
      setRecognitionError(err.message);
    } finally {
      setRecognizing(false);
    }
  }

  function renderDashboard() {
    return (
      <>
        <div className="topbar">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Dashboard</h1>
            <p className="subtitle">
              Welcome to your personal belongings space.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowAddForm(true)}
          >
            + Add New Item
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">▣</div>
            <p>Total Belongings</p>
            <h2>{items.length}</h2>
            <small>Items saved in your space</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">⌂</div>
            <p>Rooms Tracked</p>
            <h2>{roomsCount}</h2>
            <small>Different rooms recorded</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">▦</div>
            <p>Categories</p>
            <h2>{categoriesCount}</h2>
            <small>Belonging categories</small>
          </div>
        </div>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>My Belongings</h2>
              <p>Recently added items and their saved locations.</p>
            </div>
            <span className="item-count">{items.length} Items</span>
          </div>

          {loading ? (
            <div className="empty-state">Loading your belongings...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▣</div>
              <h3>Your space is waiting!</h3>
              <p>Add your first belonging to get started.</p>
              <button
                className="primary-button"
                onClick={() => setShowAddForm(true)}
              >
                + Add Belonging
              </button>
            </div>
          ) : (
            <div className="items-grid">
              {items.slice(0, 4).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {items.length > 4 && (
            <button
              className="text-button"
              onClick={() => setPage("My Belongings")}
            >
              View all belongings →
            </button>
          )}
        </section>
      </>
    );
  }

  function renderBelongings() {
    return (
      <>
        <div className="topbar">
          <div>
            <p className="eyebrow">YOUR PERSONAL SPACE</p>
            <h1>My Belongings</h1>
            <p className="subtitle">
              Manage and find your belongings.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowAddForm(true)}
          >
            + Add New Item
          </button>
        </div>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>All Belongings</h2>
              <p>Search your saved belongings and their locations.</p>
            </div>
            <span className="item-count">{filteredItems.length} Items</span>
          </div>

          <div className="search-box">
            <span>⌕</span>
            <input
              placeholder="Search belongings, rooms or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              No matching belongings found.
            </div>
          ) : (
            <div className="items-grid">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderFindItem() {
    return (
      <>
        <div className="topbar">
          <div>
            <p className="eyebrow">SMART SEARCH</p>
            <h1>Find an Item</h1>
            <p className="subtitle">
              Find where you last kept your belongings.
            </p>
          </div>
        </div>

        <section className="panel">
          <div className="search-box">
            <span>⌕</span>
            <input
              placeholder="Where did I keep my keys?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              No matching belongings found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div className="location-result" key={item.id}>
                <h3>{item.name}</h3>
                <p>{item.category || "Uncategorized"}</p>
                <p>
                  <strong>Room:</strong> {item.room || "Not specified"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {item.specific_location || "Not specified"}
                </p>
                {item.description && <p>{item.description}</p>}
              </div>
            ))
          )}
        </section>
      </>
    );
  }

  function renderRecognition() {
    return (
      <>
        <div className="topbar">
          <div>
            <p className="eyebrow">YOLO AI</p>
            <h1>AI Recognition</h1>
            <p className="subtitle">
              Upload a photo and let YOLO identify visible objects in it.
            </p>
          </div>

          <button className="primary-button" onClick={loadItems}>
            ↻ Refresh Belongings
          </button>
        </div>

        <section className="panel recognition-panel">
          <div className="section-heading">
            <div>
              <h2>AI Object Recognition</h2>
              <p>Select a saved belonging and upload a photo for detection.</p>
            </div>
          </div>

          <div className="recognition-form">
            <label className="field-label" htmlFor="saved-item">
              Select a saved belonging
            </label>

            <select
              id="saved-item"
              className="recognition-input"
              value={selectedItem}
              onChange={(e) => {
                setSelectedItem(e.target.value);
                setDetections([]);
                setRecognitionError("");
              }}
            >
              <option value="">Choose an item</option>
              {items.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name} (ID: {item.id})
                </option>
              ))}
            </select>

            {selectedItem && (
              <p className="selected-item">
                Selected belonging:{" "}
                <strong>
                  {items.find(
                    (item) => String(item.id) === String(selectedItem)
                  )?.name}
                </strong>
              </p>
            )}

            <label className="field-label" htmlFor="recognition-photo">
              Upload a photo
            </label>

            <input
              id="recognition-photo"
              className="recognition-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />

            {preview && (
              <div className="photo-preview-container">
                <img src={preview} alt="Selected belonging" />
                <p>{photo?.name}</p>
              </div>
            )}

            <button
              className="primary-button recognition-button"
              onClick={handleRecognition}
              disabled={recognizing || !items.length}
            >
              {recognizing ? "Analyzing Photo..." : "Upload and Recognize"}
            </button>

            {recognitionError && (
              <div className="alert error">{recognitionError}</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Detection Results</h2>
              <p>Objects detected by the YOLO model.</p>
            </div>
            <span className="item-count">
              {detections.length} Detections
            </span>
          </div>

          {recognizing ? (
            <div className="empty-state">
              Analyzing your photo...
            </div>
          ) : detections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✧</div>
              <h3>No detection results yet</h3>
              <p>Upload a photo to begin.</p>
            </div>
          ) : (
            <div className="detection-list">
              {detections.map((detection, index) => (
                <div className="detection-row" key={index}>
                  <div>
                    <strong>
                      {detection.object || detection.class || "Object"}
                    </strong>
                    <p>Detected object</p>
                  </div>
                  <span>
                    {(Number(detection.confidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="helper-text">
            AI detects visible objects in the uploaded image. It does not
            independently determine where an item is stored. The pretrained
            COCO model may not recognize every type of belonging.
          </p>
        </section>
      </>
    );
  }

  function renderAddForm() {
    return (
      <div className="modal-overlay">
        <div className="panel form-panel add-modal">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR PERSONAL SPACE</p>
              <h2>Add a Belonging</h2>
              <p>Save where you keep your item.</p>
            </div>
            <button
              className="close-button"
              onClick={() => setShowAddForm(false)}
            >
              ✕
            </button>
          </div>

          <form className="item-form" onSubmit={handleAddItem}>
            <label>
              Item name *
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Example: House Keys"
              />
            </label>

            <label>
              Category
              <input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                placeholder="Personal Accessories"
              />
            </label>

            <label>
              Room
              <input
                value={form.room}
                onChange={(e) =>
                  setForm({ ...form, room: e.target.value })
                }
                placeholder="Bedroom"
              />
            </label>

            <label>
              Specific location
              <input
                value={form.specific_location}
                onChange={(e) =>
                  setForm({
                    ...form,
                    specific_location: e.target.value,
                  })
                }
                placeholder="Top drawer of study table"
              />
            </label>

            <label className="full-width">
              Description
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe your belonging..."
              />
            </label>

            {error && (
              <div className="alert error full-width">{error}</div>
            )}

            <button className="primary-button" type="submit">
              Save Belonging
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", icon: "▦" },
    { name: "My Belongings", icon: "▣" },
    { name: "Find an Item", icon: "⌕" },
    { name: "AI Recognition", icon: "✧" },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">W</div>
          <div>
            <h2>WhereIsIt<span>GPT</span></h2>
            <small>YOUR PERSONAL SPACE</small>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="navigation">
          {navigation.map((nav) => (
            <button
              key={nav.name}
              className={`nav-item ${page === nav.name ? "active" : ""}`}
              onClick={() => {
                setPage(nav.name);
                setSearch("");
                setError("");
              }}
            >
              <span>{nav.icon}</span>
              {nav.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span>✧</span>
            <strong>Never lose track again!</strong>
            <p>Keep your important belongings organized in one place.</p>
          </div>
          <p className="version">WhereIsItGPT · Personal Space</p>
        </div>
      </aside>

      <main className="main-content">
        {error && (
          <div className="alert error">{error}</div>
        )}

        {page === "Dashboard" && renderDashboard()}
        {page === "My Belongings" && renderBelongings()}
        {page === "Find an Item" && renderFindItem()}
        {page === "AI Recognition" && renderRecognition()}

        <footer>WhereIsItGPT · Your Personal Space</footer>
      </main>

      {showAddForm && renderAddForm()}
    </div>
  );
}

function ItemCard({ item, onDelete }) {
  return (
    <div className="item-card">
      <div className="item-visual">▣</div>

      <div className="item-details">
        <div className="item-title-row">
          <h3>{item.name}</h3>
          <button
            className="delete-button"
            onClick={() => onDelete(item.id)}
            title="Delete item"
          >
            ×
          </button>
        </div>

        <span className="category-tag">
          {item.category || "Uncategorized"}
        </span>

        <p>⌂ {item.room || "Room not specified"}</p>
        <p>⌖ {item.specific_location || "Location not specified"}</p>

        {item.description && (
          <p className="description">{item.description}</p>
        )}
      </div>
    </div>
  );
}
