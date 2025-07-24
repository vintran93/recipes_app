import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function RecipeDetail({ apiBaseUrl, onLogout }) { // Added onLogout prop
  const { id } = useParams(); // Get the recipe ID from the URL
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success/error messages
  const [showConfirmModal, setShowConfirmModal] = useState(false); // State for custom confirmation modal

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/recipes/${id}/`);
        setRecipe(response.data);
      } catch (err) {
        console.error("Error fetching recipe details:", err.response?.data || err);
        setError('Failed to load recipe details. It might not exist or you do not have permission.');
        if (err.response?.status === 403) {
          onLogout(); // Log out if session expired
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipeDetails();
    }
  }, [id, apiBaseUrl, onLogout]);

  const handleEditClick = () => {
    navigate(`/recipes/edit/${id}`);
  };

  // Function to initiate deletion, shows the custom modal
  const handleDeleteClick = () => {
    setShowConfirmModal(true);
  };

  // Function to handle actual deletion after confirmation
  const confirmDeleteRecipe = useCallback(async () => {
    setShowConfirmModal(false); // Close the modal
    try {
      await axios.delete(`${apiBaseUrl}/recipes/${id}/`);
      setMessage('Recipe deleted successfully!');
      setTimeout(() => {
        navigate('/dashboard'); // Redirect to dashboard after deletion
      }, 1500);
    } catch (error) {
      console.error("Error deleting recipe:", error.response?.data || error);
      setMessage('Failed to delete recipe.');
      if (error.response?.status === 403) {
        onLogout(); // Log out if session expired
      }
    }
  }, [apiBaseUrl, id, navigate, onLogout]);

  // Function to cancel deletion
  const cancelDeleteRecipe = () => {
    setShowConfirmModal(false); // Close the modal
  };

  if (loading) {
    return (
      <div className="recipe-detail-container">
        <p>Loading recipe details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-detail-container">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="recipe-detail-container">
        <p>Recipe not found.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="recipe-detail-container" style={{
      border: '1px solid #4B5563', // Subtle border
      borderRadius: '8px',
      padding: '20px',
      margin: '20px auto', // Center the box
      maxWidth: '550px', // Limit width for better readability
      backgroundColor: '#2D3748' // Slightly lighter background for the box
    }}>
      <h1>{recipe.title}</h1>
      {message && <p className="success-message">{message}</p>} {/* Display success message */}
      {recipe.image_url && (
        <img 
          src={recipe.image_url} 
          alt={recipe.title} 
          className="recipe-detail-image" 
          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/cccccc/000000?text=No+Image"; }} 
          style={{
            marginBottom: '20px', 
            borderRadius: '8px', 
            width: '100%', // Make image fill 100% of container width
            height: '300x', // Set a fixed height or use aspect-ratio if preferred
            objectFit: 'cover' // This ensures the image covers the area without distortion, cropping if necessary
          }}
        />
      )}
      {recipe.cuisine_type && ( // New section for Cuisine Type
        <>
          <h2 style={{marginTop: '20px'}}>Cuisine Type</h2>
          <p style={{marginBottom: '10px'}}>{recipe.cuisine_type}</p>
          <hr style={{borderTop: '1px solid #4B5563', margin: '20px 0'}} /> {/* Subtle line */}
        </>
      )}
      {recipe.description && (
        <>
          <h2 style={{marginTop: '20px'}}>Description</h2>
          <p style={{whiteSpace: 'pre-wrap', marginBottom: '10px'}}>{recipe.description}</p>
          <hr style={{borderTop: '1px solid #4B5563', margin: '20px 0'}} /> {/* Subtle line */}
        </>
      )}
      <h2 style={{marginTop: '20px'}}>Ingredients</h2>
      {/* whiteSpace: 'pre-wrap' ensures newlines are respected */}
      <p style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{recipe.ingredients}</p> 
      <hr style={{borderTop: '1px solid #4B5563', margin: '20px 0'}} /> {/* Subtle line */}
      <h2 style={{marginTop: '20px'}}>Instructions</h2>
      {/* whiteSpace: 'pre-wrap' ensures newlines are respected */}
      <p style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{recipe.instructions}</p> 
      <hr style={{borderTop: '1px solid #4B5563', margin: '20px 0'}} /> {/* Subtle line */}
      {recipe.external_link && (
        <>
          <p className="external-link" style={{marginTop: '20px', marginBottom: '10px'}}>
            <a href={recipe.external_link} target="_blank" rel="noopener noreferrer">Original Source</a>
          </p>
          <hr style={{borderTop: '1px solid #4B5563', margin: '20px 0'}} /> {/* Subtle line */}
        </>
      )}
      <p className="recipe-meta" style={{marginTop: '20px'}}>Created: {new Date(recipe.created_at).toLocaleDateString()}</p>
      <p className="recipe-meta" style={{marginBottom: '10px'}}>Last Updated: {new Date(recipe.updated_at).toLocaleDateString()}</p>
      
      <div className="recipe-detail-actions" style={{marginTop: '30px', marginBottom: '20px'}}>
        <button onClick={handleEditClick} className="action-button" style={{marginRight: '10px'}}>Edit Recipe</button>
        <button onClick={handleDeleteClick} className="action-button delete-button">Delete Recipe</button> {/* Changed to handleDeleteClick */}
      </div>
      <button onClick={() => navigate('/dashboard')} className="action-button">Back to Dashboard</button>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#2D3748',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            maxWidth: '400px',
            color: '#F9FAFB'
          }}>
            <h3 style={{ marginTop: '0', marginBottom: '20px', fontSize: '1.2em' }}>Confirm Deletion</h3>
            <p style={{ marginBottom: '30px' }}>Are you sure you want to delete "{recipe.title}"?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={confirmDeleteRecipe}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#B91C1C'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#DC2626'}
              >
                Delete
              </button>
              <button
                onClick={cancelDeleteRecipe}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4B5563'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6B7280'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeDetail;
