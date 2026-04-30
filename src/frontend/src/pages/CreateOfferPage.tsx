import { X } from 'lucide-react';
import { Card, Button, InputField, TextArea } from '../components/ui';
import { categories } from '../data';
import type { Page, ServiceOffer } from '../types';

type Props = {
  setPage: (p: Page) => void;
  offerTitle: string;
  setOfferTitle: (v: string) => void;
  offerDescription: string;
  setOfferDescription: (v: string) => void;
  offerPrice: string;
  setOfferPrice: (v: string) => void;
  offerCategory: string;
  setOfferCategory: (v: string) => void;
  offerTags: string[];
  setOfferTags: (tags: string[]) => void;
  offerTagInput: string;
  setOfferTagInput: (v: string) => void;
  userName: string;
  setOffers: (fn: (prev: ServiceOffer[]) => ServiceOffer[]) => void;
};

export default function CreateOfferPage({
  setPage, offerTitle, setOfferTitle,
  offerDescription, setOfferDescription,
  offerPrice, setOfferPrice,
  offerCategory, setOfferCategory,
  offerTags, setOfferTags,
  offerTagInput, setOfferTagInput,
  userName, setOffers,
}: Props) {
  const addTag = (val: string) => {
    const cleaned = val.trim();
    if (!cleaned) return;
    if (offerTags.some(t => t.toLowerCase() === cleaned.toLowerCase())) return;
    if (offerTags.length >= 6) return;
    setOfferTags([...offerTags, cleaned]);
  };

  const removeTag = (tag: string) => setOfferTags(offerTags.filter(t => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      addTag(offerTagInput);
      setOfferTagInput('');
    }
    if (e.key === 'Backspace' && !offerTagInput.trim() && offerTags.length > 0) {
      setOfferTags(offerTags.slice(0, -1));
    }
  };

  const handlePublish = () => {
    if (!offerTitle.trim() || !offerDescription.trim() || !offerPrice) {
      alert('Fill all fields'); return;
    }
    const numericPrice = Number(offerPrice);
    if (isNaN(numericPrice)) { alert('Enter a valid price'); return; }
    if (numericPrice < 10 || numericPrice > 1000) {
      alert('Price must be between $10 and $1000'); return;
    }

    let finalTags = [...offerTags];
    const pending = offerTagInput.trim();
    if (pending && !finalTags.some(t => t.toLowerCase() === pending.toLowerCase()) && finalTags.length < 6) {
      finalTags.push(pending);
    }

    setOffers(prev => [{
      id: `OFF-${Date.now()}`,
      title: offerTitle.trim(),
      description: offerDescription.trim(),
      price: numericPrice,
      category: offerCategory,
      specialistName: userName,
      tags: finalTags,
    }, ...prev]);

    setOfferTitle('');
    setOfferDescription('');
    setOfferPrice('');
    setOfferTags([]);
    setOfferTagInput('');
    setPage('dashboard');
  };

  return (
    <div className="centered-page">
      <Card className="auth-card">
        <h2>Create Service Offer</h2>

        <InputField placeholder="Service Title" value={offerTitle} maxLength={20}
          onChange={(e) => setOfferTitle(e.target.value.slice(0, 20))} />
        <p className="muted small-text" style={{ marginTop: '6px' }}>{offerTitle.length}/20 characters</p>

        <TextArea placeholder="Describe your service" value={offerDescription} maxLength={100}
          onChange={(e) => setOfferDescription(e.target.value.slice(0, 100))}
          style={{ resize: 'none' }} />
        <p className="muted small-text" style={{ marginTop: '6px' }}>{offerDescription.length}/100 characters</p>

        <div className="mt-16">
          <label className="field-label">Service Tags</label>
          <div className="soft-box" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', minHeight: '52px' }}>
            {offerTags.map(tag => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eef2ff', color: '#3730a3', borderRadius: '999px', padding: '6px 10px', fontSize: '13px', fontWeight: 600 }}>
                <span>{tag}</span>
                <button type="button" onClick={() => removeTag(tag)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, color: 'inherit' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <input value={offerTagInput} onChange={(e) => setOfferTagInput(e.target.value)}
              onKeyDown={handleKeyDown} onBlur={() => { if (offerTagInput.trim()) { addTag(offerTagInput); setOfferTagInput(''); } }}
              placeholder="Type tag and press space"
              style={{ border: 'none', outline: 'none', flex: 1, minWidth: '160px', background: 'transparent', fontSize: '14px' }} />
          </div>
          <p className="muted small-text" style={{ marginTop: '6px' }}>Max 6 tags.</p>
        </div>

        <InputField type="number" placeholder="Price ($)" value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)} />
        <p className="muted small-text" style={{ marginTop: '6px' }}>Price range: $10 - $1000</p>

        <select className="select" value={offerCategory} onChange={(e) => setOfferCategory(e.target.value)}>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
        </select>

        <Button className="full-width" onClick={handlePublish}>Publish Offer</Button>
      </Card>
    </div>
  );
}