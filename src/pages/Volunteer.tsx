import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import heroShared from '../assets/images/hero-shared.jpg';
import {
  FaTent, FaHouseMedical, FaCamera, FaGift, FaHandHoldingDollar,
  FaHandshake, FaEarthAmericas, FaTruck, FaLaptop, FaInstagram,
} from 'react-icons/fa6';
import {
  FaHeartbeat, FaUsers, FaCalendarAlt, FaMapMarkerAlt,
  FaCheckCircle, FaArrowRight, FaArrowLeft,
} from 'react-icons/fa';
import { IconType } from 'react-icons';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

interface Opportunity {
  id: string;
  label: string;
  icon: IconType;
  color: string;
  description: string;
}

const opportunities: Opportunity[] = [
  { id: 'hospital-visits', label: 'Hospital Visits', icon: FaHouseMedical, color: 'text-emerald-500 bg-emerald-50', description: 'Bring smiles to children during hospital visits.' },
  { id: 'children-events', label: 'Children Events', icon: FaGift, color: 'text-rose-500 bg-rose-50', description: 'Help organize and run events for children and families.' },
  { id: 'fundraising', label: 'Fundraising', icon: FaHandHoldingDollar, color: 'text-amber-600 bg-amber-50', description: 'Support campaigns and donor outreach efforts.' },
  { id: 'photography-video', label: 'Photography / Video', icon: FaCamera, color: 'text-sky-500 bg-sky-50', description: 'Capture precious moments at our events and visits.' },
  { id: 'event-setup', label: 'Event Setup', icon: FaTent, color: 'text-purple-500 bg-purple-50', description: 'Help set up venues, decorations, and equipment.' },
  { id: 'social-media', label: 'Social Media', icon: FaInstagram, color: 'text-pink-500 bg-pink-50', description: 'Help spread our mission through social media.' },
  { id: 'administration', label: 'Administration', icon: FaLaptop, color: 'text-blue-500 bg-blue-50', description: 'Support behind-the-scenes operations and coordination.' },
  { id: 'driving-transportation', label: 'Driving / Transportation', icon: FaTruck, color: 'text-orange-500 bg-orange-50', description: 'Help with transportation and logistics.' },
  { id: 'community-outreach', label: 'Community Outreach', icon: FaEarthAmericas, color: 'text-teal-500 bg-teal-50', description: 'Engage local communities and spread awareness.' },
  { id: 'other', label: 'Other', icon: FaHandshake, color: 'text-gray-500 bg-gray-50', description: 'Have a unique skill? We would love to hear about it.' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent';
const selectClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-white';
const labelClass = 'block font-body text-sm font-medium text-navy/70 mb-2';

const steps = [
  { id: 1, title: 'Personal Info', icon: FaUsers },
  { id: 2, title: 'Emergency & Professional', icon: FaHeartbeat },
  { id: 3, title: 'Volunteer Details', icon: FaCalendarAlt },
  { id: 4, title: 'Availability & Questions', icon: FaMapMarkerAlt },
  { id: 5, title: 'Background & Safety', icon: FaCheckCircle },
];

export default function Volunteer() {
  const formRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    // Personal
    firstName: '', lastName: '', dateOfBirth: '', age: '', gender: '',
    address: '', city: '', state: '', zipCode: '', country: '', phone: '', email: '',
    // Emergency
    emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '',
    // Professional
    profession: '', companyName: '', skills: '', languages: '',
    // Volunteer Details
    whyVolunteer: '', volunteeredBefore: false, interests: [] as string[],
    // Availability
    daysAvailable: [] as string[], timeAvailable: '', canTravel: false, preferredLocation: '',
    // Important Questions
    experienceWithChildren: false, comfortableMedicalConditions: false,
    medicalLimitations: '', hasDriverLicense: false, canLiftEquipment: false,
    // Background & Safety
    consentBackgroundCheck: false, agreeToPolicies: false, digitalSignature: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleInterest = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      daysAvailable: prev.daysAvailable.includes(day)
        ? prev.daysAvailable.filter((d) => d !== day)
        : [...prev.daysAvailable, day],
    }));
  };

  const openForm = () => {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
        toast.error('Please fill in all required personal fields.');
        return false;
      }
    }
    if (step === 3) {
      if (form.interests.length === 0) {
        toast.error('Please select at least one area of interest.');
        return false;
      }
    }
    if (step === 5) {
      if (!form.agreeToPolicies || !form.digitalSignature) {
        toast.error('You must agree to the policies and provide a digital signature.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 5));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await api.post('/volunteer-applications', {
        ...form,
        age: form.age ? Number(form.age) : null,
      });
      setSubmitted(true);
      toast.success('Application submitted! Check your email for confirmation.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ─────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="bg-bg-warm min-h-screen">
        <section className="relative overflow-hidden py-28 md:py-40">
          <div className="absolute inset-0 z-0">
            <img src={heroShared} alt="Hero Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/50 to-navy/70" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-24 h-24 mx-auto mb-8 bg-emerald-500/20 rounded-full flex items-center justify-center"
            >
              <FaCheckCircle className="w-12 h-12 text-emerald-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl md:text-6xl font-bold text-white leading-tight"
            >
              Application <span className="text-hope-light">Submitted!</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-body text-lg text-white/70 mt-6 max-w-2xl mx-auto leading-relaxed"
            >
              Thank you for your willingness to make a difference, {form.firstName}! We have received
              your volunteer application and a confirmation email has been sent to <strong className="text-hope-light">{form.email}</strong>.
              Our team will review your application and reach out with next steps.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="font-display text-xl text-white/50 italic mt-8"
            >
              "Never lose hope. Keep on fighting."
            </motion.p>
          </div>
        </section>
      </div>
    );
  }

  // ─── Main Page ──────────────────────────────────────────────────

  return (
    <div className="bg-bg-warm min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-28 md:py-40">
        <div className="absolute inset-0 z-0">
          <img src={heroShared} alt="Hero Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/50 to-navy/70" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
          >
            Become A <span className="text-hope-light">Volunteer</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-white/70 mt-6 max-w-3xl mx-auto leading-relaxed"
          >
            Join our community of compassionate volunteers and help us bring hope, smiles, and support
            to children and families who need it most. Your time and talent can change lives.
          </motion.p>
          {!showForm && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              onClick={openForm}
              className="mt-10 inline-flex items-center gap-3 bg-gradient-to-r from-hope to-hope-light hover:from-hope-light hover:to-hope text-white font-display font-bold text-lg px-10 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Become a Volunteer <FaArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </section>

      {/* Why Volunteer */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-5xl font-bold text-navy">
            Ways You Can Help
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body text-navy/60 mt-4 max-w-2xl mx-auto text-lg">
            There are many ways to get involved. Choose the areas that match your passion and skills.
          </motion.p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-20">
          {opportunities.slice(0, 10).map((opp) => {
            const Icon = opp.icon;
            return (
              <motion.div
                key={opp.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${opp.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-base font-bold text-navy mb-2">{opp.label}</h3>
                <p className="font-body text-navy/50 text-sm leading-relaxed">{opp.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Banner */}
        {!showForm && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-gradient-to-r from-navy to-navy-soft rounded-2xl p-10 md:p-14 text-center"
          >
            <h3 className="font-display text-2xl md:text-4xl font-bold text-white mb-4">
              Ready to Make a Difference?
            </h3>
            <p className="font-body text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Fill out our volunteer application form and take the first step toward changing lives.
              Every act of kindness, big or small, brings us closer to our mission.
            </p>
            <button
              onClick={openForm}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-hope to-hope-light hover:from-hope-light hover:to-hope text-white font-display font-bold text-lg px-10 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Become a Volunteer <FaArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </section>

      {/* ─── Application Form ─────────────────────────────────────── */}
      {showForm && (
        <section ref={formRef} className="max-w-4xl mx-auto px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Step Indicator */}
            <div className="bg-navy/[0.03] border-b border-navy/10 px-8 py-6">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;
                  return (
                    <div key={s.id} className="flex items-center">
                      <button
                        onClick={() => {
                          if (isCompleted) setStep(s.id);
                        }}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                          isCompleted ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? 'bg-hope text-white shadow-md'
                              : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-navy/10 text-navy/30'
                          }`}
                        >
                          {isCompleted ? <FaCheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span
                          className={`text-[10px] font-body font-medium hidden sm:block ${
                            isActive ? 'text-hope' : isCompleted ? 'text-emerald-600' : 'text-navy/30'
                          }`}
                        >
                          {s.title}
                        </span>
                      </button>
                      {i < steps.length - 1 && (
                        <div
                          className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-colors duration-300 ${
                            step > s.id ? 'bg-emerald-400' : 'bg-navy/10'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                {/* ─── STEP 1: Personal Info ──────────────────── */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="font-display text-2xl font-bold text-navy mb-1">Personal Information</h3>
                      <p className="font-body text-navy/50 text-sm">Tell us about yourself.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>First Name <span className="text-hope">*</span></label>
                        <input type="text" name="firstName" value={form.firstName} onChange={handleChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name <span className="text-hope">*</span></label>
                        <input type="text" name="lastName" value={form.lastName} onChange={handleChange} required className={inputClass} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Date of Birth</label>
                        <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Age</label>
                        <input type="number" name="age" value={form.age} onChange={handleChange} min="16" max="100" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Gender</label>
                        <select name="gender" value={form.gender} onChange={handleChange} className={selectClass}>
                          <option value="">Select...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Address</label>
                      <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Street address" className={inputClass} />
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className={labelClass}>City</label>
                        <input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>State</label>
                        <input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>ZIP Code</label>
                        <input type="text" name="zipCode" value={form.zipCode} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Country</label>
                        <input type="text" name="country" value={form.country} onChange={handleChange} placeholder="e.g. USA" className={inputClass} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Phone <span className="text-hope">*</span></label>
                        <input type="tel" name="phone" value={form.phone} onChange={handleChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Email <span className="text-hope">*</span></label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 2: Emergency & Professional ──────── */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Emergency Contact */}
                    <div>
                      <h3 className="font-display text-2xl font-bold text-navy mb-1">Emergency Contact</h3>
                      <p className="font-body text-navy/50 text-sm mb-6">In case of an emergency during volunteer activities.</p>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Contact Name</label>
                          <input type="text" name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Relationship</label>
                          <select name="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={handleChange} className={selectClass}>
                            <option value="">Select...</option>
                            <option value="parent">Parent</option>
                            <option value="spouse">Spouse</option>
                            <option value="sibling">Sibling</option>
                            <option value="friend">Friend</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Phone Number</label>
                          <input type="tel" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} className={inputClass} />
                        </div>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div>
                      <h3 className="font-display text-2xl font-bold text-navy mb-1">Professional Information</h3>
                      <p className="font-body text-navy/50 text-sm mb-6">Help us understand your background and skills.</p>

                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelClass}>Profession / Occupation</label>
                          <input type="text" name="profession" value={form.profession} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Company Name <span className="text-navy/30">(optional)</span></label>
                          <input type="text" name="companyName" value={form.companyName} onChange={handleChange} className={inputClass} />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Skills or Talents</label>
                          <input type="text" name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. First aid, graphic design, cooking..." className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Languages Spoken</label>
                          <input type="text" name="languages" value={form.languages} onChange={handleChange} placeholder="e.g. English, Arabic, Spanish..." className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 3: Volunteer Details ──────────────── */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="font-display text-2xl font-bold text-navy mb-1">Volunteer Details</h3>
                      <p className="font-body text-navy/50 text-sm">Tell us about your motivation and interests.</p>
                    </div>

                    <div>
                      <label className={labelClass}>Why do you want to volunteer with Step of Hope?</label>
                      <textarea
                        name="whyVolunteer"
                        value={form.whyVolunteer}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Share what motivates you to give back..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="volunteeredBefore"
                          checked={form.volunteeredBefore}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope"
                        />
                        <span className="font-body text-sm text-navy font-medium">I have volunteered before</span>
                      </label>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Areas of Interest <span className="text-hope">*</span>
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {opportunities.map((opp) => {
                          const Icon = opp.icon;
                          return (
                            <label
                              key={opp.id}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                form.interests.includes(opp.id)
                                  ? 'border-hope bg-hope/5 shadow-sm'
                                  : 'border-navy/10 hover:border-hope/30 hover:bg-hope/5'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={form.interests.includes(opp.id)}
                                onChange={() => toggleInterest(opp.id)}
                                className="w-4 h-4 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope"
                              />
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${opp.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="font-body text-sm text-navy font-medium">{opp.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 4: Availability & Questions ────────── */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Availability */}
                    <div>
                      <h3 className="font-display text-2xl font-bold text-navy mb-1">Availability</h3>
                      <p className="font-body text-navy/50 text-sm mb-6">When are you available to volunteer?</p>

                      <div className="mb-5">
                        <label className={labelClass}>Days Available</label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`px-4 py-2 rounded-lg border-2 font-body text-sm font-medium transition-all duration-300 ${
                                form.daysAvailable.includes(day)
                                  ? 'border-hope bg-hope/10 text-hope'
                                  : 'border-navy/10 text-navy/40 hover:border-hope/30'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelClass}>Time Available</label>
                          <select name="timeAvailable" value={form.timeAvailable} onChange={handleChange} className={selectClass}>
                            <option value="">Select...</option>
                            <option value="morning">Morning (8 AM - 12 PM)</option>
                            <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                            <option value="evening">Evening (5 PM - 9 PM)</option>
                            <option value="flexible">Flexible</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Preferred Volunteer Location</label>
                          <input type="text" name="preferredLocation" value={form.preferredLocation} onChange={handleChange} placeholder="e.g. San Jose, Bay Area..." className={inputClass} />
                        </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="canTravel"
                          checked={form.canTravel}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope"
                        />
                        <span className="font-body text-sm text-navy font-medium">I am willing to travel for events</span>
                      </label>
                    </div>

                    {/* Important Questions */}
                    <div>
                      <h3 className="font-display text-2xl font-bold text-navy mb-1">Important Questions</h3>
                      <p className="font-body text-navy/50 text-sm mb-6">Help us place you in the right role.</p>

                      <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-navy/10 cursor-pointer hover:bg-hope/5 transition-all">
                          <input type="checkbox" name="experienceWithChildren" checked={form.experienceWithChildren} onChange={handleChange} className="w-4 h-4 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope" />
                          <span className="font-body text-sm text-navy">Do you have experience working with children?</span>
                        </label>

                        <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-navy/10 cursor-pointer hover:bg-hope/5 transition-all">
                          <input type="checkbox" name="comfortableMedicalConditions" checked={form.comfortableMedicalConditions} onChange={handleChange} className="w-4 h-4 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope" />
                          <span className="font-body text-sm text-navy">Are you comfortable working around children with medical conditions?</span>
                        </label>

                        <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-navy/10 cursor-pointer hover:bg-hope/5 transition-all">
                          <input type="checkbox" name="hasDriverLicense" checked={form.hasDriverLicense} onChange={handleChange} className="w-4 h-4 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope" />
                          <span className="font-body text-sm text-navy">Do you have a valid driver's license?</span>
                        </label>

                        <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-navy/10 cursor-pointer hover:bg-hope/5 transition-all">
                          <input type="checkbox" name="canLiftEquipment" checked={form.canLiftEquipment} onChange={handleChange} className="w-4 h-4 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope" />
                          <span className="font-body text-sm text-navy">Are you able to lift equipment (up to 30 lbs)?</span>
                        </label>

                        <div>
                          <label className={labelClass}>Do you have any medical limitations we should know about?</label>
                          <textarea
                            name="medicalLimitations"
                            value={form.medicalLimitations}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Leave blank if none..."
                            className={`${inputClass} resize-none`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 5: Background & Safety ─────────────── */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="font-display text-2xl font-bold text-navy mb-1">Background & Safety</h3>
                      <p className="font-body text-navy/50 text-sm">
                        Since we work closely with children and families, we take safety very seriously.
                      </p>
                    </div>

                    <div className="bg-hope/5 border border-hope/20 rounded-xl p-5">
                      <p className="font-body text-sm text-navy/70 leading-relaxed">
                        Step of Hope Foundation is committed to providing a safe environment for all children
                        and families we serve. By submitting this application, you acknowledge that approved
                        volunteers may be asked to undergo a background verification process. If fingerprinting
                        is required, you will be contacted separately and guided through the official process.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-navy/10 cursor-pointer hover:bg-hope/5 transition-all">
                        <input
                          type="checkbox"
                          name="consentBackgroundCheck"
                          checked={form.consentBackgroundCheck}
                          onChange={handleChange}
                          className="w-4 h-4 mt-0.5 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope"
                        />
                        <span className="font-body text-sm text-navy">
                          I consent to a background check if required during the volunteer approval process.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-navy/10 cursor-pointer hover:bg-hope/5 transition-all">
                        <input
                          type="checkbox"
                          name="agreeToPolicies"
                          checked={form.agreeToPolicies}
                          onChange={handleChange}
                          className="w-4 h-4 mt-0.5 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope"
                        />
                        <span className="font-body text-sm text-navy">
                          I agree to follow Step of Hope Foundation's rules, guidelines, and child safety policies. <span className="text-hope">*</span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-navy/10 cursor-pointer hover:bg-hope/5 transition-all">
                        <input
                          type="checkbox"
                          name="digitalSignature"
                          checked={form.digitalSignature}
                          onChange={handleChange}
                          className="w-4 h-4 mt-0.5 rounded border-navy/20 text-hope focus:ring-hope/30 accent-hope"
                        />
                        <span className="font-body text-sm text-navy">
                          I certify that all information provided is true and accurate to the best of my knowledge. This serves as my digital signature. <span className="text-hope">*</span>
                        </span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── Navigation Buttons ──────────────────────── */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-navy/10">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-navy/10 text-navy font-display font-bold hover:border-hope/30 hover:bg-hope/5 transition-all duration-300"
                  >
                    <FaArrowLeft className="w-3 h-3" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-gradient-to-r from-hope to-hope-light hover:from-hope-light hover:to-hope text-white font-display font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Next <FaArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-display font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                    {!loading && <FaCheckCircle className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}
