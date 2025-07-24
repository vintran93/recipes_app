import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function Dashboard({ apiBaseUrl, username, onLogout }) {
  const location = useLocation();
  const initialFocusRecipeIdRef = useRef(location.state?.focusRecipeId); 
  
  const [recipes, setRecipes] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); 
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [cuisineFilter, setCuisineFilter] = useState(''); // New state for cuisine filter
  const [uniqueCuisines, setUniqueCuisines] = useState([]); // New state for unique cuisines
  const [randomRecipeDisplay, setRandomRecipeDisplay] = useState(null); // New state for single random recipe display
  const navigate = useNavigate();

  // Effect for debouncing the search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Search and Cuisine filtering logic
  useEffect(() => {
    let currentFiltered = recipes;

    // Apply search term filter
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      currentFiltered = currentFiltered.filter(recipe => 
        recipe.title?.toLowerCase().includes(searchLower) ||
        recipe.cuisine_type?.toLowerCase().includes(searchLower) ||
        recipe.description?.toLowerCase().includes(searchLower) ||
        recipe.ingredients?.toLowerCase().includes(searchLower)
      );
    }

    // Apply cuisine filter
    if (cuisineFilter) {
      currentFiltered = currentFiltered.filter(recipe => 
        (recipe.cuisine_type || 'Uncategorized') === cuisineFilter
      );
    }
    
    setFilteredRecipes(currentFiltered);
  }, [debouncedSearchTerm, cuisineFilter, recipes]); // Re-run when debouncedSearchTerm, cuisineFilter, or recipes change

  // Function to focus on a specific recipe (now just navigates)
  const focusOnRecipe = useCallback((recipeId) => {
    if (!recipes.length) {
      return;
    }

    const targetRecipe = recipes.find(recipe => recipe.id === recipeId);
    if (!targetRecipe) {
      return;
    }

    // Show a message about the focused recipe
    const cuisineText = targetRecipe.cuisine_type ? ` in ${targetRecipe.cuisine_type} cuisine` : '';
    setMessage(`📍 Showing "${targetRecipe.title}"${cuisineText}`);

    // Clear the message after 4 seconds
    setTimeout(() => {
      setMessage('');
    }, 4000);

    // Navigate to the recipe's detail page
    navigate(`/recipes/${recipeId}`);
  }, [recipes, navigate]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.get(`${apiBaseUrl}/recipes/`);
      if (Array.isArray(response.data)) {
        setRecipes(response.data);
        // Extract unique cuisine types
        const cuisines = [...new Set(response.data.map(r => r.cuisine_type || 'Uncategorized'))].sort();
        setUniqueCuisines(cuisines);
      } else {
        setRecipes([]);
        setUniqueCuisines([]);
      }
    } catch (error) {
      setMessage('Failed to load recipes. Please ensure your backend is running and you are logged in.');
      if (error.response?.status === 403) {
        onLogout();
      }
      setRecipes([]);
      setUniqueCuisines([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, onLogout, setLoading]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Effect to handle focusing on a recipe after recipes are loaded
  useEffect(() => {
    if (recipes.length > 0 && initialFocusRecipeIdRef.current) {
      const recipeToFocus = initialFocusRecipeIdRef.current;
      focusOnRecipe(recipeToFocus);
      initialFocusRecipeIdRef.current = null; // Clear the ref after use
      // Clear location state immediately after use
      navigate(location.pathname, { replace: true });
    }
  }, [recipes, focusOnRecipe, navigate, location.pathname]);

  const handleAddRecipeClick = () => {
    navigate('/recipes/new');
  };

  // Random recipe selection function
  const handleRandomRecipe = () => {
    if (recipes.length === 0) { // Use full recipes list for random selection
      setMessage('No recipes available for random selection!');
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * recipes.length);
    const randomRecipe = recipes[randomIndex];
    
    setRandomRecipeDisplay(randomRecipe); // Set the single random recipe to display
    setSearchTerm(''); // Clear search term
    setCuisineFilter(''); // Clear cuisine filter
    setMessage(`🎲 Displaying random recipe: "${randomRecipe.title}"`);
    setTimeout(() => {
      setMessage('');
    }, 4000);
  };

  const handleCardClick = (recipeId) => {
    navigate(`/recipes/${recipeId}`);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#1F2937',
        color: '#F9FAFB'
      }}>
        {/* Left Sidebar */}
        <div style={{
          width: '280px',
          minWidth: '280px', 
          maxWidth: '280px',
          flexShrink: 0, 
          flexGrow: 0, 
          backgroundColor: '#111827',
          padding: '20px',
          borderRight: '1px solid #374151',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>Navigation</h2>
          <div style={{ color: '#9CA3AF' }}>Loading...</div>
        </div>

        {/* Main Content */}
        <div style={{
            flex: 1,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
        }}>
          <h1 style={{ margin: '0 0 20px 0' }}>Welcome to Your Recipes Dashboard, {username}!</h1>
          <p>Loading your recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      width: '100%',
      backgroundColor: '#1F2937',
      color: '#F9FAFB'
    }}>
      {/* Left Sidebar Navigation */}
      <div style={{
        width: '280px',
        minWidth: '280px',
        maxWidth: '280px',
        flexShrink: 0,
        flexGrow: 0,
        backgroundColor: '#111827',
        padding: '20px',
        borderRight: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto'
      }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: '10px' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Welcome, {username}!
          </h2>
        </div>

        {/* Search and Filter Section */}
        <div style={{ borderTop: '1px solid #374151', paddingTop: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Filter Recipes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search by name, description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setRandomRecipeDisplay(null); // Clear random display when search starts
              }}
              style={{
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #4B5563',
                borderRadius: '6px',
                backgroundColor: '#374151',
                color: '#F9FAFB',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#60A5FA'}
              onBlur={(e) => e.target.style.borderColor = '#4B5563'}
            />
            <select
              value={cuisineFilter}
              onChange={(e) => {
                setCuisineFilter(e.target.value);
                setRandomRecipeDisplay(null); // Clear random display when filter changes
              }}
              style={{
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #4B5563',
                borderRadius: '6px',
                backgroundColor: '#374151',
                color: '#F9FAFB',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
                marginTop: '8px'
              }}
            >
              <option value="">All Cuisines</option>
              {uniqueCuisines.map((cuisine, index) => (
                <option key={index} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
            <p style={{ 
              fontSize: '12px', 
              color: '#9CA3AF', 
              margin: '8px 0 0 0',
              lineHeight: '1.4',
              minHeight: '18px'
            }}>
              {searchTerm || cuisineFilter
                ? (filteredRecipes.length > 0 
                  ? `Found ${filteredRecipes.length} recipe${filteredRecipes.length === 1 ? '' : 's'}`
                  : 'No recipes found')
                : '\u00A0'
              }
            </p>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div style={{ borderTop: '1px solid #374151', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={handleAddRecipeClick} 
            style={{
              padding: '12px 16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
          >
            Add a Recipe Card
          </button>
          
          <button 
            onClick={handleRandomRecipe} 
            style={{
              padding: '12px 16px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#10B981'}
          >
            🎲 Random Recipe
          </button>
          
          <button 
            onClick={() => navigate('/settings')} 
            style={{
              padding: '12px 16px',
              backgroundColor: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4B5563'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6B7280'}
          >
            Account Settings
          </button>
          
          <button 
            onClick={onLogout} 
            style={{
              padding: '12px 16px',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#B91C1C'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#DC2626'}
          >
            Logout
          </button>
        </div>

        {/* Help Text */}
        <div style={{ 
          borderTop: '1px solid #374151', 
          paddingTop: '16px',
          fontSize: '12px',
          color: '#9CA3AF',
          lineHeight: '1.4'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Tip:</strong> Use the search bar to find specific recipes.
          </p>
          <p style={{ margin: '0' }}>
            Click on any recipe card to view its details.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        overflowY: 'auto' // Allow scrolling for recipe cards
      }}>
        {/* Header */}
        <div style={{ marginBottom: '20px', textAlign: 'center', width: '1500px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
            Your Recipes Dashboard
          </h1>
          {message && (
            <p style={{ 
              margin: '10px 0',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: message.includes('�') || message.includes('📍') ? '#065F46' : '#7F1D1D',
              color: '#F9FAFB',
              fontSize: '14px'
            }}>
              {message}
            </p>
          )}
        </div>

        {randomRecipeDisplay ? (
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: '#1a202c',
            borderRadius: '8px',
          }}>
            <div 
              key={randomRecipeDisplay.id} 
              onClick={() => handleCardClick(randomRecipeDisplay.id)}
              style={{
                backgroundColor: '#374151',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                width: '300px', // Make it a bit larger for single display
                height: '400px' // Adjust height
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.4)';
              }}
            >
              <div style={{ 
                width: '100%', 
                height: '60%', 
                overflow: 'hidden', 
                backgroundColor: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {randomRecipeDisplay.image_url ? (
                  <img 
                    src={randomRecipeDisplay.image_url} 
                    alt={randomRecipeDisplay.title} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/400x240/6B7280/D1D5DB?text=No+Image`;
                    }}
                  />
                ) : (
                  <span style={{ color: '#D1D5DB', fontSize: '18px' }}>No Image</span>
                )}
              </div>
              <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#F9FAFB' }}>{randomRecipeDisplay.title}</h3>
                  {randomRecipeDisplay.cuisine_type && (
                    <p style={{ margin: '0', fontSize: '14px', color: '#A0AEC0' }}>Cuisine: {randomRecipeDisplay.cuisine_type}</p>
                  )}
                </div>
                <p style={{ 
                  margin: '10px 0 0 0', 
                  fontSize: '14px', 
                  color: '#60A5FA', 
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  Click to View Details
                </p>
              </div>
            </div>
          </div>
        ) : filteredRecipes.length === 0 && (!searchTerm && !cuisineFilter) ? (
          <div style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a202c',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#9CA3AF' }}>
                No Recipes Yet
              </h2>
              <p style={{ margin: '0', fontSize: '16px', color: '#6B7280' }}>
                You haven't added any recipes yet. Use the "Add a Recipe Card" button in the sidebar to get started!
              </p>
            </div>
          </div>
        ) : filteredRecipes.length === 0 && (searchTerm || cuisineFilter) ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a202c',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <div>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#9CA3AF' }}>
                No Matching Recipes
              </h2>
              <p style={{ margin: '0', fontSize: '16px', color: '#6B7280' }}>
                No recipes match your current filters. Try different keywords or clear the filters to see all recipes.
              </p>
            </div>
          </div>
        ) : (
          <div 
            style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', // Responsive grid
              gap: '20px',
              padding: '20px', // Padding around the grid
              backgroundColor: '#1a202c',
              borderRadius: '8px',
              flexGrow: 1,
              alignContent: 'start' // Align content to the start when there are fewer items
            }} 
          >
            {filteredRecipes.map(recipe => (
              <div 
                key={recipe.id} 
                onClick={() => handleCardClick(recipe.id)}
                style={{
                  backgroundColor: '#374151',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '350px' // Fixed height for consistency
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div style={{ 
                  width: '100%', 
                  height: '60%', // Image takes 60% of card height
                  overflow: 'hidden', 
                  backgroundColor: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {recipe.image_url ? (
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.title} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = `https://placehold.co/400x240/6B7280/D1D5DB?text=No+Image`; // Placeholder on error
                      }}
                    />
                  ) : (
                    <span style={{ color: '#D1D5DB', fontSize: '18px' }}>No Image</span>
                  )}
                </div>
                <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#F9FAFB' }}>{recipe.title}</h3>
                    {recipe.cuisine_type && (
                      <p style={{ margin: '0', fontSize: '14px', color: '#A0AEC0' }}>Cuisine: {recipe.cuisine_type}</p>
                    )}
                  </div>
                  <p style={{ 
                    margin: '10px 0 0 0', 
                    fontSize: '14px', 
                    color: '#60A5FA', 
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    Click to View Details
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;