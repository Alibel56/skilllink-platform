import { useMemo } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { Card, Button, Badge, Avatar, Stars } from '../components/ui';
import { categories, specialistsSeed } from '../data';
import type { Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
  search: string;
  setSearch: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  setSelectedSpecialistId: (id: number) => void;
};

export default function ListingPage({
  setPage, search, setSearch,
  selectedCategory, setSelectedCategory,
  sortBy, setSortBy, setSelectedSpecialistId,
}: Props) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return specialistsSeed
      .filter(s => {
        const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
        const matchSearch =
          s.name.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.skills.join(' ').toLowerCase().includes(q);
        return matchCat && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return b.rating - a.rating;
      });
  }, [search, selectedCategory, sortBy]);

  return (
    <div className="stack gap-24">
      <div className="toolbar">
        <div className="searchbar">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search specialists" />
        </div>
        <div className="filters-row">
          <select className="select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
          </select>
          <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rating">Highest Rated</option>
            <option value="price">Lowest Price</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="cards-grid two-cols">
        {filtered.map(sp => (
          <Card key={sp.id}>
            <div className="listing-card">
              <div className="listing-main">
                <Avatar name={sp.name} />
                <div>
                  <div className="name-row">
                    <h3>{sp.name}</h3>
                    {sp.verified && <ShieldCheck size={16} className="blue-icon" />}
                  </div>
                  <p className="muted">{sp.title}</p>
                  <div className="rating-row">
                    <Stars value={sp.rating} />
                    <span>{sp.rating}</span>
                    <span className="muted">({sp.reviews} reviews)</span>
                  </div>
                  <div className="tag-row">
                    {sp.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
                  </div>
                  <p className="muted small-text mt-12">{sp.description}</p>
                </div>
              </div>
              <div className="listing-actions">
                <Badge tone="soft">From ${sp.price}</Badge>
                <Button variant="secondary"
                  onClick={() => { setSelectedSpecialistId(sp.id); setPage('profile'); }}>
                  View Profile
                </Button>
                <Button onClick={() => { setSelectedSpecialistId(sp.id); setPage('booking'); }}>
                  Hire
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}