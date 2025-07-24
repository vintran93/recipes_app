import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function EditRecipe({ apiBaseUrl }) {
  const { id } = useParams(); // Get the recipe ID from the URL
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [cuisineType, setCuisineType] = useState(''); // State for current recipe's cuisine type
  const [allCuisines, setAllCuisines] = useState([]); // State to store all unique cuisine types
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true); // Start loading as we fetch existing data
  // eslint-disable-next-line
  const [fetchError, setFetchError] = useState('');

  // Fetch existing recipe data and all unique cuisine types when the component mounts or ID changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch specific recipe data
        const recipeResponse = await axios.get(`${apiBaseUrl}/recipes/${id}/`);
        const recipeData = recipeResponse.data;
        setTitle(recipeData.title || '');
        setDescription(recipeData.description || '');
        setIngredients(recipeData.ingredients || '');
        setInstructions(recipeData.instructions || '');
        setImageUrl(recipeData.image_url || '');
        setExternalLink(recipeData.external_link || '');
        setCuisineType(recipeData.cuisine_type || ''); // Set the current recipe's cuisine type

        // Fetch all recipes to get unique cuisine types
        const allRecipesResponse = await axios.get(`${apiBaseUrl}/recipes/`);
        const uniqueCuisines = [...new Set(allRecipesResponse.data.map(r => r.cuisine_type).filter(Boolean))];
        setAllCuisines(uniqueCuisines);

        setFetchError('');
      } catch (error) {
        console.error("Error fetching data for edit:", error.response?.data || error);
        setFetchError('Failed to load recipe or cuisine types for editing. It might not exist or you do not have permission.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, apiBaseUrl]);

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
      const updatedRecipeData = {
        title,
        description: description || null,
        ingredients,
        instructions,
        image_url: imageUrl || null,
        external_link: externalLink || null,
        cuisine_type: cuisineType || null, // Include cuisine type
      };

      // Use PATCH for partial updates, PUT for full replacement
      await axios.patch(`${apiBaseUrl}/recipes/${id}/`, updatedRecipeData);
      
      setMessage('Recipe updated successfully!');
      setIsSuccess(true);
      setLoading(false);

      // Redirect to the dashboard after success
      setTimeout(() => {
        navigate('/dashboard'); // Changed from `/recipes/${id}` to `/dashboard`
      }, 1500);

    } catch (error) {
      console.error("Error updating recipe:", error.response?.data || error);
      const errorData = error.response?.data;
      
      if (error.response?.status === 403) {
        if (errorData?.detail?.includes('CSRF')) {
          setMessage('CSRF error. Please refresh the page and try again. Ensure your browser allows cookies from localhost.');
        } else {
          setMessage('Access denied. Please check your authentication.');
        }
      } else if (errorData) {
        const errorMessages = Object.values(errorData).flat().join(' ');
        setMessage(errorMessages || 'Failed to update recipe.');
      } else {
        setMessage('Failed to update recipe. Please try again.');
      }
      setIsSuccess(false);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/recipes/${id}`); // Go back to the recipe detail page
  };

  return (
    <div className="edit-recipe-container">
      <h1>Edit Recipe: {title}</h1>
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
            <option value="">Select or type a new cuisine</option>
            {allCuisines.map((cuisine, index) => (
              <option key={index} value={cuisine}>
                {cuisine}
              </option>
            ))}
            {/* Option to allow typing a new cuisine if not in the list */}
            {cuisineType && !allCuisines.includes(cuisineType) && (
              <option value={cuisineType}>{cuisineType} (Current)</option>
            )}
          </select>
          {/* Add a text input for new cuisine if user wants to type */}
          <input
            type="text"
            value={cuisineType}
            onChange={(e) => setCuisineType(e.target.value)}
            placeholder="Or type a new cuisine..."
            style={{marginTop: '10px'}}
          />
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
          {loading ? 'Updating Recipe...' : 'Update Recipe'}
        </button>
      </form>

      <hr />
      <button onClick={handleBack}>
        Cancel / Back to Recipe
      </button>
    </div>
  );
}

export default EditRecipe;