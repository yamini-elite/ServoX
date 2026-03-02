import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface ConfirmationScreenProps {
  workerName: string;
  date: string;
  time: string;
  onClose: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ workerName, date, time, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Audio play failed:", err));
    }
  }, []);

  return (
    <div className="confirmation-overlay">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" />
      
      <div className="confirmation-card">
        <div className="tick-container">
          <div className="success-circle"></div>
          <div className="success-tick"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <span className="bg-accent-blue/20 text-accent-blue text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-accent-blue/30">
              Upgraded Booking System
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Booking Confirmed</h2>
          <p className="text-text-secondary mb-8">Your service is scheduled successfully.</p>

          <div className="bg-white/5 border border-border-primary rounded-xl p-6 mb-8 text-left">
            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-widest text-accent-blue font-bold">Professional</label>
              <p className="text-lg font-bold">{workerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-accent-blue font-bold">Date</label>
                <p className="font-medium">{date}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-accent-blue font-bold">Time Slot</label>
                <p className="font-medium">{time}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-primary w-full py-4 text-lg"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;
