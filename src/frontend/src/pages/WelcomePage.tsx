import { motion } from 'framer-motion';
import { Badge, Button, IconBadge } from '../components/ui';
import { categories } from '../data';
import type { Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
};

export default function WelcomePage({ setPage }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hero-layout"
    >
      <div className="hero-left">
        <Badge tone="soft">Service Marketplace</Badge>
        <h1 className="hero-main-title">
          Find trusted specialists<br />for every job.
        </h1>
        <p className="hero-main-text">
          Book verified professionals for plumbing, electrical,
          cleaning and home repair services in just a few clicks.
        </p>
        <div className="button-row hero-buttons">
          <Button onClick={() => setPage('login')}>Get Started</Button>
          <Button variant="secondary" onClick={() => setPage('signup')}>Join Now</Button>
        </div>
      </div>

      <div className="hero-right">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.id}
              className="floating-card"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <IconBadge><Icon size={22} /></IconBadge>
              <div>
                <h3>{cat.label}</h3>
                <p>{cat.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}