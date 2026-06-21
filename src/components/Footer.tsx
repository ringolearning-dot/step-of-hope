import { Link, useLocation } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaTiktok } from 'react-icons/fa';

const footerLinks = [
  { name: 'Home', path: '/' },
  { name: 'Our Story', path: '/our-story' },
  { name: 'Mission', path: '/mission' },
  { name: 'Donate', path: '/donate' },
  { name: 'YNO', path: '/yno' },
  { name: 'Volunteer', path: '/volunteer' },
  { name: 'Contact', path: '/contact' },
];

export default function Footer() {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-navy text-white/70 font-body">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="font-display text-2xl md:text-3xl text-white/90 leading-relaxed">
            Born From One Family's Fight.
            <br />
            Built To Bring Hope To Many Others.
          </p>
          <p className="mt-4 font-display text-lg text-hope italic">
            "Never Lose Hope. Keep On Fighting."
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Step of Hope" className="h-14 w-auto brightness-0 invert opacity-90" />
            </Link>
            <p className="text-sm leading-relaxed text-white/50 max-w-xs">
              Step of Hope Foundation brings hope, joy, and emotional support to children
              and families facing illness and difficult medical journeys.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/50 text-sm hover:text-hope transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">
              Connect
            </h3>
            <p className="text-white/50 text-sm mb-2">contactus@stepofhope.org</p>
            <p className="text-white/50 text-sm mb-6">stepofhope.org</p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/stepofhopefoundation"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white/50 hover:text-hope transition-colors"
              >
                <FaInstagram size={22} />
              </a>
              <a
                href="https://facebook.com/stepofhopefoundation"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-white/50 hover:text-hope transition-colors"
              >
                <FaFacebookF size={20} />
              </a>
              <a
                href="https://tiktok.com/@stepofhopefoundation"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-white/50 hover:text-hope transition-colors"
              >
                <FaTiktok size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} Step of Hope Foundation. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
