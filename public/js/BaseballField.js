const { h, Component } = window.preact;
const { useState, useEffect } = window.preactHooks;

// Load saved position from session storage or default
const loadPosition = () => {
  const saved = sessionStorage.getItem('markerPosition');
  return saved ? JSON.parse(saved) : { x: 50, y: 50 };
};

class DraggableMarker extends Component {
  render() {
    const { x, y, onDrag } = this.props;
    return h('div', {
      style: {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: '10px',
        height: '10px',
        background: 'red',
        borderRadius: '50%',
        cursor: 'move',
      },
      onMouseDown: onDrag,
    });
  }
}

const BaseballField = ({ app, auth, stripePromise, setError }) => {
  const [markerPosition, setMarkerPosition] = useState(loadPosition());
  const [error, setLocalError] = useState(null);
  const [isPremium, setIsPremium] = useState(false); // Placeholder for premium check

  useEffect(() => {
    setError(error); // Sync local error with prop
  }, [error, setError]);

  useEffect(() => {
    // Save position to session storage on change
    sessionStorage.setItem('markerPosition', JSON.stringify(markerPosition));

    // Placeholder for premium check (to be implemented)
    const checkPremiumStatus = async () => {
      try {
        // Example: Check user premium status via auth
        const user = auth.currentUser;
        if (user) {
          // In a real impl, query a Firebase collection or custom claims
          // For now, simulate with a mock check
          const premium = await new Promise(resolve => setTimeout(() => resolve(true), 1000)); // Mock delay
          setIsPremium(premium);
        }
      } catch (err) {
        console.error('Premium check failed:', err);
        setLocalError('Failed to check premium status');
      }
    };
    checkPremiumStatus();
  }, [markerPosition, auth, setError]);

  const handleDrag = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { x: markerPosition.x, y: markerPosition.y };

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setMarkerPosition({ x: startPos.x + dx, y: startPos.y + dy });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return h('div', { style: { position: 'relative', width: '800px', height: '400px', border: '1px solid black' } },
    h(DraggableMarker, { x: markerPosition.x, y: markerPosition.y, onDrag: handleDrag }),
    isPremium && h('div', { style: { color: '#10b981', marginTop: '10px' }, className: 'success-message' }, 'Premium User'),
    error && h('div', { style: { color: '#e53e3e', marginTop: '10px' }, className: 'error-message' }, error)
  );
};

export { BaseballField };