import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { FaCamera, FaVideo, FaCalendarDays, FaUser, FaCreditCard, FaCheck, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

type ServiceType = 'photobooth' | '360booth' | 'both';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  eventDate: string;
  startTime: string;
  numHours: number;
  eventType: string;
  eventAddress: string;
  indoorOutdoor: string;
  estimatedGuests: string;
  withTent: boolean;
  customBackdrop: boolean;
  backdropChoice: string;
  designNotes: string;
  parkingInstructions: string;
  setupAccessTime: string;
  powerAvailability: string;
  specialRequests: string;
}

const eventTypes = [
  'Birthday',
  'Wedding',
  'Church Event',
  'Corporate Event',
  'School Event',
  'Fundraiser',
  'Other',
];

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

const backdropOptions = [
  'Classic White',
  'Gold Sequin',
  'Floral Garden',
  'Balloon Arch',
  'Neon Lights',
  'Rustic Wood',
  'Custom (describe below)',
];

function serviceName(t: ServiceType) {
  return t === 'photobooth' ? 'Photobooth' : t === '360booth' ? '360 Video Booth' : 'Full Package';
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

function Calendar({
  selectedDate,
  onSelect,
  bookedDates,
  serviceType,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  bookedDates: string[];
  serviceType: ServiceType;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  useEffect(() => {
    api
      .get('/reservations/booked-dates', {
        params: {
          serviceType,
          month: currentMonth.month + 1,
          year: currentMonth.year,
        },
      })
      .catch(() => {});
  }, [currentMonth, serviceType]);

  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [firstDayOfWeek, daysInMonth]);

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { month: 11, year: prev.year - 1 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { month: 0, year: prev.year + 1 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const canGoPrev = () => {
    const now = new Date();
    return currentMonth.year > now.getFullYear() || (currentMonth.year === now.getFullYear() && currentMonth.month > now.getMonth());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev()}
          className="p-2 rounded-lg hover:bg-navy/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <FaChevronLeft className="w-4 h-4 text-navy" />
        </button>
        <h3 className="font-display text-lg font-bold text-navy">{monthName}</h3>
        <button type="button" onClick={nextMonth} className="p-2 rounded-lg hover:bg-navy/5 transition">
          <FaChevronRight className="w-4 h-4 text-navy" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-navy/40 py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;

          const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dateObj = new Date(currentMonth.year, currentMonth.month, day);
          const isPast = dateObj < today;
          const isBooked = bookedDates.includes(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateObj.getTime() === today.getTime();

          return (
            <button
              type="button"
              key={dateStr}
              disabled={isPast || isBooked}
              onClick={() => onSelect(dateStr)}
              className={`
                relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200
                ${isPast ? 'text-navy/20 cursor-not-allowed' : ''}
                ${isBooked && !isPast ? 'bg-red-50 text-red-300 cursor-not-allowed line-through' : ''}
                ${isSelected ? 'bg-navy text-white shadow-lg scale-105' : ''}
                ${!isPast && !isBooked && !isSelected ? 'text-navy hover:bg-hope/10 hover:text-hope-dark cursor-pointer' : ''}
                ${isToday && !isSelected ? 'ring-2 ring-hope/40' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-navy/5 text-xs text-navy/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-navy" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded ring-2 ring-hope/40" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

function calculateTotal(serviceType: ServiceType, form: FormData) {
  let base = 0;
  let extras = 0;

  if (serviceType === 'photobooth') {
    base = 800;
    const extraHours = Math.max(0, form.numHours - 3);
    extras += extraHours * 150;
    if (form.customBackdrop) extras += 200;
  } else if (serviceType === 'both') {
    base = 1300;
    const extraHours = Math.max(0, form.numHours - 3);
    extras += extraHours * 250;
    if (form.customBackdrop) extras += 200;
  } else {
    base = form.withTent ? 750 : 600;
    const extraHours = Math.max(0, form.numHours - 3);
    extras += extraHours * 150;
  }

  return { base, extras, total: base + extras };
}

export default function ReservationPage() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const serviceType: ServiceType = type === '360booth' ? '360booth' : type === 'both' ? 'both' : 'photobooth';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    eventDate: '',
    startTime: '',
    numHours: 3,
    eventType: '',
    eventAddress: '',
    indoorOutdoor: '',
    estimatedGuests: '',
    withTent: false,
    customBackdrop: false,
    backdropChoice: '',
    designNotes: '',
    parkingInstructions: '',
    setupAccessTime: '',
    powerAvailability: '',
    specialRequests: '',
  });

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setStep(5);
    }
    if (searchParams.get('canceled') === 'true') {
      toast('Payment was canceled. You can try again whenever you are ready.', { icon: '!' });
    }
  }, [searchParams]);

  useEffect(() => {
    api
      .get('/reservations/booked-dates', { params: { serviceType } })
      .then((res) => setBookedDates(res.data.bookedDates || []))
      .catch(() => {});
  }, [serviceType]);

  const update = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const pricing = calculateTotal(serviceType, form);

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1:
        if (!form.eventDate) { toast.error('Please select a date.'); return false; }
        if (!form.startTime) { toast.error('Please select a start time.'); return false; }
        return true;
      case 2:
        if (!form.fullName.trim()) { toast.error('Please enter your full name.'); return false; }
        if (!form.email.trim()) { toast.error('Please enter your email.'); return false; }
        if (!form.phone.trim()) { toast.error('Please enter your phone number.'); return false; }
        if (!form.eventType) { toast.error('Please select an event type.'); return false; }
        if (!form.eventAddress.trim()) { toast.error('Please enter the event address.'); return false; }
        if (!form.indoorOutdoor) { toast.error('Please select indoor or outdoor.'); return false; }
        if (!form.estimatedGuests) { toast.error('Please enter estimated guests.'); return false; }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/reservations/create-session', {
        serviceType,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        organization: form.organization.trim(),
        eventDate: form.eventDate,
        startTime: form.startTime,
        numHours: form.numHours,
        eventType: form.eventType,
        eventAddress: form.eventAddress.trim(),
        indoorOutdoor: form.indoorOutdoor,
        estimatedGuests: parseInt(form.estimatedGuests),
        withTent: form.withTent,
        customBackdrop: form.customBackdrop,
        backdropChoice: form.backdropChoice,
        designNotes: form.designNotes.trim(),
        parkingInstructions: form.parkingInstructions.trim(),
        setupAccessTime: form.setupAccessTime.trim(),
        powerAvailability: form.powerAvailability.trim(),
        specialRequests: form.specialRequests.trim(),
        promoCode: promoApplied?.code || null,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Unable to process your reservation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Date & Time', icon: FaCalendarDays },
    { num: 2, label: 'Details', icon: FaUser },
    { num: 3, label: 'Package', icon: serviceType === '360booth' ? FaVideo : FaCamera },
    { num: 4, label: 'Payment', icon: FaCreditCard },
  ];

  const inputClass =
    'w-full px-4 py-3.5 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy transition-all duration-300 bg-transparent';
  const labelClass = 'block font-body text-sm font-medium text-navy/70 mb-1.5';

  // Success screen
  if (step === 5) {
    return (
      <div className="bg-bg-warm min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-soft to-navy py-28 md:py-40">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-hope blur-[120px]" />
          </div>
          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <FaCheck className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl md:text-5xl font-bold text-white"
            >
              Reservation Confirmed!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-body text-white/70 text-lg mt-6 max-w-xl mx-auto leading-relaxed"
            >
              Thank you for reserving with Step of Hope. We have sent a confirmation email with all
              your event details and payment receipt. Our team will contact you to finalize everything.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="font-display text-white/90 text-lg mt-8 italic font-semibold"
            >
              Never lose hope. Keep on fighting.
            </motion.p>
            <motion.a
              href="/events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="inline-block mt-10 px-8 py-4 bg-white text-navy font-display font-semibold rounded-xl hover:bg-white/90 transition-colors"
            >
              Back to Events
            </motion.a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-bg-warm min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-soft to-navy py-24 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-hope blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-hope-light blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-body mb-6"
          >
            {serviceType === '360booth' ? <FaVideo /> : <FaCamera />}
            {serviceName(serviceType)}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl font-bold text-white leading-tight"
          >
            Reserve Your {serviceName(serviceType)}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-body text-lg text-white/70 mt-4 max-w-2xl mx-auto"
          >
            Choose your date, customize your experience, and secure your booking.
          </motion.p>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isComplete = step > s.num;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isComplete
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-navy text-white shadow-lg'
                          : 'bg-navy/5 text-navy/30'
                      }`}
                    >
                      {isComplete ? <FaCheck className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-xs font-medium mt-2 hidden sm:block ${
                        isActive ? 'text-navy' : isComplete ? 'text-emerald-600' : 'text-navy/30'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 rounded-full transition-colors duration-300 ${
                        step > s.num ? 'bg-emerald-500' : 'bg-navy/10'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Date & Time */}
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy mb-2">Select Date</h2>
                  <p className="font-body text-navy/50 text-sm mb-6">
                    Choose your preferred event date from the calendar.
                  </p>
                  <Calendar
                    selectedDate={form.eventDate}
                    onSelect={(date) => update('eventDate', date)}
                    bookedDates={bookedDates}
                    serviceType={serviceType}
                  />
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-navy mb-2">Select Start Time</h2>
                  <p className="font-body text-navy/50 text-sm mb-6">Choose when you want the booth to start.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => update('startTime', time)}
                        className={`py-3 px-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                          form.startTime === time
                            ? 'border-navy bg-navy text-white shadow-md'
                            : 'border-navy/10 text-navy/60 hover:border-hope/40 hover:bg-hope/5'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8">
                    <label className={labelClass}>Number of Hours</label>
                    <div className="flex items-center gap-3">
                      {[3, 4, 5, 6, 7, 8].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => update('numHours', h)}
                          className={`w-12 h-12 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                            form.numHours === h
                              ? 'border-navy bg-navy text-white shadow-md'
                              : 'border-navy/10 text-navy/60 hover:border-hope/40'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-navy/40 mt-2 font-body">
                      3 hours included. Extra hours at $150/hr.
                    </p>
                  </div>

                  {form.eventDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 p-4 bg-hope/5 rounded-xl border border-hope/20"
                    >
                      <p className="text-sm text-navy font-medium font-body">
                        Selected:{' '}
                        <span className="font-bold">
                          {new Date(form.eventDate + 'T12:00:00').toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {form.startTime && (
                          <>
                            {' '}at <span className="font-bold">{form.startTime}</span>
                          </>
                        )}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Customer & Event Details */}
          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Customer Info */}
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy mb-6">Customer Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        className={inputClass}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={inputClass}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className={inputClass}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Organization / Company Name</label>
                      <input
                        type="text"
                        value={form.organization}
                        onChange={(e) => update('organization', e.target.value)}
                        className={inputClass}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy mb-6">Event Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Event Type *</label>
                      <select
                        value={form.eventType}
                        onChange={(e) => update('eventType', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select event type</option>
                        {eventTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Event Location / Address *</label>
                      <input
                        type="text"
                        value={form.eventAddress}
                        onChange={(e) => update('eventAddress', e.target.value)}
                        className={inputClass}
                        placeholder="123 Main St, City, State"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Indoor or Outdoor *</label>
                      <div className="flex gap-3">
                        {['Indoor', 'Outdoor'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => update('indoorOutdoor', opt)}
                            className={`flex-1 py-3.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                              form.indoorOutdoor === opt
                                ? 'border-navy bg-navy text-white shadow-md'
                                : 'border-navy/10 text-navy/60 hover:border-hope/40'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Estimated Number of Guests *</label>
                      <input
                        type="number"
                        value={form.estimatedGuests}
                        onChange={(e) => update('estimatedGuests', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. 100"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Package & Customization */}
          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy mb-6">Package Selection</h2>

                  {/* Package pricing display */}
                  <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      {serviceType === '360booth' ? (
                        <FaVideo className="w-6 h-6 text-hope" />
                      ) : (
                        <FaCamera className="w-6 h-6 text-hope" />
                      )}
                      <h3 className="font-display text-xl font-bold text-navy">
                        {serviceName(serviceType)}
                      </h3>
                    </div>

                    {serviceType === 'both' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-navy/5">
                          <span className="font-body text-navy/70">Photo Booth + 360 Booth (3hrs base)</span>
                          <span className="font-display font-bold text-navy">$1,300</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-navy/5">
                          <span className="font-body text-navy/70">Extra Hour</span>
                          <span className="font-display font-bold text-navy">$250/hr</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-body text-navy/70">Custom Backdrop</span>
                          <span className="font-display font-bold text-navy">+$200</span>
                        </div>
                        <div className="pt-4 mt-4 border-t border-navy/10">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.customBackdrop}
                              onChange={(e) => update('customBackdrop', e.target.checked)}
                              className="w-5 h-5 rounded border-navy/20 text-navy focus:ring-hope accent-navy"
                            />
                            <span className="font-body text-navy font-medium">
                              Add Custom Backdrop (+$200)
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : serviceType === 'photobooth' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-navy/5">
                          <span className="font-body text-navy/70">3 Hours (base)</span>
                          <span className="font-display font-bold text-navy">$800</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-navy/5">
                          <span className="font-body text-navy/70">Extra Hour</span>
                          <span className="font-display font-bold text-navy">$150/hr</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-body text-navy/70">Custom Backdrop</span>
                          <span className="font-display font-bold text-navy">+$200</span>
                        </div>

                        <div className="pt-4 mt-4 border-t border-navy/10">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.customBackdrop}
                              onChange={(e) => update('customBackdrop', e.target.checked)}
                              className="w-5 h-5 rounded border-navy/20 text-navy focus:ring-hope accent-navy"
                            />
                            <span className="font-body text-navy font-medium">
                              Add Custom Backdrop (+$200)
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label
                          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            !form.withTent ? 'border-navy bg-navy/5' : 'border-navy/10 hover:border-navy/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="tent"
                              checked={!form.withTent}
                              onChange={() => update('withTent', false)}
                              className="w-5 h-5 accent-navy"
                            />
                            <span className="font-body text-navy font-medium">Without Tent</span>
                          </div>
                          <span className="font-display font-bold text-navy">$600</span>
                        </label>
                        <label
                          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            form.withTent ? 'border-navy bg-navy/5' : 'border-navy/10 hover:border-navy/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="tent"
                              checked={form.withTent}
                              onChange={() => update('withTent', true)}
                              className="w-5 h-5 accent-navy"
                            />
                            <span className="font-body text-navy font-medium">With White Tent</span>
                          </div>
                          <span className="font-display font-bold text-navy">$750</span>
                        </label>
                        <div className="flex justify-between items-center py-2 border-t border-navy/5 mt-2">
                          <span className="font-body text-navy/70">Extra Hour</span>
                          <span className="font-display font-bold text-navy">$150/hr</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gradient-to-br from-navy to-navy-soft rounded-2xl p-6 text-white">
                    <h4 className="font-display font-bold text-lg mb-3">Price Summary</h4>
                    <div className="space-y-2 text-white/80 text-sm font-body">
                      <div className="flex justify-between">
                        <span>Base Package ({serviceType === 'both' ? 'both 3hrs' : serviceType === 'photobooth' ? '3hrs' : form.withTent ? 'w/ tent' : 'no tent'})</span>
                        <span>${pricing.base}</span>
                      </div>
                      {form.numHours > 3 && (
                        <div className="flex justify-between">
                          <span>{form.numHours - 3} Extra Hour(s)</span>
                          <span>${(form.numHours - 3) * 150}</span>
                        </div>
                      )}
                      {(serviceType === 'photobooth' || serviceType === 'both') && form.customBackdrop && (
                        <div className="flex justify-between">
                          <span>Custom Backdrop</span>
                          <span>$200</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t border-white/20 text-white font-display font-bold text-xl">
                        <span>Total</span>
                        <span>${pricing.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Backdrop & Design — not for 360 booth */}
                {serviceType !== '360booth' && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy mb-6">Backdrop & Design</h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Choose Backdrop</label>
                      <select
                        value={form.backdropChoice}
                        onChange={(e) => update('backdropChoice', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select a backdrop</option>
                        {backdropOptions.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Notes for Printed Design / Logo / Text</label>
                      <textarea
                        value={form.designNotes}
                        onChange={(e) => update('designNotes', e.target.value)}
                        className={`${inputClass} min-h-[100px] resize-none`}
                        placeholder="Describe any custom design, logos, or text you'd like included..."
                      />
                    </div>
                  </div>
                </div>
                )}

                <div>
                  <h2 className="font-display text-2xl font-bold text-navy mt-8 mb-6">Special Notes</h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Parking Instructions</label>
                      <input
                        type="text"
                        value={form.parkingInstructions}
                        onChange={(e) => update('parkingInstructions', e.target.value)}
                        className={inputClass}
                        placeholder="Where should the team park?"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Setup Access Time</label>
                      <input
                        type="text"
                        value={form.setupAccessTime}
                        onChange={(e) => update('setupAccessTime', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. 1 hour before event"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Power Availability</label>
                      <input
                        type="text"
                        value={form.powerAvailability}
                        onChange={(e) => update('powerAvailability', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Outlets available near setup area"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Any Special Requests</label>
                      <textarea
                        value={form.specialRequests}
                        onChange={(e) => update('specialRequests', e.target.value)}
                        className={`${inputClass} min-h-[80px] resize-none`}
                        placeholder="Any other details we should know..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review & Payment */}
          {step === 4 && (
            <motion.div key="step4" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="max-w-2xl mx-auto">
                <h2 className="font-display text-2xl font-bold text-navy mb-6 text-center">
                  Review & Pay
                </h2>

                {/* Review Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-navy/10 overflow-hidden mb-6">
                  <div className="bg-navy/5 px-6 py-4 border-b border-navy/10">
                    <h3 className="font-display font-bold text-navy">Reservation Summary</h3>
                  </div>
                  <div className="p-6 space-y-4 font-body text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-navy/50 block">Service</span>
                        <span className="text-navy font-medium">
                          {serviceName(serviceType)}
                        </span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Event Date</span>
                        <span className="text-navy font-medium">
                          {form.eventDate
                            ? new Date(form.eventDate + 'T12:00:00').toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Start Time</span>
                        <span className="text-navy font-medium">{form.startTime}</span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Duration</span>
                        <span className="text-navy font-medium">{form.numHours} hours</span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Name</span>
                        <span className="text-navy font-medium">{form.fullName}</span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Email</span>
                        <span className="text-navy font-medium">{form.email}</span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Phone</span>
                        <span className="text-navy font-medium">{form.phone}</span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Event Type</span>
                        <span className="text-navy font-medium">{form.eventType}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-navy/50 block">Location</span>
                        <span className="text-navy font-medium">{form.eventAddress}</span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Indoor/Outdoor</span>
                        <span className="text-navy font-medium">{form.indoorOutdoor}</span>
                      </div>
                      <div>
                        <span className="text-navy/50 block">Guests</span>
                        <span className="text-navy font-medium">{form.estimatedGuests}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="border-t border-navy/10 pt-4 mt-4">
                      <div className="flex justify-between text-navy/60 mb-1">
                        <span>Base Package</span>
                        <span>${pricing.base}</span>
                      </div>
                      {form.numHours > 3 && (
                        <div className="flex justify-between text-navy/60 mb-1">
                          <span>{form.numHours - 3} Extra Hour(s)</span>
                          <span>${(form.numHours - 3) * 150}</span>
                        </div>
                      )}
                      {(serviceType === 'photobooth' || serviceType === 'both') && form.customBackdrop && (
                        <div className="flex justify-between text-navy/60 mb-1">
                          <span>Custom Backdrop</span>
                          <span>$200</span>
                        </div>
                      )}
                      {promoApplied && (
                        <div className="flex justify-between text-emerald-600 mb-1">
                          <span>Promo ({promoApplied.code}) -{promoApplied.discount}%</span>
                          <span>-${Math.round(pricing.total * (promoApplied.discount / 100))}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-display font-bold text-navy text-xl pt-2 border-t border-navy/10">
                        <span>Total</span>
                        <span>${promoApplied ? pricing.total - Math.round(pricing.total * (promoApplied.discount / 100)) : pricing.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6 mb-6">
                  <h3 className="font-display font-bold text-navy mb-3">Promo Code</h3>
                  {promoApplied ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <span className="font-body text-sm text-emerald-700 font-medium">
                        {promoApplied.code} — {promoApplied.discount}% discount applied
                      </span>
                      <button
                        onClick={() => { setPromoApplied(null); setPromoCode(''); }}
                        className="text-xs text-red-600 hover:underline font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                        placeholder="Enter promo code"
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-navy/10 focus:border-hope focus:ring-2 focus:ring-hope/20 outline-none font-body text-navy text-sm"
                      />
                      <button
                        onClick={async () => {
                          if (!promoCode.trim()) return;
                          setPromoLoading(true);
                          setPromoError('');
                          try {
                            const res = await api.post('/reservations/validate-promo', { code: promoCode.trim() });
                            setPromoApplied({ code: res.data.code, discount: res.data.discount });
                          } catch (err: any) {
                            setPromoError(err.response?.data?.error || 'Invalid promo code.');
                          } finally {
                            setPromoLoading(false);
                          }
                        }}
                        disabled={promoLoading || !promoCode.trim()}
                        className="px-5 py-3 bg-navy text-white font-display font-semibold text-sm rounded-xl hover:bg-navy-soft disabled:opacity-50 transition"
                      >
                        {promoLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {promoError && <p className="text-red-600 text-xs mt-2 font-body">{promoError}</p>}
                </div>

                {/* Important Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="font-body text-sm text-amber-800 leading-relaxed">
                    <strong>Important:</strong> Reservation is confirmed after payment. Step of Hope will
                    contact you before the event to finalize all details. If your selected date is
                    unavailable, we will contact you immediately to reschedule or refund the payment.
                  </p>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-white font-display font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaCreditCard className="w-5 h-5" />
                  {loading ? 'Processing...' : `Pay $${promoApplied ? pricing.total - Math.round(pricing.total * (promoApplied.discount / 100)) : pricing.total} & Reserve`}
                </button>

                <p className="font-body text-navy/40 text-xs text-center mt-4">
                  Secure payment powered by Stripe. Your information is encrypted and protected.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-10">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-display font-semibold text-navy/60 hover:text-navy hover:bg-navy/5 transition-all"
              >
                <FaChevronLeft className="w-3 h-3" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 && (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3.5 bg-navy text-white rounded-xl font-display font-semibold shadow-md hover:shadow-lg hover:bg-navy-soft transition-all"
              >
                Continue
                <FaChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
