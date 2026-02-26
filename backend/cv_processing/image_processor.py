"""
Computer Vision Processing for Beach Condition Verification
Uses OpenCV for crowd counting and cleanliness analysis
"""
import cv2
import numpy as np
from PIL import Image
import os
from django.conf import settings


class BeachImageProcessor:
    """
    Processes beach images to estimate:
    - Crowd levels (using object detection and density estimation)
    - Cleanliness scores (using color-based segmentation)
    """
    
    def __init__(self):
        self.min_area = 50  # Minimum area for blob detection
        self.max_area = 5000  # Maximum area for blob detection
    
    def count_crowd_density(self, image_path):
        """
        Estimate crowd density using color-based segmentation and blob detection
        
        Returns: estimated crowd count (0-100 scale)
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return 0
            
            # Resize for processing (faster)
            height, width = img.shape[:2]
            scale = 800 / max(width, height)
            if scale < 1:
                img = cv2.resize(img, (int(width * scale), int(height * scale)))
            
            # Convert to HSV for better color detection
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Detect skin tones (people) - approximate range
            # This is a simplified approach; in production, use proper person detection
            lower_skin = np.array([0, 20, 70], dtype=np.uint8)
            upper_skin = np.array([20, 255, 255], dtype=np.uint8)
            mask_skin = cv2.inRange(hsv, lower_skin, upper_skin)
            
            # Detect common clothing colors (blue, red, yellow, etc.)
            # Blue clothing
            lower_blue = np.array([100, 50, 50], dtype=np.uint8)
            upper_blue = np.array([130, 255, 255], dtype=np.uint8)
            mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)
            
            # Combine masks
            mask = cv2.bitwise_or(mask_skin, mask_blue)
            
            # Morphological operations to clean up
            kernel = np.ones((5, 5), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter by area (approximate person-sized objects)
            person_count = 0
            for contour in contours:
                area = cv2.contourArea(contour)
                if self.min_area < area < self.max_area:
                    person_count += 1
            
            # Alternative: Use density-based approach
            # Calculate percentage of image covered by potential people
            total_pixels = img.shape[0] * img.shape[1]
            masked_pixels = cv2.countNonZero(mask)
            density_ratio = masked_pixels / total_pixels
            
            # Combine both methods
            # Scale density to 0-100 (assuming max density of 30% is "very crowded")
            density_score = min(density_ratio * 333, 100)  # 0.3 = 100
            
            # Combine with contour count (weighted)
            # Assume ~20-50 people per image at max
            contour_score = min((person_count / 50) * 100, 100)
            
            # Final score (weighted average)
            crowd_score = 0.6 * density_score + 0.4 * contour_score
            
            return int(round(crowd_score))
        
        except Exception as e:
            print(f"Error in crowd counting: {e}")
            return 0
    
    def assess_cleanliness(self, image_path):
        """
        Assess cleanliness using color-based segmentation
        
        Returns: cleanliness score (0-100, higher is cleaner)
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return 50  # Default neutral score
            
            # Resize for processing
            height, width = img.shape[:2]
            scale = 800 / max(width, height)
            if scale < 1:
                img = cv2.resize(img, (int(width * scale), int(height * scale)))
            
            # Convert to HSV
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Detect waste/trash colors (dark, non-natural colors)
            # Clean sand is typically in a specific hue range
            # Trash/waste often appears as dark, saturated, or unnatural colors
            
            # Clean sand/water colors (light, natural)
            # Sand: typically in yellow-brown range
            # Water: blue-cyan range
            # Sky: blue range
            
            # Detect clean areas (sand, water, sky)
            lower_sand = np.array([10, 20, 100], dtype=np.uint8)
            upper_sand = np.array([30, 150, 255], dtype=np.uint8)
            mask_sand = cv2.inRange(hsv, lower_sand, upper_sand)
            
            lower_water = np.array([90, 50, 50], dtype=np.uint8)
            upper_water = np.array([130, 255, 255], dtype=np.uint8)
            mask_water = cv2.inRange(hsv, lower_water, upper_water)
            
            # Detect potential waste (dark, non-natural colors)
            # Dark objects (low brightness)
            _, _, v = cv2.split(hsv)
            mask_dark = v < 50  # Very dark areas
            
            # High saturation unnatural colors (potential plastic)
            _, s, _ = cv2.split(hsv)
            mask_saturated = s > 150  # Highly saturated
            
            # Combine waste indicators
            mask_waste = cv2.bitwise_and(mask_dark.astype(np.uint8) * 255, 
                                         mask_saturated.astype(np.uint8) * 255)
            
            # Calculate cleanliness ratio
            total_pixels = img.shape[0] * img.shape[1]
            clean_pixels = cv2.countNonZero(mask_sand) + cv2.countNonZero(mask_water)
            waste_pixels = cv2.countNonZero(mask_waste)
            
            clean_ratio = clean_pixels / total_pixels
            waste_ratio = waste_pixels / total_pixels
            
            # Calculate score (higher clean ratio and lower waste ratio = cleaner)
            cleanliness_score = (clean_ratio * 70) + ((1 - min(waste_ratio * 5, 1)) * 30)
            cleanliness_score = max(0, min(100, cleanliness_score))
            
            return int(round(cleanliness_score))
        
        except Exception as e:
            print(f"Error in cleanliness assessment: {e}")
            return 50
    
    def process_image(self, image_path):
        """
        Process an image and return both crowd and cleanliness scores
        
        Returns: dict with 'crowd_level' and 'cleanliness_score'
        """
        crowd_score = self.count_crowd_density(image_path)
        cleanliness_score = self.assess_cleanliness(image_path)
        
        # Convert crowd score to level
        if crowd_score < 30:
            crowd_level = 'low'
        elif crowd_score < 70:
            crowd_level = 'moderate'
        else:
            crowd_level = 'high'
        
        return {
            'crowd_score': crowd_score,
            'crowd_level': crowd_level,
            'cleanliness_score': cleanliness_score
        }


# Global instance
processor = BeachImageProcessor()
