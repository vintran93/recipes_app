import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three'; // Import Three.js

function Dashboard({ apiBaseUrl, username, onLogout }) {
  const [recipes, setRecipes] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); // Corrected: useState(true) instead of = true)
  const [searchTerm, setSearchTerm] = useState('');
  // New state for debounced search term that actually triggers filtering
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); 
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const navigate = useNavigate();
  const mountRef = useRef(null); // Ref for the div where the Three.js canvas will be mounted

  // Three.js variables
  const scene = useRef(new THREE.Scene());
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const renderer = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const rootGroup = useRef(new THREE.Group()); // Root group to hold all cuisine groups
  const cuisineGroups = useRef(new Map()); // Map to store cuisine groups

  // Mouse interaction variables
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const horizontalRotationSpeed = useRef(0.005); // Adjust for desired horizontal rotation speed
  const horizontalButtonRotationStep = useRef(Math.PI / 8); // Step for horizontal button rotation (e.g., 22.5 degrees)

  // Add refs for smooth scrolling animation
  const isScrolling = useRef(false);
  const scrollStartTime = useRef(0);
  const scrollDuration = 800; // Duration in milliseconds for smooth scroll
  const scrollStartY = useRef(0);
  const scrollTargetY = useRef(0);

  // Add a ref to keep track of the currently viewed cuisine index
  const currentCuisineIndexRef = useRef(0);
  const totalCuisinesCountRef = useRef(0); // To store total number of cuisine groups

  // Effect for debouncing the search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]); // Only re-run if searchTerm changes

  // Search functionality - now depends on debouncedSearchTerm
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = recipes.filter(recipe => 
      recipe.title?.toLowerCase().includes(searchLower) ||
      recipe.cuisine_type?.toLowerCase().includes(searchLower) ||
      recipe.description?.toLowerCase().includes(searchLower) ||
      recipe.ingredients?.toLowerCase().includes(searchLower)
    );
    
    setFilteredRecipes(filtered);
  }, [debouncedSearchTerm, recipes]); // Re-run when debouncedSearchTerm or recipes change

  // Helper function to draw content onto a 2D canvas for the texture
  const drawRecipeCardContent = useCallback((context, recipe, image = null) => {
    const cardWidth = context.canvas.width;
    const cardHeight = context.canvas.height;

    // Clear canvas
    context.clearRect(0, 0, cardWidth, cardHeight);

    // Background
    context.fillStyle = '#374151'; // Equivalent to Tailwind gray-700
    context.fillRect(0, 0, cardWidth, cardHeight);

    // Border/Padding
    context.strokeStyle = '#4B5563'; // Equivalent to Tailwind gray-600
    context.lineWidth = 4;
    context.strokeRect(2, 2, cardWidth - 4, cardHeight - 4);

    const padding = 30; // General padding from card edges
    const topPaddingForImage = 20; // Specific padding for image from top
    const bottomPaddingForDetails = 20; // Specific padding for "Click to View Details" from bottom

    // --- Image Section ---
    const imageSectionTop = topPaddingForImage;
    const imageSectionHeight = cardHeight * 0.4; // Allocate 40% of card height for image
    const imageSectionBottom = imageSectionTop + imageSectionHeight;

    // Always show an image - either the loaded image or a placeholder
    if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
      const imgAspectRatio = image.width / image.height;
      const maxImgWidth = cardWidth - 2 * padding;
      const maxImgHeight = imageSectionHeight - 2 * padding; // Use section height for max height

      let drawWidth = maxImgWidth;
      let drawHeight = maxImgWidth / imgAspectRatio;

      if (drawHeight > maxImgHeight) {
        drawHeight = maxImgHeight;
        drawWidth = maxImgHeight * imgAspectRatio;
      }

      const imgX = (cardWidth - drawWidth) / 2;
      const imgY = imageSectionTop + (imageSectionHeight - drawHeight) / 2; // Center vertically within section
      
      context.drawImage(image, imgX, imgY, drawWidth, drawHeight);
      console.log(`Recipe ID: ${recipe.id}, Image Loaded: ${image.src}, Dimensions: ${image.width}x${image.height}, Drawn: ${drawWidth}x${drawHeight}`);
    } else {
      // Always draw a placeholder image
      const placeholderWidth = cardWidth - 2 * padding;
      const placeholderHeight = imageSectionHeight - 2 * padding;
      const placeholderX = padding;
      const placeholderY = imageSectionTop + padding;
      
      // Draw placeholder background
      context.fillStyle = '#6B7280'; // Gray placeholder background
      context.fillRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight);
      
      // Draw placeholder text
      context.fillStyle = '#D1D5DB';
      context.font = '24px Inter, sans-serif';
      context.textAlign = 'center';
      context.fillText('No Image', cardWidth / 2, imageSectionTop + imageSectionHeight / 2);
      
      if (recipe.image_url) {
        console.warn(`Failed to load image for recipe ID ${recipe.id}: ${recipe.image_url}`);
      }
    }

    // --- Text Content Section ---
    // Start text below the image section
    // Give some space after the image section before the title
    let currentTextY = imageSectionBottom + 20; // 20px padding after image section

    // Title
    context.fillStyle = '#F9FAFB';
    context.font = 'bold 40px Inter, sans-serif';
    context.textAlign = 'center';
    context.fillText(recipe.title, cardWidth / 2, currentTextY);
    currentTextY += 60; // Space for the next line of text

    // Cuisine Type
    if (recipe.cuisine_type) {
      context.font = '28px Inter, sans-serif';
      context.fillStyle = '#A0AEC0';
      context.textAlign = 'center';
      context.fillText(`Cuisine: ${recipe.cuisine_type}`, cardWidth / 2, currentTextY);
      // No need to increment currentTextY after cuisine if Click to View Details is fixed at bottom
    }

    // "Click to View Details" text (fixed at bottom)
    context.font = 'bold 32px Inter, sans-serif';
    context.fillStyle = '#60A5FA';
    context.fillText('Click to View Details', cardWidth / 2, cardHeight - bottomPaddingForDetails);

    return context.canvas;
  }, []);

  const initThreeScene = useCallback((recipesData) => {
    // IMPORTANT: Check if mountRef.current is available before proceeding
    if (!mountRef.current) {
      console.warn("mountRef.current is null. Cannot initialize Three.js scene.");
      return;
    }

    // Clear existing meshes from the root group and cuisineGroups map
    while(rootGroup.current.children.length > 0){
      rootGroup.current.remove(rootGroup.current.children[0]);
    }
    cuisineGroups.current.clear();

    // Set up renderer
    const containerWidth = mountRef.current.clientWidth;
    const containerHeight = mountRef.current.clientHeight;
    renderer.current.setSize(containerWidth, containerHeight);
    renderer.current.setClearColor(0x1a202c); // Dark background color
    if (mountRef.current && !mountRef.current.querySelector('canvas')) {
      mountRef.current.appendChild(renderer.current.domElement);
    }

    // Set camera aspect ratio based on container
    camera.current.aspect = containerWidth / containerHeight;
    camera.current.updateProjectionMatrix();
    camera.current.position.set(0, 0, 7); // Camera remains fixed at Y=0, Z=7
    scene.current.add(rootGroup.current);

    // Group recipes by cuisine type
    const cuisinesMap = new Map();
    recipesData.forEach(recipe => {
      const cuisine = recipe.cuisine_type || 'Uncategorized';
      if (!cuisinesMap.has(cuisine)) {
        cuisinesMap.set(cuisine, []);
      }
      cuisinesMap.get(cuisine).push(recipe);
    });

    const verticalSpacing = 2.5; // Reduced spacing between cuisine groups for better visibility
    const cardWidth = 4.0; // Increased width for landscape orientation
    const cardHeight = 2.0; // Reduced height for landscape orientation
    const horizontalRadius = 5; // Increased radius to accommodate wider cards

    // Sort cuisines alphabetically for consistent display
    const sortedCuisines = Array.from(cuisinesMap.keys()).sort();
    totalCuisinesCountRef.current = sortedCuisines.length; // Store the total count

    // Clear and reset cuisineGroups map
    cuisineGroups.current.clear();

    sortedCuisines.forEach((cuisineName, cuisineIndex) => {
      const recipesInCuisine = cuisinesMap.get(cuisineName);
      const cuisineGroup = new THREE.Group();
      cuisineGroup.userData.cuisineName = cuisineName;
      cuisineGroup.userData.recipes = recipesInCuisine; // Store recipes for this group

      const numCardsInCuisine = recipesInCuisine.length;
      const angleStep = (Math.PI * 2) / numCardsInCuisine;

      recipesInCuisine.forEach((recipe, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; // Updated canvas width for 2:1 aspect ratio
        canvas.height = 512;  // Updated canvas height for 2:1 aspect ratio
        const context = canvas.getContext('2d');
        
        // Draw initial card with placeholder - this ensures every card shows something
        drawRecipeCardContent(context, recipe, null);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);

        const card = new THREE.Mesh(geometry, material);
        card.scale.set(1, 1, 1);

        // Position cards in a circle within their cuisine group
        const angle = index * angleStep;
        card.position.x = horizontalRadius * Math.sin(angle);
        card.position.z = horizontalRadius * Math.cos(angle);
        // Store initial angle for lookAt adjustment in animate loop
        card.userData.initialAngle = angle; 

        card.userData.recipeId = recipe.id;
        card.userData.texture = texture;
        card.userData.material = material;
        card.userData.context = context; // Store context for later updates

        cuisineGroup.add(card);

        // Load image asynchronously and update the card
        if (recipe.image_url) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            console.log(`Image loaded successfully for recipe ${recipe.id}: ${recipe.image_url}`);
            drawRecipeCardContent(context, recipe, img);
            texture.needsUpdate = true;
          };
          
          img.onerror = () => {
            console.warn(`Failed to load image for recipe ID ${recipe.id}: ${recipe.image_url}`);
            // Keep the placeholder that was already drawn
          };
          
          // Set src last to trigger loading
          img.src = recipe.image_url;
        } else {
          console.log(`No image URL for recipe ${recipe.id}, using placeholder`);
        }
      });

      // Position each cuisine group based on its index
      // The first group (index 0) will be at Y=0 relative to the rootGroup
      cuisineGroup.position.y = -cuisineIndex * verticalSpacing; 
      rootGroup.current.add(cuisineGroup);
      cuisineGroups.current.set(cuisineName, cuisineGroup); // Store reference to the cuisine group
    });

    // Set initial position of the rootGroup to center the first cuisine group
    rootGroup.current.position.y = 0; // Ensure the first group is centered initially
    currentCuisineIndexRef.current = 0; // Initialize current index to the first group

    // Animation loop with smooth scrolling
    const animate = () => {
      requestAnimationFrame(animate);

      // Handle smooth scrolling animation
      if (isScrolling.current) {
        const currentTime = Date.now();
        const elapsed = currentTime - scrollStartTime.current;
        const progress = Math.min(elapsed / scrollDuration, 1);
        
        // Use easeInOutCubic for smooth animation
        const easeInOutCubic = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const currentY = scrollStartY.current + (scrollTargetY.current - scrollStartY.current) * easeInOutCubic;
        rootGroup.current.position.y = currentY;
        
        if (progress >= 1) {
          isScrolling.current = false;
          rootGroup.current.position.y = scrollTargetY.current;
        }
      }

      // Make each card face the camera
      rootGroup.current.children.forEach(cuisineGroup => {
        cuisineGroup.children.forEach(child => {
          // Only apply lookAt to recipe cards (PlaneGeometry with recipeId)
          if (child.isMesh && child.geometry.type === 'PlaneGeometry' && child.userData.recipeId) { 
            child.lookAt(camera.current.position);
          }
        });
      });

      renderer.current.render(scene.current, camera.current);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) {
        return;
      }
      const updatedContainerWidth = mountRef.current.clientWidth;
      const updatedContainerHeight = mountRef.current.clientHeight;
      camera.current.aspect = updatedContainerWidth / updatedContainerHeight;
      camera.current.updateProjectionMatrix();
      renderer.current.setSize(updatedContainerWidth, updatedContainerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Mouse interaction for horizontal rotation
    const onMouseDown = (event) => {
      isDragging.current = true;
      previousMousePosition.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const onMouseMove = (event) => {
      if (!isDragging.current) return;

      const deltaX = event.clientX - previousMousePosition.current.x;

      // Find the active cuisine group (the one closest to the camera's center Y)
      let activeCuisineGroup = null;
      let minDistance = Infinity;
      rootGroup.current.children.forEach(group => {
          // Calculate the world position of the group's center
          const groupWorldPosition = new THREE.Vector3();
          group.getWorldPosition(groupWorldPosition);
          const distance = Math.abs(groupWorldPosition.y - camera.current.position.y);
          if (distance < minDistance) {
              minDistance = distance;
              activeCuisineGroup = group;
          }
      });

      // Apply horizontal rotation to the active cuisine group
      if (activeCuisineGroup) {
          activeCuisineGroup.rotation.y += deltaX * horizontalRotationSpeed.current;
      }
      
      previousMousePosition.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onMouseClick = (event) => {
      const rect = renderer.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; 
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; 

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera.current);

      // Intersect with all children of all cuisine groups that are actual recipe cards
      const allRecipeCards = [];
      rootGroup.current.children.forEach(cuisineGroup => {
        cuisineGroup.children.forEach(child => {
          if (child.isMesh && child.geometry.type === 'PlaneGeometry' && child.userData.recipeId) { 
            allRecipeCards.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(allRecipeCards);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.recipeId) {
          navigate(`/recipes/${clickedObject.userData.recipeId}`);
        }
      }
    };

    renderer.current.domElement.addEventListener('mousedown', onMouseDown);
    renderer.current.domElement.addEventListener('mousemove', onMouseMove);
    renderer.current.domElement.addEventListener('mouseup', onMouseUp);
    renderer.current.domElement.addEventListener('click', onMouseClick);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.current.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.current.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.current.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.current.domElement.removeEventListener('click', onMouseClick);
      // Capture current value of mountRef.current for cleanup
      const currentMountRef = mountRef.current; 
      if (currentMountRef && renderer.current.domElement) {
        currentMountRef.removeChild(renderer.current.domElement);
      }
      // Dispose of textures and materials to prevent memory leaks
      rootGroup.current.children.forEach(cuisineGroup => {
        cuisineGroup.children.forEach(child => {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
            }
          }
          if (child.geometry) child.geometry.dispose();
        });
      });
      scene.current.remove(rootGroup.current);
      if (renderer.current) {
        renderer.current.dispose();
      }
      // Re-initialize refs for clean slate on unmount/remount
      renderer.current = new THREE.WebGLRenderer({ antialias: true });
      scene.current = new THREE.Scene();
      camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      rootGroup.current = new THREE.Group();
      cuisineGroups.current = new Map();
    };
  }, [drawRecipeCardContent, navigate]);

  // Functions for button-based vertical scrolling with smooth animation
  const handleScrollUp = () => {
    if (rootGroup.current && totalCuisinesCountRef.current > 0 && !isScrolling.current) {
      const verticalSpacing = 2.5; // Needs to match the value in initThreeScene
      const newIndex = Math.max(0, currentCuisineIndexRef.current - 1);
      
      if (newIndex !== currentCuisineIndexRef.current) {
        currentCuisineIndexRef.current = newIndex;
        const targetY = newIndex * verticalSpacing;
        
        // Start smooth scrolling animation
        isScrolling.current = true;
        scrollStartTime.current = Date.now();
        scrollStartY.current = rootGroup.current.position.y;
        scrollTargetY.current = targetY;
      }
    }
  };

  const handleScrollDown = () => {
    if (rootGroup.current && totalCuisinesCountRef.current > 0 && !isScrolling.current) {
      const verticalSpacing = 2.5; // Needs to match the value in initThreeScene
      const newIndex = Math.min(totalCuisinesCountRef.current - 1, currentCuisineIndexRef.current + 1);
      
      if (newIndex !== currentCuisineIndexRef.current) {
        currentCuisineIndexRef.current = newIndex;
        const targetY = newIndex * verticalSpacing;
        
        // Start smooth scrolling animation
        isScrolling.current = true;
        scrollStartTime.current = Date.now();
        scrollStartY.current = rootGroup.current.position.y;
        scrollTargetY.current = targetY;
      }
    }
  };

  // Functions for button-based horizontal rotation
  const handleRotateLeft = () => {
    // Find the active cuisine group (the one closest to the camera's center Y)
    let activeCuisineGroup = null;
    let minDistance = Infinity;
    rootGroup.current.children.forEach(group => {
        const groupWorldPosition = new THREE.Vector3();
        group.getWorldPosition(groupWorldPosition);
        const distance = Math.abs(groupWorldPosition.y - camera.current.position.y);
        if (distance < minDistance) {
            minDistance = distance;
            activeCuisineGroup = group;
        }
    });

    if (activeCuisineGroup) {
        activeCuisineGroup.rotation.y += horizontalButtonRotationStep.current;
    }
  };

  const handleRotateRight = () => {
    // Find the active cuisine group (the one closest to the camera's center Y)
    let activeCuisineGroup = null;
    let minDistance = Infinity;
    rootGroup.current.children.forEach(group => {
        const groupWorldPosition = new THREE.Vector3();
        group.getWorldPosition(groupWorldPosition);
        const distance = Math.abs(groupWorldPosition.y - camera.current.position.y);
        if (distance < minDistance) {
            minDistance = distance;
            activeCuisineGroup = group;
        }
    });

    if (activeCuisineGroup) {
        activeCuisineGroup.rotation.y -= horizontalButtonRotationStep.current;
    }
  };

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.get(`${apiBaseUrl}/recipes/`);
      if (Array.isArray(response.data)) {
        setRecipes(response.data);
        // Initialize filtered recipes immediately when recipes are loaded
        // This will now be handled by the debouncedSearchTerm effect
      } else {
        console.warn("API response for recipes was not an array:", response.data);
        setRecipes([]);
      }
      console.log("Fetched Recipes:", response.data);
    } catch (error) {
      console.error("Error fetching recipes:", error.response?.data || error);
      setMessage('Failed to load recipes. Please ensure your backend is running and you are logged in.');
      if (error.response?.status === 403) {
        onLogout();
      }
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, onLogout, setLoading]); // Removed searchTerm from dependencies, as debouncedSearchTerm handles filtering logic

  useEffect(() => {
    // This effect now correctly depends on filteredRecipes, which is updated by the debounce logic
    if (filteredRecipes.length > 0 && mountRef.current) {
      initThreeScene(filteredRecipes);
    } else if (filteredRecipes.length === 0) {
      // If no recipes are filtered, clear the Three.js scene
      if (mountRef.current) {
        const existingCanvas = mountRef.current.querySelector('canvas');
        if (existingCanvas) {
          mountRef.current.removeChild(existingCanvas);
        }
      }
      // Dispose Three.js resources when no recipes are displayed
      rootGroup.current.children.forEach(cuisineGroup => {
        cuisineGroup.children.forEach(child => {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
            }
          }
          if (child.geometry) child.geometry.dispose();
        });
      });
      scene.current.remove(rootGroup.current);
      if (renderer.current) {
        renderer.current.dispose();
      }
      // Re-initialize refs for clean slate
      renderer.current = new THREE.WebGLRenderer({ antialias: true });
      scene.current = new THREE.Scene();
      camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      rootGroup.current = new THREE.Group();
      cuisineGroups.current = new Map();
    };
  }, [filteredRecipes, initThreeScene]); // This effect now correctly depends on filteredRecipes

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleAddRecipeClick = () => {
    navigate('/recipes/new');
  };

  // Random recipe selection function
  const handleRandomRecipe = () => {
    if (filteredRecipes.length === 0) {
      setMessage('No recipes available for random selection!');
      return;
    }
    
    // Always pick a fresh random recipe
    const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
    const randomRecipe = filteredRecipes[randomIndex];
    
    console.log(`Random selection: Recipe ${randomIndex + 1} of ${filteredRecipes.length}: "${randomRecipe.title}"`);
    
    // Find which cuisine group this recipe belongs to
    const cuisinesMap = new Map();
    filteredRecipes.forEach(recipe => {
      const cuisine = recipe.cuisine_type || 'Uncategorized';
      if (!cuisinesMap.has(cuisine)) {
        cuisinesMap.set(cuisine, []);
      }
      cuisinesMap.get(cuisine).push(recipe);
    });
    
    const sortedCuisines = Array.from(cuisinesMap.keys()).sort();
    const targetCuisine = randomRecipe.cuisine_type || 'Uncategorized';
    const cuisineIndex = sortedCuisines.indexOf(targetCuisine);
    
    console.log(`Target cuisine: "${targetCuisine}", cuisine index: ${cuisineIndex}`);
    
    if (cuisineIndex !== -1 && rootGroup.current) {
      const verticalSpacing = 2.5;
      const targetY = cuisineIndex * verticalSpacing;
      
      // Clear any existing message first
      setMessage('');
      
      // Force stop any ongoing scrolling
      isScrolling.current = false;
      
      // Start fresh smooth scrolling animation to the cuisine group
      setTimeout(() => {
        isScrolling.current = true;
        scrollStartTime.current = Date.now();
        scrollStartY.current = rootGroup.current.position.y;
        scrollTargetY.current = targetY;
        currentCuisineIndexRef.current = cuisineIndex;
        
        // Show a message about the random selection
        const cuisineText = targetCuisine !== 'Uncategorized' ? ` from ${targetCuisine} cuisine` : '';
        setMessage(`🎲 Random pick: "${randomRecipe.title}"${cuisineText}!`);
        
        // Clear the message after 4 seconds
        setTimeout(() => {
          setMessage('');
        }, 4000);
      }, 50); // Small delay to ensure state is updated
    }
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
          width: '3000px', // Adjusted width to match image
          minWidth: '280px', // Ensure it doesn't shrink
          maxWidth: '280px', // Ensure it doesn't grow
          flexShrink: 0, // Prevent shrinking
          flexGrow: 0, // Prevent growing
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
            width: '100%',
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
      width: '1500px',
      backgroundColor: '#1F2937',
      color: '#F9FAFB'
    }}>
      {/* Left Sidebar Navigation */}
      <div style={{
        width: '280px', // Adjusted width to match image
        minWidth: '280px', // Ensure it doesn't shrink
        maxWidth: '280px', // Ensure it doesn't grow
        flexShrink: 0, // Prevent shrinking
        flexGrow: 0, // Prevent growing
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

        {/* Search Section (Moved Up) */}
        <div style={{ borderTop: '1px solid #374151', paddingTop: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Search Recipes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search by name, cuisine, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Update searchTerm directly
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
            {/* Stabilized search message area */}
            <p style={{ 
              fontSize: '12px', 
              color: '#9CA3AF', 
              margin: '8px 0 0 0',
              lineHeight: '1.4',
              minHeight: '18px' // Reserve space for the message
            }}>
              {searchTerm
                ? (filteredRecipes.length > 0 
                  ? `Found ${filteredRecipes.length} recipe${filteredRecipes.length === 1 ? '' : 's'}`
                  : 'No recipes found')
                : '\u00A0' // Use non-breaking space when searchTerm is empty
              }
            </p>
          </div>
        </div>

        {/* 3D Navigation Controls (Moved Up) */}
        <div style={{ borderTop: '1px solid #374151', paddingTop: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>3D Navigation</h3>
          
          {/* Vertical Navigation */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#D1D5DB' }}>
              Cuisine Groups
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleScrollUp} 
                style={{
                  padding: '10px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
                title="Previous Cuisine Group"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                onClick={handleScrollDown} 
                style={{
                  padding: '10px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
                title="Next Cuisine Group"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Horizontal Navigation */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#D1D5DB' }}>
              Rotate Recipes
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleRotateLeft} 
                style={{
                  padding: '10px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#10B981'}
                title="Rotate Left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                onClick={handleRotateRight} 
                style={{
                  padding: '10px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}
                onMouseOver={(e) => e.target.backgroundColor = '#059669'}
                onMouseOut={(e) => e.target.backgroundColor = '#10B981'}
                title="Rotate Right"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Action Buttons (Moved Down) */}
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
            <strong>Tip:</strong> You can also drag horizontally on the 3D view to rotate recipes within the active cuisine group.
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
        padding: '40px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
            Your Recipes Dashboard
          </h1>
          {message && (
            <p style={{ 
              margin: '10px 0',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: message.includes('🎲') ? '#065F46' : '#7F1D1D',
              color: '#F9FAFB',
              fontSize: '14px'
            }}>
              {message}
            </p>
          )}
        </div>

        {/* 3D Recipe View */}
        <div>

            
        </div>
        {filteredRecipes.length === 0 && !searchTerm ? (
          <div style={{
            flex: 1,
            width: '100%',
            minWidth: '3000px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a202c', // Consistent background color
            borderRadius: '8px',
            // Removed padding here to rely on parent's padding
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
        ) : filteredRecipes.length === 0 && searchTerm ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a202c', // Consistent background color
            borderRadius: '8px',
            // Removed padding here to rely on parent's padding
            textAlign: 'center',
            minWidth: '2500px',
          }}>
            <div>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#9CA3AF' }}>
                No Matching Recipes
              </h2>
              <p style={{ margin: '0', fontSize: '16px', color: '#6B7280' }}>
                No recipes match your search "{searchTerm}". Try different keywords or clear the search to see all recipes.
              </p>
            </div>
          </div>
        ) : (
          <div 
            ref={mountRef} 
            style={{ 
              flex: 1,
              backgroundColor: '#1a202c', 
              borderRadius: '8px', 
              overflow: 'hidden',
              position: 'relative'
            }} 
          >
            {/* Three.js canvas will be appended here */}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
