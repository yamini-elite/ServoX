import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { WorkerData, BookingData, NotificationData } from '../types';
import { Star, MapPin, Clock, Search, LogOut, User as UserIcon, Phone, CheckCircle, Bell, Calendar, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import Logo from '../components/Logo';
import ConfirmationScreen from '../components/ConfirmationScreen';

const Dashboard: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerData[]>([]);
  const [filter, setFilter] = useState('All');
  const [selectedFilterLocation, setSelectedFilterLocation] = useState('All Locations');
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState<{ open: boolean; worker: WorkerData | null }>({ open: false, worker: null });
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('9AM–11AM');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastBooking, setLastBooking] = useState<{ workerName: string; date: string; time: string } | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [myBookings, setMyBookings] = useState<BookingData[]>([]);
  const { userData, user } = useAuth();
  const navigate = useNavigate();

  const locations = ['Anna Nagar', 'T Nagar', 'Adyar', 'Velachery', 'Mylapore', 'Tambaram', 'OMR', 'Porur', 'Guindy', 'Pallavaram'];

  useEffect(() => {
    if (!user) return;

    // Real-time notifications
    const qNotif = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationData));
      setNotifications(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    // Real-time bookings
    const qBookings = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid)
    );
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingData));
      setMyBookings(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => {
      unsubNotif();
      unsubBookings();
    };
  }, [user]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'workers'));
        const workersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkerData));
        
        // Seed some data if empty
        if (workersList.length === 0) {
          const dummyWorkers: Omit<WorkerData, 'id'>[] = [
            {
              name: 'Mike Johnson',
              email: 'mike.plumber@example.com',
              skill: 'Plumber',
              rating: 4.8,
              location: 'Anna Nagar',
              availability: 'Available Now',
              imageUrl: 'https://picsum.photos/seed/plumber/200/200',
              experience: '10 years of experience in residential plumbing.',
              phone: '+1 234 567 8901'
            },
            {
              name: 'Sarah Smith',
              email: 'sarah.electric@example.com',
              skill: 'Electrician',
              rating: 4.9,
              location: 'T Nagar',
              availability: 'Available Tomorrow',
              imageUrl: 'https://picsum.photos/seed/electrician/200/200',
              experience: 'Certified electrician specializing in smart home setups.',
              phone: '+1 234 567 8902'
            },
            {
              name: 'David Wilson',
              email: 'david.carpenter@example.com',
              skill: 'Carpenter',
              rating: 4.7,
              location: 'Adyar',
              availability: 'Available Now',
              imageUrl: 'https://picsum.photos/seed/carpenter/200/200',
              experience: 'Master carpenter with a passion for custom furniture.',
              phone: '+1 234 567 8903'
            },
            {
              name: 'Emma Davis',
              email: 'emma.painter@example.com',
              skill: 'Painter',
              rating: 4.6,
              location: 'Velachery',
              availability: 'Available in 2 days',
              imageUrl: 'https://picsum.photos/seed/painter/200/200',
              experience: 'Professional interior and exterior painter.',
              phone: '+1 234 567 8904'
            },
            {
              name: 'Robert Brown',
              email: 'robert.iron@example.com',
              skill: 'Ironing',
              rating: 4.5,
              location: 'Mylapore',
              availability: 'Available Now',
              imageUrl: 'https://picsum.photos/seed/ironing/200/200',
              experience: 'Expert in delicate fabrics and professional garment care.',
              phone: '+1 234 567 8905'
            }
          ];
          
          for (const w of dummyWorkers) {
            await addDoc(collection(db, 'workers'), w);
          }
          // Re-fetch
          const newSnapshot = await getDocs(collection(db, 'workers'));
          const newList = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkerData));
          setWorkers(newList);
        } else {
          setWorkers(workersList);
        }
      } catch (err) {
        console.error("Error fetching workers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  useEffect(() => {
    let result = workers;
    if (filter !== 'All') {
      result = result.filter(w => w.skill === filter);
    }
    if (selectedFilterLocation !== 'All Locations') {
      result = result.filter(w => w.location === selectedFilterLocation);
    }
    setFilteredWorkers(result);
  }, [filter, selectedFilterLocation, workers]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleBookOnline = async () => {
    if (!bookingModal.worker || !user || !visitDate || !visitTime) return;

    try {
      // 1) Create booking document in "bookings"
      await addDoc(collection(db, 'bookings'), {
        customerId: user.uid,
        workerId: bookingModal.worker.id,
        serviceType: bookingModal.worker.skill,
        visitDate,
        visitTime,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // 2) Create notification document in "notifications" for the worker
      await addDoc(collection(db, 'notifications'), {
        userId: bookingModal.worker.id,
        message: "New booking request received.",
        type: "booking",
        read: false,
        createdAt: serverTimestamp(),
      });

      // 3) Create email document in "mail" collection for worker email
      await addDoc(collection(db, 'mail'), {
        to: bookingModal.worker.email || `${bookingModal.worker.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        message: {
          subject: "New Booking Received",
          text: "You have a new booking scheduled.",
          html: "<strong>New Booking Request</strong>"
        }
      });
      
      setLastBooking({
        workerName: bookingModal.worker.name,
        date: visitDate,
        time: visitTime
      });
      setBookingModal({ open: false, worker: null });
      setShowConfirmation(true);
    } catch (err) {
      console.error("Booking failed:", err);
    }
  };

  const handleCancelBooking = async (booking: BookingData) => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled'
      });
      await addDoc(collection(db, 'notifications'), {
        userId: user!.uid,
        message: `Your booking for ${booking.serviceType} on ${booking.visitDate} has been cancelled`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Cancellation failed:", err);
    }
  };

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true
      });
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-text-primary pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Logo className="text-3xl" />
          
          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:text-accent-blue transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-accent-blue text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-card border border-border-primary rounded-xl shadow-2xl z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-border-primary flex justify-between items-center">
                        <span className="font-bold text-sm">Notifications</span>
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-text-secondary text-sm italic">No notifications yet</div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => markAsRead(n.id)}
                              className={`p-4 border-b border-border-primary/50 cursor-pointer transition-colors ${!n.read ? 'bg-accent-blue/5' : 'hover:bg-white/5'}`}
                            >
                              <p className={`text-sm ${!n.read ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>{n.message}</p>
                              <span className="text-[10px] text-text-secondary mt-1 block">
                                {n.createdAt?.toDate().toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border-primary">
              <UserIcon size={16} className="text-accent-blue" />
              <span className="text-sm font-medium">{userData?.name || 'Customer'}</span>
            </div>
            <button onClick={handleLogout} className="p-2 hover:text-accent-blue transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        {/* Hero Section */}
        <section className="mb-12">
          <h2 className="text-4xl font-bold mb-4">Find Professional Services</h2>
          <p className="text-text-secondary mb-8 max-w-2xl">
            Book top-rated professionals for your home needs. Premium quality, guaranteed satisfaction.
          </p>

          {/* Filters Section */}
          <div className="bg-card border border-border-primary rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-accent-blue mb-2">Filter by Skill</label>
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="All">All Skills</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Painter">Painter</option>
                  <option value="Ironing">Ironing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-accent-blue mb-2">Filter by Location</label>
                <select 
                  value={selectedFilterLocation}
                  onChange={(e) => setSelectedFilterLocation(e.target.value)}
                  className="input-field"
                >
                  <option value="All Locations">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Worker Grid */}
          <section className="lg:col-span-2">
            <div className="flex flex-col mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
                <Search size={20} className="text-accent-blue" />
                Available Workers
              </h3>
              <p className="text-sm text-text-secondary">
                {filter === 'All' && selectedFilterLocation === 'All Locations' && "Showing all available workers across Tamil Nadu"}
                {filter !== 'All' && selectedFilterLocation === 'All Locations' && `Showing ${filter} workers`}
                {filter === 'All' && selectedFilterLocation !== 'All Locations' && `Showing workers in ${selectedFilterLocation}`}
                {filter !== 'All' && selectedFilterLocation !== 'All Locations' && `Showing ${filter} workers in ${selectedFilterLocation}`}
              </p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="h-64 bg-card animate-pulse rounded-xl border border-border-primary"></div>
                ))}
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="card-premium text-center py-20">
                <p className="text-text-secondary italic">No workers found for the selected filters.</p>
                <button 
                  onClick={() => { setFilter('All'); setSelectedFilterLocation('All Locations'); }}
                  className="mt-4 text-accent-blue hover:underline text-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredWorkers.map((worker) => (
                    <motion.div
                      key={worker.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="card-premium group"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={worker.imageUrl}
                          alt={worker.name}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-border-primary group-hover:border-accent-blue/50 transition-colors"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-accent-blue transition-colors">{worker.name}</h3>
                          <p className="text-accent-blue text-sm font-semibold">{worker.skill}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={14} className="fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-medium">{worker.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-text-secondary text-sm">
                          <MapPin size={14} />
                          <span>{worker.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-500 text-sm">
                          <Clock size={14} />
                          <span>{worker.availability}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                          onClick={() => navigate(`/profile/${worker.id}`)}
                          className="btn-secondary text-sm w-full"
                        >
                          View Profile
                        </button>
                        <button 
                          onClick={() => setBookingModal({ open: true, worker })}
                          className="btn-primary text-sm w-full"
                        >
                          Book Now
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* My Bookings Sidebar */}
          <section className="lg:col-span-1">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-accent-blue" />
              My Bookings
            </h3>
            <div className="space-y-4">
              {myBookings.length === 0 ? (
                <div className="p-8 border border-dashed border-border-primary rounded-xl text-center text-text-secondary text-sm">
                  You have no bookings yet.
                </div>
              ) : (
                myBookings.map((booking) => (
                  <div key={booking.id} className="card-premium p-4 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-lg ${
                      booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                      booking.status === 'cancelled' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-emerald-500/20 text-emerald-500'
                    }`}>
                      {booking.status}
                    </div>
                    <h4 className="font-bold text-lg mb-1">{booking.serviceType}</h4>
                    <div className="space-y-1 text-xs text-text-secondary mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} />
                        <span>{booking.visitDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        <span>{booking.visitTime}</span>
                      </div>
                    </div>
                    {booking.status === 'pending' && (
                      <button 
                        onClick={() => handleCancelBooking(booking)}
                        className="flex items-center gap-2 text-accent-blue hover:text-hover-blue text-xs font-bold transition-colors"
                      >
                        <X size={14} />
                        Cancel Booking
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingModal({ open: false, worker: null })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border-primary rounded-2xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-2">Schedule Service</h3>
              <p className="text-text-secondary mb-8">Book a session with <span className="text-text-primary font-semibold">{bookingModal.worker?.name}</span>.</p>

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
                onClick={() => setBookingModal({ open: false, worker: null })}
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
        {showConfirmation && lastBooking && (
          <ConfirmationScreen
            workerName={lastBooking.workerName}
            date={lastBooking.date}
            time={lastBooking.time}
            onClose={() => setShowConfirmation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
