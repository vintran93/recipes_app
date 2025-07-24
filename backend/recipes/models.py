from django.db import models
from django.contrib.auth.models import User # Import Django's built-in User model

class Recipe(models.Model):
    # Link recipe to the User who created it
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipes')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    ingredients = models.TextField(help_text="List ingredients, one per line or separated by commas.")
    instructions = models.TextField(help_text="Detailed cooking instructions.")
    
    # Optional fields
    image_url = models.URLField(max_length=500, blank=True, null=True, 
                                help_text="URL to an image of the recipe")
    external_link = models.URLField(max_length=500, blank=True, null=True, 
                                    help_text="Link to the original recipe source (e.g., a blog, another website)")
    cuisine_type = models.CharField(max_length=100, blank=True, null=True, 
                                    help_text="e.g., Italian, Mexican, Indian") # New field for cuisine type
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at'] # Order by most recent first
        verbose_name = "Recipe"
        verbose_name_plural = "Recipes"

    def __str__(self):
        return self.title