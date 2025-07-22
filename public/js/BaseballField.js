const { h, Component } = window.preact;
const { useState, useEffect } = window.preactHooks;

// Load saved position from session storage or default
const loadPosition = () => {
  try {
    const saved = sessionStorage.getItem('markerPosition');
    return saved ? JSON.parse(saved) : { x: 50, y: 50 };
  } catch (e) {
    console.error('Failed to load position:', e);
    return { x: 50, y: 50 };
  }
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

const BaseballField = ({ setError }) => {
  const [markerPosition, setMarkerPosition] = useState(loadPosition());
  const [error, setLocalError] = useState(null);
  const [isPremium, setIsPremium] = useState(false); // Placeholder

  useEffect(() => {
    setError(error);
  }, [error, setError]);

  useEffect(() => {
    try {
      sessionStorage.setItem('markerPosition', JSON.stringify(markerPosition));
    } catch (e) {
      console.error('Failed to save position:', e);
      setLocalError('Failed to save position');
    }
  }, [markerPosition]);

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

  useEffect(() => {
    // Mock premium check (replace with Firebase auth later)
    const checkPremium = () => setTimeout(() => setIsPremium(true), 1000);
    checkPremium();
  }, []);

  return h('div', null,
    h('div', { style: { position: 'relative', width: '800px', height: '400px', border: '1px solid black' } },
      h(DraggableMarker, { x: markerPosition.x, y: markerPosition.y, onDrag: handleDrag })
    ),
    isPremium && h('div', { style: { color: '#10b981', marginTop: '10px' }, className: 'success-message' }, 'Premium Features Unlocked (Upgrade for More)'),
    error && h('div', { style: { color: '#e53e3e', marginTop: '10px' }, className: 'error-message' }, error)
  );
};

export { BaseballField };