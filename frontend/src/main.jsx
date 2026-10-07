import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  UtensilsCrossed,
  LayoutGrid,
  ChefHat,
  ReceiptText,
  ChartNoAxesCombined,
  BookOpen,
  Search,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  X,
  Check,
  Leaf,
  ShoppingBag,
  Printer,
  RefreshCw,
  Clock,
  SlidersHorizontal,
  Download,
  CheckCircle2,
} from "lucide-react";
import { api, money } from "./api";
import "./styles.css";

const categories = [
  "All items",
  "Starters",
  "Mains",
  "Breads",
  "Beverages",
  "Desserts",
];
const tabs = [
  ["Order desk", UtensilsCrossed],
  ["Tables", LayoutGrid],
  ["Kitchen", ChefHat],
  ["Billing", ReceiptText],
  ["Insights", ChartNoAxesCombined],
  ["Menu studio", BookOpen],
];
const pretty = (s) => s?.replaceAll("_", " ").toLowerCase();
function App() {
  const [page, setPage] = useState("Order desk"),
    [menu, setMenu] = useState([]),
    [tables, setTables] = useState([]),
    [orders, setOrders] = useState([]),
    [bills, setBills] = useState([]),
    [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("All items"),
    [query, setQuery] = useState(""),
    [veg, setVeg] = useState(false),
    [cart, setCart] = useState([]),
    [table, setTable] = useState(""),
    [type, setType] = useState("DINE_IN"),
    [customer, setCustomer] = useState(""),
    [notes, setNotes] = useState("");
  const [assistant, setAssistant] = useState(null),
    [aiText, setAiText] = useState(""),
    [aiBusy, setAiBusy] = useState(false),
    [receipt, setReceipt] = useState(null),
    [edit, setEdit] = useState(null),
    [discount, setDiscount] = useState(0),
    [checkout, setCheckout] = useState(null);
  const requestKey = useRef(crypto.randomUUID());
  const mutation = useRef(false);
  async function refresh() {
    try {
      const [m, t, o, b, s] = await Promise.all(
        [
          "/menu",
          "/tables",
          "/orders",
          "/bills",
          "/analytics/sales-summary",
        ].map((p) => api(p)),
      );
      setMenu(m);
      setTables(t);
      setOrders(o);
      setBills(b);
      setStats(s);
      setConnected(true);
      setLoaded(true);
    } catch (e) {
      setConnected(false);
      setLoaded(true);
    }
  }
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  async function act(fn, success) {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
      if (success) setToast(success);
    } catch (e) {
      setError(e.message);
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  function add(m, q = 1) {
    if (!m?.available || m.stock < 1) return;
    requestKey.current = crypto.randomUUID();
    setCart((c) => {
      const old = c.find((i) => i.id === m.id);
      const qty = Math.min((old?.quantity || 0) + q, m.stock, 99);
      return old
        ? c.map((i) => (i.id === m.id ? { ...i, quantity: qty } : i))
        : [...c, { ...m, quantity: qty }];
    });
  }
  function change(id, n) {
    requestKey.current = crypto.randomUUID();
    setCart((c) =>
      c
        .map((i) =>
          i.id === id
            ? {
                ...i,
                quantity: Math.min(
                  i.quantity + n,
                  menu.find((m) => m.id === id)?.stock || 0,
                  99,
                ),
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }
  const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0),
    active = orders.filter(
      (o) => !["CANCELLED", "COMPLETED"].includes(o.status),
    );
  async function place() {
    await act(async () => {
      const o = await api("/orders", "POST", {
        requestKey: requestKey.current,
        tableId: type === "DINE_IN" ? Number(table) || null : null,
        orderType: type,
        customer,
        notes,
        items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
      });
      setCart([]);
      setNotes("");
      setCustomer("");
      setTable("");
      setAssistant(null);
      requestKey.current = crypto.randomUUID();
      setToast(`Order #${o.id} sent to the kitchen`);
    });
  }
  async function ask(text = "") {
    setAiBusy(true);
    setError("");
    try {
      setAssistant(
        await api("/assistant", "POST", {
          text,
          itemIds: cart.map((i) => i.id),
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setAiBusy(false);
    }
  }
  function csv() {
    const rows = [
      [
        "Bill",
        "Order",
        "Paid at",
        "Method",
        "Subtotal",
        "Discount",
        "Tax",
        "Total",
      ],
      ...bills
        .filter((b) => b.paymentStatus === "PAID")
        .map((b) => [
          b.id,
          b.order.id,
          b.paidAt,
          b.paymentMethod,
          b.subtotal,
          b.discount,
          b.taxAmount,
          b.total,
        ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "table-thyme-sales.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const menuList = menu.filter(
    (m) =>
      (category === "All items" || m.category === category) &&
      (!veg || m.vegetarian) &&
      m.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <UtensilsCrossed size={23} />
          </div>
          <div>
            Table <i>&</i> Thyme<small>RESTAURANT WORKSPACE</small>
          </div>
        </div>
        <div className="workspace">
          <span className="restaurant-avatar">T</span>
          <div>
            The Thyme Kitchen<small>Hyderabad · Main branch</small>
          </div>
          <span className="online-dot" />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {tabs.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "nav-item active" : "nav-item"}
              onClick={() => setPage(name)}
            >
              <Icon size={19} />
              {name}
              {name === "Kitchen" && active.length > 0 && (
                <b>{active.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={22} />
          <strong>Good food. Smooth service.</strong>
          <p>
            A little less admin.
            <br />A little more hospitality.
          </p>
        </div>
        <div className="profile">
          <span>AK</span>
          <div>
            Adithya Kumar<small>Restaurant manager</small>
          </div>
          <span className="profile-dot" />
        </div>
      </aside>
      <div className="main-shell">
        <header>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{page}</strong>
          </div>
          <div className="header-right">
            <span className={"connection " + (connected ? "" : "offline")}>
              <i />
              {connected ? "Live workspace" : "Backend offline"}
            </span>
            <span className="today">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              className="icon-btn"
              aria-label="Refresh workspace"
              onClick={refresh}
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">THE THYME KITCHEN</div>
              <h1>
                {page === "Order desk"
                  ? "A great meal starts here."
                  : page === "Tables"
                    ? "A seat for every story."
                    : page === "Kitchen"
                      ? "Fresh orders. Perfect timing."
                      : page === "Billing"
                        ? "The finishing touch."
                        : page === "Insights"
                          ? "Your restaurant, in perspective."
                          : "Made for your menu."}
              </h1>
              <p>
                {page === "Order desk"
                  ? "Take an order, find the perfect pairing, and send a little joy to the kitchen."
                  : page === "Tables"
                    ? "Keep your floor moving, one table at a time."
                    : page === "Kitchen"
                      ? "A live view from first ticket to final plate."
                      : page === "Billing"
                        ? "Review orders, settle bills, and keep every receipt in one place."
                        : page === "Insights"
                          ? "Real sales, clear insights, and better decisions."
                          : "Thoughtful dishes. Up-to-date prices. Stock you can count on."}
              </p>
            </div>
            <div className="open-pill">
              <span /> Service is open
            </div>
          </div>
          {!connected && loaded && (
            <div className="offline-banner">
              Cannot reach Spring Boot. Start MySQL and the backend, then
              refresh. Orders are only saved when the backend confirms them.
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {!loaded ? (
            <div className="empty">Connecting to your restaurant…</div>
          ) : (
            <>
              {page === "Order desk" && (
                <>
                  <section className="stat-strip">
                    <Mini
                      label="Today's sales"
                      value={money(stats?.todayRevenue)}
                      icon={<ChartNoAxesCombined />}
                    />
                    <Mini
                      label="Active orders"
                      value={String(active.length).padStart(2, "0")}
                      icon={<ChefHat />}
                    />
                    <Mini
                      label="Available tables"
                      value={`${tables.filter((t) => t.status === "AVAILABLE").length} / ${tables.length}`}
                      icon={<LayoutGrid />}
                    />
                    <Mini
                      label="Orders completed today"
                      value={String(stats?.todayOrders || 0).padStart(2, "0")}
                      icon={<CheckCircle2 />}
                    />
                  </section>
                  <div className="desk">
                    <section className="menu-section">
                      <div className="section-row">
                        <div>
                          <h2>
                            Explore the menu{" "}
                            <span className="count">{menu.length} dishes</span>
                          </h2>
                          <p className="muted">
                            Fresh favourites, ready to serve.
                          </p>
                        </div>
                        <label className="search">
                          <Search size={17} />
                          <input
                            aria-label="Search dishes"
                            placeholder="Search a dish…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                          <span>⌕</span>
                        </label>
                      </div>
                      <div className="filter-row">
                        <div className="categories">
                          {categories.map((c) => (
                            <button
                              key={c}
                              className={c === category ? "selected" : ""}
                              onClick={() => setCategory(c)}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <button
                          className={"veg-filter " + (veg ? "selected" : "")}
                          onClick={() => setVeg(!veg)}
                        >
                          <Leaf size={14} /> Veg only
                        </button>
                      </div>
                      <div className="menu-grid">
                        {menuList.map((m) => (
                          <article
                            className={
                              "food-card " +
                              (!m.available || !m.stock ? "unavailable" : "")
                            }
                            key={m.id}
                          >
                            <div
                              className={"food-art " + m.category.toLowerCase()}
                            >
                              <div className="plate">
                                <span>{m.emoji}</span>
                              </div>
                              <span
                                className={
                                  "diet " +
                                  (m.vegetarian ? "vegetarian" : "nonveg")
                                }
                              >
                                <i />
                              </span>
                              {m.stock < 10 && (
                                <span className="stock-badge">
                                  {m.stock ? `${m.stock} left` : "Sold out"}
                                </span>
                              )}
                              <span className="art-category">{m.category}</span>
                            </div>
                            <div className="food-body">
                              <h3>{m.name}</h3>
                              <p>{m.description}</p>
                              <div className="food-bottom">
                                <strong>{money(m.price)}</strong>
                                <button
                                  disabled={
                                    !connected ||
                                    !m.available ||
                                    m.stock === 0 ||
                                    cart.some(
                                      (i) =>
                                        i.id === m.id && i.quantity >= m.stock,
                                    )
                                  }
                                  onClick={() => add(m)}
                                  aria-label={`Add ${m.name}`}
                                >
                                  <Plus size={17} />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      {!menuList.length && (
                        <div className="empty">
                          No dishes found. Try another search or category.
                        </div>
                      )}
                      <div className="menu-footer">
                        <Leaf size={14} /> Thoughtfully prepared. Happily
                        served.
                        <span>Prices in INR · 5% demo tax at checkout</span>
                      </div>
                    </section>
                    <aside className="cart-panel">
                      <div className="cart-title">
                        <div>
                          <h2>Current order</h2>
                          <p>
                            {cart.reduce((s, i) => s + i.quantity, 0)} items in
                            this order
                          </p>
                        </div>
                        <span className="bag-icon">
                          <ShoppingBag size={20} />
                        </span>
                      </div>
                      <div className="segmented">
                        <button
                          className={type === "DINE_IN" ? "selected" : ""}
                          onClick={() => setType("DINE_IN")}
                        >
                          Dine-in
                        </button>
                        <button
                          className={type === "TAKEAWAY" ? "selected" : ""}
                          onClick={() => setType("TAKEAWAY")}
                        >
                          Takeaway
                        </button>
                      </div>
                      <div className="cart-fields">
                        {type === "DINE_IN" && (
                          <label>
                            TABLE
                            <select
                              value={table}
                              onChange={(e) => setTable(e.target.value)}
                            >
                              <option value="">Select a table</option>
                              {tables
                                .filter((t) => t.status === "AVAILABLE")
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    Table {String(t.id).padStart(2, "0")} ·{" "}
                                    {t.seats} seats
                                  </option>
                                ))}
                            </select>
                          </label>
                        )}
                        <label>
                          GUEST NAME
                          <input
                            value={customer}
                            maxLength={80}
                            onChange={(e) => setCustomer(e.target.value)}
                            placeholder="Optional"
                          />
                        </label>
                      </div>
                      <div className="cart-items">
                        {!cart.length ? (
                          <div className="cart-empty">
                            <UtensilsCrossed size={30} />
                            <strong>Something delicious awaits</strong>
                            <p>
                              Add dishes from the menu
                              <br />
                              to start your order.
                            </p>
                          </div>
                        ) : (
                          cart.map((i) => (
                            <div className="cart-line" key={i.id}>
                              <div className="cart-emoji">{i.emoji}</div>
                              <div className="cart-item-info">
                                <strong>{i.name}</strong>
                                <small>{money(i.price)}</small>
                                <div className="quantity">
                                  <button
                                    aria-label={`Decrease ${i.name}`}
                                    onClick={() => change(i.id, -1)}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span>{i.quantity}</span>
                                  <button
                                    aria-label={`Increase ${i.name}`}
                                    onClick={() => change(i.id, 1)}
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                              <strong>{money(i.price * i.quantity)}</strong>
                            </div>
                          ))
                        )}
                      </div>
                      <label className="notes-label">
                        Kitchen notes
                        <textarea
                          maxLength={500}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Less spicy, allergies, special requests…"
                          rows={2}
                        />
                      </label>
                      <div className="assistant-card">
                        <div>
                          <Sparkles size={17} />
                          <strong>A little help from Thyme</strong>
                        </div>
                        <p>Find a pairing or turn a sentence into an order.</p>
                        <div className="assistant-input">
                          <input
                            aria-label="Quick order text"
                            value={aiText}
                            onChange={(e) => setAiText(e.target.value)}
                            placeholder="2 Hyderabadi Biryani…"
                          />
                          <button
                            disabled={aiBusy || !connected || !aiText.trim()}
                            onClick={() => ask(aiText)}
                            aria-label="Parse quick order"
                          >
                            <ArrowRight size={16} />
                          </button>
                        </div>
                        <button
                          className="text-btn"
                          disabled={aiBusy || !connected}
                          onClick={() => ask()}
                        >
                          {aiBusy ? "Thinking…" : "Suggest a perfect pairing"}{" "}
                          <ArrowUpRight size={14} />
                        </button>
                        {assistant && (
                          <div className="ai-result">
                            <span className="mode">
                              {assistant.mode === "GEMINI"
                                ? "Gemini AI"
                                : "Local rules"}
                            </span>
                            <p>{assistant.message}</p>
                            {assistant.items.map((i, n) => {
                              const m = menu.find((m) => m.id === i.menuItemId);
                              return (
                                m && (
                                  <button
                                    key={n}
                                    onClick={() => add(m, i.quantity)}
                                  >
                                    {i.quantity} × {m.name}
                                    <Plus size={14} />
                                  </button>
                                )
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="totals">
                        <div>
                          <span>Subtotal</span>
                          <span>{money(subtotal)}</span>
                        </div>
                        <div>
                          <span>Estimated tax (5%)</span>
                          <span>{money(Math.round(subtotal * 5) / 100)}</span>
                        </div>
                        <div className="grand-total">
                          <strong>Estimated total</strong>
                          <strong>
                            {money(subtotal + Math.round(subtotal * 5) / 100)}
                          </strong>
                        </div>
                      </div>
                      <button
                        className="primary place-order"
                        disabled={
                          busy ||
                          !connected ||
                          !cart.length ||
                          (type === "DINE_IN" && !table)
                        }
                        onClick={place}
                      >
                        {busy ? "Sending…" : "Send to kitchen"}
                        <ArrowRight size={17} />
                      </button>
                      <p className="cart-footnote">
                        Final bill generated after serving.
                      </p>
                    </aside>
                  </div>
                </>
              )}
              {page === "Tables" && (
                <>
                  <div className="section-row">
                    <h2>
                      Floor overview <span className="count">8 tables</span>
                    </h2>
                    <div className="legend">
                      Available <i className="green-dot" /> Occupied{" "}
                      <i className="orange-dot" /> Billing{" "}
                      <i className="purple-dot" />
                    </div>
                  </div>
                  <div className="table-grid">
                    {tables.map((t) => {
                      const o = active.find((o) => o.diningTable?.id === t.id);
                      return (
                        <button
                          key={t.id}
                          className={"table-card " + t.status.toLowerCase()}
                          onClick={() => {
                            if (t.status === "AVAILABLE") {
                              setTable(String(t.id));
                              setType("DINE_IN");
                              setPage("Order desk");
                            } else
                              setPage(
                                t.status === "BILLING" ? "Billing" : "Kitchen",
                              );
                          }}
                        >
                          <div>
                            <span>{t.zone}</span>
                            <Status value={t.status} />
                          </div>
                          <div className="table-shape">
                            <span />
                            <strong>{String(t.id).padStart(2, "0")}</strong>
                            <span />
                          </div>
                          <h3>Table {String(t.id).padStart(2, "0")}</h3>
                          <p>
                            {t.seats} seats{" "}
                            {o ? `· Order #${o.id}` : "· Ready for guests"}
                          </p>
                          <span className="table-action">
                            {o ? "View order" : "Start an order"}
                            <ArrowUpRight size={16} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {page === "Kitchen" && (
                <div className="kitchen-board">
                  {["RECEIVED", "PREPARING", "SERVED"].map((stage) => (
                    <section key={stage}>
                      <h2>
                        <span className={"stage-dot " + stage.toLowerCase()} />
                        {pretty(stage)}{" "}
                        <span className="count">
                          {orders.filter((o) => o.status === stage).length}
                        </span>
                      </h2>
                      {orders
                        .filter((o) => o.status === stage)
                        .map((o) => (
                          <article className="ticket" key={o.id}>
                            <div className="section-row">
                              <strong>
                                Order #{String(o.id).padStart(3, "0")}
                              </strong>
                              <span className="ticket-table">
                                {o.diningTable
                                  ? `Table ${o.diningTable.id}`
                                  : "Takeaway"}
                              </span>
                            </div>
                            <p className="ticket-time">
                              <Clock size={13} />
                              {new Date(o.createdAt).toLocaleTimeString(
                                "en-IN",
                                { hour: "2-digit", minute: "2-digit" },
                              )}{" "}
                              · {o.customer || "Guest"}
                            </p>
                            <div className="ticket-lines">
                              {o.items.map((i) => (
                                <div key={i.id}>
                                  <b>{i.quantity}×</b>
                                  <span>{i.name}</span>
                                </div>
                              ))}
                            </div>
                            {o.notes && (
                              <p className="kitchen-note">{o.notes}</p>
                            )}
                            <button
                              className="primary"
                              disabled={busy}
                              onClick={() =>
                                stage === "SERVED"
                                  ? (setCheckout(o), setDiscount(0))
                                  : act(
                                      () =>
                                        api(`/orders/${o.id}/status`, "PATCH", {
                                          status:
                                            stage === "RECEIVED"
                                              ? "PREPARING"
                                              : "SERVED",
                                        }),
                                      "Order updated",
                                    )
                              }
                            >
                              {stage === "RECEIVED"
                                ? "Start preparing"
                                : stage === "PREPARING"
                                  ? "Mark as served"
                                  : "Generate bill"}
                              <ArrowRight size={15} />
                            </button>
                            {stage !== "SERVED" && (
                              <button
                                className="cancel-btn"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Cancel order #${o.id}? Stock will be restored.`,
                                    )
                                  )
                                    act(
                                      () =>
                                        api(`/orders/${o.id}/status`, "PATCH", {
                                          status: "CANCELLED",
                                        }),
                                      "Order cancelled; stock restored",
                                    );
                                }}
                              >
                                Cancel order
                              </button>
                            )}
                          </article>
                        ))}
                      {!orders.some((o) => o.status === stage) && (
                        <div className="board-empty">
                          <ChefHat size={25} />
                          <p>No {pretty(stage)} orders</p>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              )}
              {page === "Billing" && (
                <>
                  <section className="stat-strip">
                    <Mini
                      label="Awaiting billing"
                      value={orders.filter((o) => o.status === "SERVED").length}
                      icon={<ReceiptText />}
                    />
                    <Mini
                      label="Pending payments"
                      value={
                        bills.filter((b) => b.paymentStatus === "PENDING")
                          .length
                      }
                      icon={<Clock />}
                    />
                    <Mini
                      label="Paid receipts"
                      value={
                        bills.filter((b) => b.paymentStatus === "PAID").length
                      }
                      icon={<CheckCircle2 />}
                    />
                    <Mini
                      label="Total paid revenue"
                      value={money(stats?.revenue)}
                      icon={<ChartNoAxesCombined />}
                    />
                  </section>
                  {orders.some((o) => o.status === "SERVED") && (
                    <div className="ready-bills">
                      <h2>Ready to bill</h2>
                      {orders
                        .filter((o) => o.status === "SERVED")
                        .map((o) => (
                          <div key={o.id}>
                            <span>
                              Order #{o.id} ·{" "}
                              {o.diningTable
                                ? `Table ${o.diningTable.id}`
                                : "Takeaway"}
                            </span>
                            <button
                              className="secondary"
                              onClick={() => {
                                setCheckout(o);
                                setDiscount(0);
                              }}
                            >
                              Generate bill <ArrowRight size={15} />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="panel">
                    <div className="section-row">
                      <h2>Receipts & payments</h2>
                      <button className="secondary" onClick={csv}>
                        <Download size={15} /> Export paid sales
                      </button>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Receipt</th>
                            <th>Order / Guest</th>
                            <th>Issued</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {bills.map((b) => (
                            <tr key={b.id}>
                              <td>
                                <strong>
                                  TT-{String(b.id).padStart(5, "0")}
                                </strong>
                              </td>
                              <td>
                                #{b.order.id} · {b.order.customer || "Guest"}
                              </td>
                              <td>
                                {new Date(b.generatedAt).toLocaleString(
                                  "en-IN",
                                )}
                              </td>
                              <td>
                                <strong>{money(b.total)}</strong>
                              </td>
                              <td>
                                <Status value={b.paymentStatus} />
                              </td>
                              <td>
                                <button
                                  className="text-btn"
                                  onClick={() => setReceipt(b)}
                                >
                                  {b.paymentStatus === "PENDING"
                                    ? "Settle bill"
                                    : "View receipt"}
                                  <ArrowUpRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!bills.length && (
                      <div className="empty">
                        <ReceiptText />
                        <h3>Your first receipt starts with an order.</h3>
                        <p>
                          Serve an order in the kitchen, then generate its bill.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
              {page === "Insights" && (
                <>
                  <section className="stat-strip">
                    <Mini
                      label="Total revenue"
                      value={money(stats?.revenue)}
                      icon={<ChartNoAxesCombined />}
                    />
                    <Mini
                      label="Paid orders"
                      value={stats?.paidOrders || 0}
                      icon={<ReceiptText />}
                    />
                    <Mini
                      label="Average bill"
                      value={money(stats?.averageBill)}
                      icon={<ShoppingBag />}
                    />
                    <Mini
                      label="Today's revenue"
                      value={money(stats?.todayRevenue)}
                      icon={<ArrowUpRight />}
                    />
                  </section>
                  <div className="insights-grid">
                    <section className="panel">
                      <div className="section-row">
                        <h2>Revenue over time</h2>
                        <span className="count">Last 7 days</span>
                      </div>
                      <p className="muted">Settled bills only · INR</p>
                      <div className="bar-chart">
                        {stats?.trend.map((d) => (
                          <div className="chart-column" key={d.date}>
                            <small>{money(d.revenue)}</small>
                            <div className="chart-track">
                              <div
                                style={{
                                  height: `${Number(d.revenue) ? Math.max(4, (Number(d.revenue) / Math.max(...stats.trend.map((x) => Number(x.revenue)), 1)) * 100) : 0}%`,
                                }}
                              />
                            </div>
                            <span>
                              {new Date(
                                d.date + "T12:00:00",
                              ).toLocaleDateString("en-IN", {
                                weekday: "short",
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="panel">
                      <h2>Guest favourites</h2>
                      <p className="muted">Ranked by portions in paid orders</p>
                      {stats?.popular.map((p, i) => (
                        <div className="popular" key={p.name}>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          <strong>{p.name}</strong>
                          <b>
                            {p.quantity}
                            <small> sold</small>
                          </b>
                        </div>
                      ))}
                      {!stats?.popular.length && (
                        <div className="empty">
                          Complete your first payment to see favourites.
                        </div>
                      )}
                    </section>
                    <section className="panel">
                      <h2>Stock watch</h2>
                      <p className="muted">
                        Items with fewer than 10 portions available
                      </p>
                      {stats?.lowStock.map((m) => (
                        <div className="popular" key={m.id}>
                          <span>{m.emoji}</span>
                          <strong>{m.name}</strong>
                          <b className="low-stock">{m.stock} left</b>
                        </div>
                      ))}
                      {!stats?.lowStock.length && (
                        <p>All dishes are well stocked.</p>
                      )}
                    </section>
                    <section className="insight-note">
                      <Sparkles size={26} />
                      <div className="eyebrow">SERVICE NOTES · RULE-BASED</div>
                      <h2>
                        Small insights.
                        <br />
                        Better service.
                      </h2>
                      <p>
                        {stats?.paidOrders
                          ? `Your average paid bill is ${money(stats.averageBill)}. ${stats.popular[0]?.name || "Your dishes"} leads your sales. Use pairing suggestions to introduce guests to more of your menu.`
                          : "Your story starts with the first order. Once a bill is paid, revenue and guest favourites appear here automatically."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => setPage("Order desk")}
                      >
                        Back to the order desk
                        <ArrowUpRight size={15} />
                      </button>
                    </section>
                  </div>
                </>
              )}
              {page === "Menu studio" && (
                <div className="panel">
                  <div className="section-row">
                    <div>
                      <h2>Your menu, your way</h2>
                      <p className="muted">
                        Edit prices, availability and remaining portions.
                      </p>
                    </div>
                    <button
                      className="primary"
                      onClick={() =>
                        setEdit({
                          name: "",
                          category: "Mains",
                          description: "",
                          price: 100,
                          vegetarian: true,
                          available: true,
                          stock: 20,
                          emoji: "🍽️",
                        })
                      }
                    >
                      <Plus size={16} /> Add a dish
                    </button>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Dish</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Availability</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {menu.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <span className="row-emoji">{m.emoji}</span>
                              <strong>{m.name}</strong>
                            </td>
                            <td>{m.category}</td>
                            <td>{money(m.price)}</td>
                            <td>{m.stock} portions</td>
                            <td>
                              <Status
                                value={m.available ? "AVAILABLE" : "HIDDEN"}
                              />
                            </td>
                            <td>
                              <button
                                className="text-btn"
                                onClick={() => setEdit({ ...m })}
                              >
                                Edit <SlidersHorizontal size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          <footer>
            TABLE & THYME <span>Made for the art of hospitality.</span>
            <small>React · Spring Boot · MySQL</small>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
      {checkout && (
        <Modal
          title={`Bill for order #${checkout.id}`}
          close={() => setCheckout(null)}
        >
          <p className="muted">
            Prices are taken from the saved order. Tax is 5% after discount.
          </p>
          <label className="form-label">
            Discount percentage
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </label>
          <button
            className="primary full"
            disabled={
              busy ||
              discount === "" ||
              Number(discount) < 0 ||
              Number(discount) > 100
            }
            onClick={() =>
              act(async () => {
                const b = await api(`/bills/generate/${checkout.id}`, "POST", {
                  discountPercent: Number(discount),
                });
                setReceipt(b);
                setCheckout(null);
              }, "Bill generated")
            }
          >
            Generate final bill
            <ReceiptText size={17} />
          </button>
        </Modal>
      )}
      {receipt && (
        <Modal title="Digital receipt" close={() => setReceipt(null)} receipt>
          <div className="receipt-paper">
            <div className="receipt-brand">
              <UtensilsCrossed />
              <h2>Table & Thyme</h2>
              <p>The Thyme Kitchen · Hyderabad</p>
              <small>ACADEMIC DEMO RECEIPT</small>
            </div>
            <div className="receipt-meta">
              <strong>TT-{String(receipt.id).padStart(5, "0")}</strong>
              <Status value={receipt.paymentStatus} />
              <p>{new Date(receipt.generatedAt).toLocaleString("en-IN")}</p>
              <p>
                Order #{receipt.order.id} ·{" "}
                {receipt.order.diningTable
                  ? `Table ${receipt.order.diningTable.id}`
                  : "Takeaway"}{" "}
                · {receipt.order.customer || "Guest"}
              </p>
            </div>
            <div className="receipt-lines">
              {receipt.order.items.map((i) => (
                <div key={i.id}>
                  <span>
                    {i.quantity} × {i.name}
                    <small>{money(i.unitPrice)} each</small>
                  </span>
                  <b>{money(i.unitPrice * i.quantity)}</b>
                </div>
              ))}
            </div>
            <div className="totals">
              <div>
                <span>Subtotal</span>
                <span>{money(receipt.subtotal)}</span>
              </div>
              <div>
                <span>Discount</span>
                <span>−{money(receipt.discount)}</span>
              </div>
              <div>
                <span>Demo tax (5%)</span>
                <span>{money(receipt.taxAmount)}</span>
              </div>
              <div className="grand-total">
                <strong>Total</strong>
                <strong>{money(receipt.total)}</strong>
              </div>
            </div>
            <p className="receipt-thanks">
              Thank you for sharing a table with us.
              <br />
              {receipt.paymentStatus === "PAID"
                ? `Recorded payment: ${receipt.paymentMethod}`
                : "Payment pending"}
            </p>
          </div>
          <div className="no-print">
            {receipt.paymentStatus === "PENDING" && (
              <>
                <p className="muted">
                  Record a payment received externally (no payment gateway).
                </p>
                <div className="payment-actions">
                  {["CASH", "UPI", "CARD"].map((method) => (
                    <button
                      key={method}
                      className="primary"
                      disabled={busy}
                      onClick={() =>
                        act(
                          async () =>
                            setReceipt(
                              await api(`/bills/${receipt.id}/pay`, "POST", {
                                method,
                              }),
                            ),
                          "Payment recorded. Table is available again.",
                        )
                      }
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button className="secondary full" onClick={() => window.print()}>
              <Printer size={16} /> Print / Save as PDF
            </button>
          </div>
        </Modal>
      )}
      {edit && (
        <Modal
          title={edit.id ? "Edit dish" : "Add a new dish"}
          close={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                await api(
                  edit.id ? `/menu/${edit.id}` : "/menu",
                  edit.id ? "PUT" : "POST",
                  {
                    ...edit,
                    price: Number(edit.price),
                    stock: Number(edit.stock),
                  },
                );
                setEdit(null);
              }, "Menu updated");
            }}
          >
            <label className="form-label">
              Dish name
              <input
                required
                maxLength={80}
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label className="form-label">
                Category
                <select
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value })
                  }
                >
                  {categories.slice(1).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Dish emoji
                <input
                  required
                  maxLength={12}
                  value={edit.emoji}
                  onChange={(e) => setEdit({ ...edit, emoji: e.target.value })}
                />
              </label>
            </div>
            <label className="form-label">
              Description
              <textarea
                maxLength={250}
                value={edit.description || ""}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </label>
            <div className="form-grid">
              <label className="form-label">
                Price (INR)
                <input
                  required
                  type="number"
                  min="1"
                  max="100000"
                  step="0.01"
                  value={edit.price}
                  onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                />
              </label>
              <label className="form-label">
                Stock (portions)
                <input
                  required
                  type="number"
                  min="0"
                  max="100000"
                  value={edit.stock}
                  onChange={(e) => setEdit({ ...edit, stock: e.target.value })}
                />
              </label>
            </div>
            <div className="checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={edit.vegetarian}
                  onChange={(e) =>
                    setEdit({ ...edit, vegetarian: e.target.checked })
                  }
                />{" "}
                Vegetarian
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={edit.available}
                  onChange={(e) =>
                    setEdit({ ...edit, available: e.target.checked })
                  }
                />{" "}
                Available
              </label>
            </div>
            <button className="primary full" disabled={busy}>
              Save dish
              <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function Mini({ label, value, icon }) {
  return (
    <div className="mini-stat">
      <span className="stat-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
function Status({ value }) {
  return (
    <span className={"status " + value.toLowerCase()}>{pretty(value)}</span>
  );
}
function Modal({ title, close, children, receipt }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (receipt ? "receipt-modal" : "")}
      >
        <div className="modal-heading no-print">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
