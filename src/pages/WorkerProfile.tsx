import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { WorkerData } from '../types';
import { Star, MapPin, Clock, Phone, ChevronLeft, Briefcase, CheckCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import Logo from '../components/Logo';
import ConfirmationScreen from '../components/ConfirmationScreen';

const WorkerProfile: React.FC = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('9AM–11AM');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorker = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'workers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWorker({ id: docSnap.id, ...docSnap.data() } as WorkerData);
        }
      } catch (err) {
        console.error("Error fetching worker:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, [id]);

  const handleBookOnline = async () => {
    if (!worker || !user || !visitDate || !visitTime) return;

    try {
      // 1) Create booking document in "bookings"
      await addDoc(collection(db, 'bookings'), {
        customerId: user.uid,
        workerId: worker.id,
        serviceType: worker.skill,
        visitDate,
        visitTime,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // 2) Create notification document in "notifications" for the worker
      await addDoc(collection(db, 'notifications'), {
        userId: worker.id,
        message: "New booking request received.",
        type: "booking",
        read: false,
        createdAt: serverTimestamp(),
      });

      // 3) Create email document in "mail" collection for worker email
      await addDoc(collection(db, 'mail'), {
        to: worker.email || `${worker.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        message: {
          subject: "New Booking Received",
          text: "You have a new booking scheduled.",
          html: "<strong>New Booking Request</strong>"
        }
      });
      
      setBookingModal(false);
      setShowConfirmation(true);
    } catch (err) {
      console.error("Booking failed:", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-accent-blue font-bold">Loading Profile...</div>;
  if (!worker) return <div className="min-h-screen bg-background flex items-center justify-center">Worker not found</div>;

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-text-secondary hover:text-accent-blue transition-colors mb-8"
        >
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Profile Info */}
          <div className="md:col-span-1">
            <div className="card-premium text-center">
              <img
                src={worker.imageUrl}
                alt={worker.name}
                className="w-32 h-32 rounded-2xl object-cover mx-auto mb-4 border-2 border-accent-blue/20 shadow-[0_0_20px_rgba(30,144,255,0.1)]"
                referrerPolicy="no-referrer"
              />
              <h1 className="text-2xl font-bold mb-1">{worker.name}</h1>
              <p className="text-accent-blue font-semibold mb-4">{worker.skill}</p>
              
              <div className="flex items-center justify-center gap-1 mb-6">
                <Star size={18} className="fill-yellow-500 text-yellow-500" />
                <span className="text-lg font-bold">{worker.rating}</span>
                <span className="text-text-secondary text-sm ml-1">(48 reviews)</span>
              </div>

              <div className="space-y-4 text-left border-t border-border-primary pt-6">
                <div className="flex items-center gap-3 text-text-secondary">
                  <MapPin size={18} className="text-accent-blue" />
                  <span>{worker.location}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Clock size={18} className="text-accent-blue" />
                  <span>{worker.availability}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Phone size={18} className="text-accent-blue" />
                  <span>{worker.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Booking */}
          <div className="md:col-span-2 space-y-6">
            <div className="card-premium">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-accent-blue" />
                Experience & About
              </h2>
              <p className="text-text-secondary leading-relaxed">
                {worker.experience}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-border-primary">
                  <div className="text-accent-blue font-bold text-2xl">8+</div>
                  <div className="text-xs text-text-secondary uppercase tracking-wider">Years Exp.</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-border-primary">
                  <div className="text-accent-blue font-bold text-2xl">150+</div>
                  <div className="text-xs text-text-secondary uppercase tracking-wider">Projects</div>
                </div>
              </div>
            </div>

            <div className="card-premium">
              <h2 className="text-xl font-bold mb-4">Service Pricing</h2>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border-primary mb-6">
                <div>
                  <div className="font-bold">Standard Consultation</div>
                  <div className="text-sm text-text-secondary">Initial visit and diagnosis</div>
                </div>
                <div className="text-2xl font-bold text-accent-blue">$49</div>
              </div>
              <button 
                onClick={() => setBookingModal(true)}
                className="btn-primary w-full py-4 text-lg"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border-primary rounded-2xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-2">Schedule Service</h3>
              <p className="text-text-secondary mb-8">Book a session with <span className="text-text-primary font-semibold">{worker.name}</span>.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Select Date</label>
                  <input 
                    type="date" 
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Select Time Slot</label>
                  <select 
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="input-field"
                  >
                    <option value="9AM–11AM">9AM–11AM</option>
                    <option value="11AM–1PM">11AM–1PM</option>
                    <option value="3PM–5PM">3PM–5PM</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleBookOnline}
                    disabled={!visitDate || !visitTime}
                    className="btn-primary w-full py-4 text-lg disabled:opacity-50"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setBookingModal(false)}
                className="mt-6 w-full text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <CheckCircle size={20} />
            <span className="font-semibold">Booking request sent successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPay Confirmation Screen */}
      <AnimatePresence>
        {showConfirmation && worker && (
          <ConfirmationScreen
            workerName={worker.name}
            date={visitDate}
            time={visitTime}
            onClose={() => setShowConfirmation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkerProfile;
