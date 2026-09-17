import { ArrowUpRight, Sprout, Sun, Leaf } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/reveal";
import { HeroIntro } from "@/components/hero-intro";
import { Wordmark } from "@/components/wordmark";

export default function Home() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Wordmark />
      <nav aria-label="Main navigation"><a href="#about">Our story</a><a href="#brands">Our brands</a><a href="#activities">What we do</a></nav>
    </header>
    <main id="main">
      <HeroIntro />
      <section id="about" className="about section-space">
        <Reveal><p className="eyebrow section-label">01 / OUR STORY</p></Reveal>
        <Reveal className="about-copy"><h2>Different brands.<br />One shared <em>home.</em></h2><p>TomatoSky brings VirginValley and Black Beauty Tomato together under one Lebanese company. Our work connects food and agriculture, with room for each brand to express its own character.</p><a className="text-link" href="#brands">Discover the TomatoSky family <ArrowUpRight size={18} /></a></Reveal>
      </section>
      <section id="brands" className="brands section-space">
        <Reveal className="section-heading"><div><p className="eyebrow">02 / THE FAMILY</p><h2>Meet our brands<span className="red-period">.</span></h2></div><p>Distinct identities.<br />Together under TomatoSky.</p></Reveal>
        <div className="brand-grid">
          <Reveal className="brand-card valley" lift><div className="brand-card-top"><span>THE TOMATOSKY FAMILY</span><Sprout size={28} strokeWidth={1.3} /></div><div className="brand-name valley-name">Virgin<span>Valley</span><span className="brand-rule" /></div><div className="brand-card-bottom"><span>VirginValley</span><span>A TomatoSky brand</span></div></Reveal>
          <Reveal className="brand-card beauty" delay={0.1} lift><div className="brand-card-top"><span>THE TOMATOSKY FAMILY</span><Sun size={28} strokeWidth={1.3} /></div><div className="brand-name beauty-name">Black Beauty<span>T O M A T O</span></div><div className="brand-card-bottom"><span>Black Beauty Tomato</span><span>A TomatoSky brand</span></div></Reveal>
        </div>
      </section>
      <section id="activities" className="activities section-space"><Reveal><p className="eyebrow">03 / WHAT CONNECTS US</p><h2>From the ground.<br />With <em>possibility.</em></h2></Reveal><Stagger className="activity-list" gap={0.12}><Item><Sprout size={25} /><h3>Agriculture</h3><span>01</span></Item><Item><Leaf size={25} /><h3>Food & produce</h3><span>02</span></Item><Item><ArrowUpRight size={25} /><h3>Trade & marketing</h3><span>03</span></Item></Stagger></section>
    </main>
    <footer className="site-footer"><Wordmark light /><p>TOMATO SKY SAL · Lebanon</p><a href="#main">Back to top ↑</a><span>© {new Date().getFullYear()} TomatoSky</span></footer>
  </>;
}
