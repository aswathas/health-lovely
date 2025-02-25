import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SOSButton() {
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [sending, setSending] = useState(false);

  const handleSOSClick = () => {
    if (isActivated || sending) return;
    
    setIsActivated(true);
    let count = 5;
    
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(timer);
        sendEmergencyAlert();
      }
    }, 1000);

    // Allow cancellation
    setTimeout(() => {
      clearInterval(timer);
      if (!sending) {
        setIsActivated(false);
        setCountdown(5);
      }
    }, 5500);
  };

  const sendEmergencyAlert = async () => {
    try {
      setSending(true);
      
      // Get user's location
      let location = 'Location unavailable';
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = `${position.coords.latitude}, ${position.coords.longitude}`;
      } catch (error) {
        console.error('Failed to get location:', error);
      }

      const response = await fetch('/api/send-sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: 'Aswath', // Replace with actual user name
          location,
          condition: 'Emergency medical assistance needed',
          contactNumber: '6382974762', // Replace with actual contact number
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Emergency alert sent successfully');
      } else {
        throw new Error(data.error || 'Failed to send alert');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      toast.error('Failed to send emergency alert');
    } finally {
      setSending(false);
      setIsActivated(false);
      setCountdown(5);
    }
  };

  return (
    <button
      onClick={handleSOSClick}
      disabled={sending}
      data-sos-button
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center justify-center
        w-16 h-16 rounded-full
        transition-all duration-200
        ${
          isActivated
            ? 'bg-red-600 animate-pulse'
            : sending
            ? 'bg-gray-500'
            : 'bg-red-500 hover:bg-red-600'
        }
        shadow-lg
      `}
    >
      {sending ? (
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : isActivated ? (
        <span className="text-white font-bold text-xl">{countdown}</span>
      ) : (
        <div className="flex flex-col items-center">
          <AlertCircle className="w-6 h-6 text-white" />
          <span className="text-white text-xs mt-1">SOS</span>
        </div>
      )}
      
      {isActivated && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-800 px-4 py-2 rounded-lg whitespace-nowrap">
          Click again to cancel
        </div>
      )}
    </button>
  );
}
