import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Our Story', path: '/our-story' },
  { name: 'Mission', path: '/mission' },
  { name: 'Impact', path: '/impact' },
  { name: 'YNO', path: '/yno' },
  { name: 'Services', path: '/events' },
  { name: 'Donate', path: '/donate' },
  { name: 'Volunteer', path: '/volunteer' },
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isOpen ? 'bg-white shadow-lg' : scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Step of Hope" className="h-12 w-auto" />
            <span
              className={`font-display text-xl font-bold transition-colors duration-300 ${
                scrolled || isOpen ? 'text-navy' : 'text-white'
              }`}
            >
              Step of Hope
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-300 hover:text-hope ${
                  location.pathname === link.path
                    ? 'text-hope'
                    : scrolled
                    ? 'text-navy'
                    : 'text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-3">
            <Link
              to="/donate"
              className="bg-gold hover:bg-gold-light text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-gold/30"
            >
              Donate Now
            </Link>
            <Link
              to="/events"
              className={`border-2 border-hope px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:bg-hope hover:text-white ${
                scrolled ? 'text-hope' : 'text-white'
              }`}
            >
              Book Services
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`xl:hidden p-2 rounded-lg transition-colors ${
              scrolled || isOpen ? 'text-navy' : 'text-white'
            }`}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <HiX size={28} /> : <HiMenuAlt3 size={28} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-white border-t border-gray-100 min-h-screen"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-hope/10 text-hope'
                      : 'text-navy hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex gap-3 pt-4">
                <Link
                  to="/donate"
                  className="flex-1 bg-gold text-white text-center py-3 rounded-full font-semibold"
                >
                  Donate Now
                </Link>
                <Link
                  to="/events"
                  className="flex-1 border-2 border-hope text-hope text-center py-3 rounded-full font-semibold"
                >
                  Book Services
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
