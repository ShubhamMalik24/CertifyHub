import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ 
  rating = 0, 
  onRate, 
  maxStars = 5, 
  size = 'medium',
  readonly = false,
  showText = true,
  className = ''
}) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleStarClick = (starValue) => {
    if (readonly || !onRate) return;
    onRate(starValue);
  };

  const handleStarHover = (starValue) => {
    if (readonly) return;
    setHoveredStar(starValue);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoveredStar(0);
    setIsHovering(false);
  };

  const getStarClass = (starIndex) => {
    const baseClass = 'star';
    const currentRating = isHovering ? hoveredStar : rating;
    
    if (starIndex <= currentRating) {
      return `${baseClass} filled`;
    } else if (starIndex - 0.5 <= currentRating) {
      return `${baseClass} half-filled`;
    }
    return `${baseClass} empty`;
  };

  const getRatingText = () => {
    const displayRating = isHovering ? hoveredStar : rating;
    if (displayRating === 0) return 'No rating';
    if (displayRating === 1) return '1 star';
    return `${displayRating.toFixed(1)} stars`;
  };

  return (
    <div 
      className={`star-rating ${size} ${readonly ? 'readonly' : 'interactive'} ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="stars-container">
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1;
          return (
            <button
              key={starValue}
              type="button"
              className={getStarClass(starValue)}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
              disabled={readonly}
              aria-label={`Rate ${starValue} star${starValue !== 1 ? 's' : ''}`}
              title={readonly ? `${rating} out of ${maxStars} stars` : `Rate ${starValue} star${starValue !== 1 ? 's' : ''}`}
            >
              <svg viewBox="0 0 24 24" className="star-icon">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>
      
      {showText && (
        <span className="rating-text">
          {getRatingText()}
          {!readonly && !isHovering && rating > 0 && (
            <span className="rating-count"> ({rating.toFixed(1)})</span>
          )}
        </span>
      )}
    </div>
  );
};

export default StarRating;