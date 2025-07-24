import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateRecipe({ apiBaseUrl }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  const navigate = useNavigate();

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/csrf/`);
        setCsrfToken(response.data.csrfToken);
        
        // Set default CSRF header for all axios requests
        axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCSRFToken();
  }, [apiBaseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);
    setLoading(true);

    // Basic validation
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      setMessage('Title, Ingredients, and Instructions are required.');
      setLoading(false);
      return;
    }

    try {
      const recipeData = {
        title,
        description: description || null,
        ingredients,
        instructions,
        image_url: imageUrl || null,
        external_link: externalLink || null,
        cuisine_type: cuisineType || null,
      };

      // Include CSRF token in headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true, // Important for CSRF
      };

      const response = await axios.post(`${apiBaseUrl}/recipes/`, recipeData, config);
      
      setMessage('Recipe card added successfully!');
      setIsSuccess(true);
      setLoading(false);

      // Clear form fields
      setTitle('');
      setDescription('');
      setIngredients('');
      setInstructions('');
      setImageUrl('');
      setExternalLink('');
      setCuisineType('');
      
      // Redirect to dashboard after success with the new recipe ID
      setTimeout(() => {
        navigate('/dashboard', { state: { focusRecipeId: response.data.id } });
      }, 1500);

    } catch (error) {
      console.error("Error creating recipe:", error.response?.data || error);
      const errorData = error.response?.data;
      
      if (error.response?.status === 403) {
        if (errorData?.detail?.includes('CSRF')) {
          setMessage('CSRF error. Please refresh the page and try again. Ensure your browser allows cookies from localhost.');
        } else {
          setMessage('Access denied. Please check your authentication.');
        }
      } else if (errorData) {
        const errorMessages = Object.values(errorData).flat().join(' ');
        setMessage(errorMessages || 'Failed to add recipe card.');
      } else {
        setMessage('Failed to add recipe card. Please try again.');
      }
      setIsSuccess(false);
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="create-recipe-container">
      <h1>Add a New Recipe Card</h1>
      {message && (
        <p className={isSuccess ? 'success-message' : 'error-message'}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Recipe Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Spicy Chicken Curry"
            required
          />
        </div>

        <div>
          <label htmlFor="description">Description (Optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief overview of the recipe..."
            rows="3"
          ></textarea>
        </div>

        <div>
          <label htmlFor="cuisineType">Cuisine Type (Optional):</label>
          <select
            id="cuisineType"
            value={cuisineType}
            onChange={(e) => setCuisineType(e.target.value)}
          >
            <option value="">Select a cuisine type...</option>
            <option value="American">American</option>
            <option value="Chinese">Chinese</option>
            <option value="French">French</option>
            <option value="Indian">Indian</option>
            <option value="Italian">Italian</option>
            <option value="Japanese">Japanese</option>
            <option value="Mediterranean">Mediterranean</option>
            <option value="Mexican">Mexican</option>
            <option value="Middle Eastern">Middle Eastern</option>
            <option value="Thai">Thai</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="ingredients">Ingredients (Required):</label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="List ingredients, one per line or separated by commas. e.g., 1 cup rice, 2 chicken breasts"
            rows="5"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="instructions">Instructions (Required):</label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step-by-step cooking instructions."
            rows="7"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="imageUrl">Image URL (Optional):</label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="e.g., https://example.com/chicken-curry.jpg"
          />
        </div>

        <div>
          <label htmlFor="externalLink">External Link (Optional):</label>
          <input
            id="externalLink"
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="e.g., https://originalrecipe.com/curry"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Adding Recipe...' : 'Add Recipe Card'}
        </button>
      </form>

      <hr />
      <button onClick={handleBackToDashboard}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default CreateRecipe;