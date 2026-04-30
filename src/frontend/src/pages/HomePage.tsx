import { Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Button, Badge, Avatar, Stars, IconBadge } from '../components/ui';
import { SectionHeader } from '../components/layout';
import { categories, specialistsSeed } from '../data';
import type { Page, ServiceOffer } from '../types';

type Props = {
  setPage: (p: Page) => void;
  user: any;
  search: string;
  setSearch: (v: string) => void;
  offers: ServiceOffer[];
  setSelectedCategory: (v: string) => void;
  setSelectedSpecialistId: (id: number) => void;
  setSelectedOffer: (o: ServiceOffer | null) => void;
};

export default function HomePage({
  setPage, user, search, setSearch, offers,
  setSelectedCategory, setSelectedSpecialistId, setSelectedOffer,
}: Props) {
  return (
    <div className="stack gap-32">
      <section className="banner">
        <div>
          <p className="banner-eyebrow">Hello, {user.name || 'there'}</p>
          <h2>What service do you need today?</h2>
          <p className="banner-text">Search trusted specialists and book in a few clicks.</p>
        </div>
        <div className="searchbar large-search">
          <Search size={18} />
          <input value={search}
            onChange={(e) => { setSearch(e.target.value); setPage('listing'); }}
            placeholder="Search for services or specialists" />
          <Button variant="secondary" className="small-btn" onClick={() => setPage('listing')}>
            <Search size={16} /> Search
          </Button>
        </div>
      </section>

      <section>
        <SectionHeader title="Service Categories" />
        <div className="cards-grid three-cols">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.button whileHover={{ y: -3 }} key={cat.id} className="category-card"
                onClick={() => { setSelectedCategory(cat.id); setPage('listing'); }}>
                <IconBadge><Icon size={24} /></IconBadge>
                <h3>{cat.label}</h3>
                <p>{cat.description}</p>
              </motion.button>
            );
          })}
        </div>
      </section>

      {offers.length > 0 && (
        <section>
          <SectionHeader title="Service Offers" />
          <div className="cards-grid three-cols">
            {offers.map((offer) => {
              const sp = specialistsSeed.find(s => s.name === offer.specialistName);
              return (
                <Card key={offer.id}>
                  <div className="specialist-head" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Avatar name={offer.specialistName} />
                    <div style={{ flex: 1 }}>
                      <div className="name-row">
                        <h3 style={{ margin: 0 }}>{offer.specialistName}</h3>
                        {sp?.verified && <ShieldCheck size={16} className="blue-icon" />}
                      </div>
                      <p className="muted small-text">{offer.title}</p>
                    </div>
                    <Badge tone="soft">From ${offer.price}</Badge>
                  </div>
                  {sp && (
                    <div className="rating-row">
                      <Stars value={sp.rating} />
                      <span>{sp.rating}</span>
                      <span className="muted">({sp.reviews} reviews)</span>
                    </div>
                  )}
                  <p className="muted small-text mt-12">{offer.description}</p>
                  {offer.tags.length > 0 && (
                    <div className="tag-row mt-12">
                      {offer.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {sp && (
                      <Button variant="secondary" className="flex-1"
                        onClick={() => { setSelectedSpecialistId(sp.id); setPage('profile'); }}>
                        View Profile
                      </Button>
                    )}
                    <Button className="flex-1"
                      onClick={() => { setSelectedOffer(offer); if (sp) setSelectedSpecialistId(sp.id); setPage('booking'); }}>
                      Hire
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Featured Specialists"
          action={<Button variant="secondary" onClick={() => setPage('listing')}>View All</Button>} />
        <div className="cards-grid three-cols">
          {specialistsSeed.map(sp => (
            <Card key={sp.id}>
              <div className="specialist-head" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Avatar name={sp.name} />
                <div style={{ flex: 1 }}>
                  <div className="name-row">
                    <h3 style={{ margin: 0 }}>{sp.name}</h3>
                    {sp.verified && <ShieldCheck size={16} className="blue-icon" />}
                  </div>
                  <p className="muted small-text">{sp.title}</p>
                </div>
                <Badge tone="soft">From ${sp.price}</Badge>
              </div>
              <div className="rating-row">
                <Stars value={sp.rating} /><span>{sp.rating}</span>
                <span className="muted">({sp.reviews} reviews)</span>
              </div>
              <div className="tag-row">{sp.skills.slice(0, 3).map(skill => <Badge key={skill}>{skill}</Badge>)}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Button variant="secondary" className="flex-1"
                  onClick={() => { setSelectedSpecialistId(sp.id); setPage('profile'); }}>View Profile</Button>
                <Button className="flex-1"
                  onClick={() => { setSelectedSpecialistId(sp.id); setPage('booking'); }}>Hire</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}