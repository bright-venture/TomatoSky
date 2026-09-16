"use client";

import { useState } from "react";
import { ArrowUpRight, Boxes, ChartNoAxesCombined, FileText, LayoutDashboard, Leaf, Package, Settings2, Sprout, Warehouse } from "lucide-react";
import { Wordmark } from "./wordmark";
import { SignOutButton } from "./sign-out-button";

const sections = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Inventory", icon: Boxes },
  { name: "Documents", icon: FileText },
  { name: "Reports", icon: ChartNoAxesCombined },
  { name: "Administration", icon: Settings2 },
] as const;
type Section = typeof sections[number]["name"];
type Brand = { id: string; slug: string; name: string };
const details: Record<Exclude<Section, "Overview">, { title: string; body: string }> = {
  Inventory: { title: "A clear view of every stock movement", body: "Products, batches, warehouse locations, receipts, and dispatches will live here. Inventory entry is the next stage of your portal." },
  Documents: { title: "Company documents, together", body: "Organize scanned documents and attach them to brands and inventory records. Private document uploads will be added in a later stage." },
  Reports: { title: "The picture behind your operations", body: "Stock balances, expiry dates, and movement history will become reports once inventory records are available." },
  Administration: { title: "One company. The right access.", body: "Employee access currently requires an account created by your administrator and an approved membership. In-app invitations and permission management are not available yet." },
};

export function PortalWorkspace({ displayName, brands }: { displayName: string; brands: Brand[] }) {
  const [section, setSection] = useState<Section>("Overview");
  const [brandId, setBrandId] = useState("");
  const selectedBrand = brands.find(brand => brand.id === brandId);
  const visibleBrands = brands.filter(brand => !brandId || brand.id === brandId);
  const brandName = selectedBrand?.name ?? "All brands";
  const SectionIcon = sections.find(item => item.name === section)!.icon;

  return <div className="portal-shell">
    <aside className="sidebar">
      <Wordmark />
      <p className="sidebar-caption">EMPLOYEE PORTAL</p>
      <nav aria-label="Portal navigation">
        {sections.map(({ name, icon: Icon }) => <button key={name} className={section === name ? "selected" : ""} aria-current={section === name ? "page" : undefined} onClick={() => setSection(name)}><Icon size={19} />{name}</button>)}
      </nav>
      <div className="sidebar-bottom"><span className="company-avatar">TS</span><div><strong>Tomato Sky SAL</strong><span>Lebanon</span></div></div>
    </aside>
    <div className="portal-workspace">
      <header className="portal-header"><span>Workspace <span className="breadcrumb">/ {section}</span></span><div className="portal-account"><span>{displayName}</span><SignOutButton /></div></header>
      <main className="portal-main">
        <div className="portal-heading">
          <div><p className="eyebrow">TOMATOSKY WORKSPACE</p><h1>{section}</h1><p>{section === "Overview" ? "Your brands and operations, in one place." : `Company-wide ${section.toLowerCase()}, organized around your team.`}</p></div>
          <div className="brand-select"><label htmlFor="brand-filter">Brand</label><select id="brand-filter" value={brandId} onChange={event => setBrandId(event.target.value)}><option value="">All brands</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
        </div>
        {section === "Overview" ? <>
          <div className="metric-grid">
            {[{ label: "Products", icon: Package }, { label: "Stock locations", icon: Warehouse }, { label: "Documents", icon: FileText }].map(({ label, icon: Icon }) => <article className="metric" key={label}><div><span>{label}</span><Icon size={19} /></div><strong>—</strong><small>Module not set up yet</small></article>)}
          </div>
          <section className="portal-panel">
            <div className="panel-heading"><div><h2>{selectedBrand?.name ?? "Our brands"}</h2><p>Part of Tomato Sky SAL</p></div><span>{visibleBrands.length} {visibleBrands.length === 1 ? "brand" : "brands"}</span></div>
            <div className="portal-brand-list">
              {visibleBrands.length === 0 && <p className="portal-no-brands">No brands are available. Contact your administrator.</p>}
              {visibleBrands.map(brand => <div className="portal-brand-row" key={brand.id}>
                <span className={`brand-avatar ${brand.slug === "virginvalley" ? "green" : "purple"}`}>{brand.slug === "virginvalley" ? <Sprout size={23} /> : <Leaf size={23} />}</span>
                <div><h3>{brand.name}</h3><p>TomatoSky brand</p></div>
                <button onClick={() => { setBrandId(brand.id); setSection("Inventory"); }} aria-label={`View ${brand.name} inventory`}>View inventory <ArrowUpRight size={16} /></button>
              </div>)}
            </div>
          </section>
          <section className="portal-panel getting-started"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>Welcome, {displayName}.</h2><p>Your employee account is connected. Next, we will set up products, locations, and opening stock for your brands.</p></div><span className="foundation-icon"><Sprout size={44} strokeWidth={1.2} /></span></section>
        </> : <section className="portal-panel empty-state"><span className="empty-icon"><SectionIcon size={31} strokeWidth={1.4} /></span><p className="eyebrow">{brandName.toUpperCase()}</p><h2>{details[section].title}</h2><p>{details[section].body}</p><span className="coming-label">Not available yet</span></section>}
      </main>
    </div>
  </div>;
}
