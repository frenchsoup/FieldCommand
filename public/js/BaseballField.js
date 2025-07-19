import { h, Component } from '/web_modules/preact.js';
import { useState, useEffect } from '/web_modules/preact/hooks.js';

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

const BaseballField = ({ app, db, auth, stripePromise, setError }) => {
  const [markerPosition, setMarkerPosition] = useState({ x: 50, y: 50 });
  const [email, setEmail] = useState('');
  const [error, setLocalError] = useState(null);

  useEffect(() => {
    setError(error); // Sync local error with prop
  }, [error, setError]);

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

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('https://github.us20.list-manage.com/subscribe?u=c3a7558bf8ddc22b2955671f5&id=1130a67a8c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `EMAIL=${encodeURIComponent(email)}&b_c3a7558bf8ddc22b2955671f5_1130a67a8c=`
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
      }
      console.log('Subscription successful');
      setEmail('');
      setLocalError(null);
    } catch (error) {
      console.error('Email submission error:', error);
      setLocalError(error.message); // Line 151
    }
  };

  return h('div', { style: { position: 'relative', width: '800px', height: '400px', border: '1px solid black' } },
    h(DraggableMarker, { x: markerPosition.x, y: markerPosition.y, onDrag: handleDrag }),
    h('form', { onSubmit: handleEmailSubmit, style: { marginTop: '20px' } },
      h('input', {
        type: 'email',
        value: email,
        onInput: (e) => setEmail(e.target.value),
        placeholder: 'Enter your email',
        required: true,
        style: { padding: '5px', marginRight: '10px' }
      }),
      h('button', { type: 'submit', style: { padding: '5px 10px' } }, 'Subscribe')
    ),
    error && h('div', { style: { color: '#e53e3e', marginTop: '10px' } }, error)
  );
};

export { BaseballField };