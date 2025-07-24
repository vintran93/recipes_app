import React, { useState } from 'react'; // Import useState
import { useNavigate } from 'react-router-dom';

function RecipeCard({ recipe, onDelete, onEdit }) {
  const navigate = useNavigate();
  // State to manage the image height
  const [imageHeight, setImageHeight] = useState(400); // Initial height in pixels

  // Define min and max height for the image
  const MIN_IMAGE_HEIGHT = 100;
  const MAX_IMAGE_HEIGHT = 800;
  const IMAGE_SIZE_STEP = 50; // Pixels to increase/decrease by

  const handleEditClick = () => {
    navigate(`/recipes/edit/${recipe.id}`);
  };

  // Handler for "View Recipe" button
  const handleViewRecipeClick = () => {
    navigate(`/recipes/${recipe.id}`); // Navigate to the detail page for this recipe
  };

  // Function to increase image size
  const increaseImageSize = () => {
    setImageHeight(prevHeight => Math.min(prevHeight + IMAGE_SIZE_STEP, MAX_IMAGE_HEIGHT));
  };

  // Function to decrease image size
  const decreaseImageSize = () => {
    setImageHeight(prevHeight => Math.max(prevHeight - IMAGE_SIZE_STEP, MIN_IMAGE_HEIGHT));
  };

  return (
    <div className="recipe-card" style={{
      border: '1px solid #4B5563',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px auto',
      maxWidth: '700px', // Adjust max-width of the card container if needed
      backgroundColor: '#2D3748',
      color: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // Center content horizontally
      textAlign: 'center',
      height: '500px',
    }}>
      {/* Image and size adjustment buttons */}
      {recipe.image_url && (
        <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="recipe-image"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/${imageHeight}x${imageHeight}/cccccc/000000?text=No+Image`; }}
            style={{
              width: '100%',
              height: `${imageHeight}px`, // Apply dynamic height
              objectFit: 'cover',
              borderRadius: '8px',
              height: '500px',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            display: 'flex',
            gap: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '5px',
            padding: '5px'
          }}>
            <button
              onClick={decreaseImageSize}
              style={{
                background: 'none',
                border: '1px solid #60A5FA',
                color: '#60A5FA',
                fontSize: '20px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                lineHeight: '1',
                transition: 'background-color 0.2s, color 0.2s'
              }}
              onMouseOver={(e) => { e.target.style.backgroundColor = '#60A5FA'; e.target.style.color = 'white'; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#60A5FA'; }}
            >
              -
            </button>
            <button
              onClick={increaseImageSize}
              style={{
                background: 'none',
                border: '1px solid #60A5FA',
                color: '#60A5FA',
                fontSize: '20px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                lineHeight: '1',
                transition: 'background-color 0.2s, color 0.2s'
              }}
              onMouseOver={(e) => { e.target.style.backgroundColor = '#60A5FA'; e.target.style.color = 'white'; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#60A5FA'; }}
            >
              +
            </button>
          </div>
        </div>
      )}
      <h3>{recipe.title}</h3>
      {recipe.description && <p className="recipe-description">{recipe.description}</p>}
      
      {recipe.external_link && (
        <p className="external-link">
          <a href={recipe.external_link} target="_blank" rel="noopener noreferrer">View Original Recipe</a>
        </p>
      )}

      <div className="card-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {/* View Recipe button */}
        <button 
          onClick={handleViewRecipeClick} 
          className="view-button" 
          style={{
            padding: '10px 15px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
        >
          View Recipe
        </button>
        <button 
          onClick={handleEditClick} 
          className="edit-button"
          style={{
            padding: '10px 15px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#10B981'}
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(recipe.id, recipe.title)} 
          className="delete-button"
          style={{
            padding: '10px 15px',
            backgroundColor: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#B91C1C'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#DC2626'}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default RecipeCard;
