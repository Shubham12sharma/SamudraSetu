"""
Eco-Impact Simulation and Sustainability Awareness Module
Calculates environmental impact of beach visits
"""
from geopy.distance import geodesic
import math


class EcoImpactCalculator:
    """
    Calculates environmental impact of beach visits based on:
    - Travel distance and mode of transport
    - Waste generation estimates
    - Carbon emissions
    """
    
    # Emission factors (kg CO2 per km per person)
    EMISSION_FACTORS = {
        'car': 0.171,  # Average car
        'bus': 0.089,  # Public bus
        'train': 0.041,  # Train
        'flight': 0.255,  # Domestic flight
        'motorcycle': 0.113,  # Motorcycle
        'bicycle': 0.0,  # Zero emissions
        'walking': 0.0,  # Zero emissions
    }
    
    # Waste generation per person per day (kg)
    WASTE_PER_PERSON = 0.5  # Average waste per person per day at beach
    
    # Plastic waste percentage
    PLASTIC_WASTE_RATIO = 0.3  # 30% of waste is plastic
    
    def calculate_carbon_emissions(self, distance_km, transport_mode='car', passengers=1):
        """
        Calculate carbon emissions for travel
        
        Args:
            distance_km: Distance in kilometers
            transport_mode: Mode of transport
            passengers: Number of passengers (for shared transport)
        
        Returns: CO2 emissions in kg
        """
        if transport_mode not in self.EMISSION_FACTORS:
            transport_mode = 'car'  # Default
        
        emission_factor = self.EMISSION_FACTORS[transport_mode]
        
        # For shared transport, divide emissions by passengers
        if transport_mode in ['bus', 'train']:
            total_emissions = emission_factor * distance_km
        else:
            total_emissions = (emission_factor * distance_km) / max(passengers, 1)
        
        return round(total_emissions, 2)
    
    def calculate_waste_generation(self, duration_days=1, number_of_people=1):
        """
        Calculate waste generation for beach visit
        
        Args:
            duration_days: Number of days
            number_of_people: Number of people
        
        Returns: Waste in kg (total, plastic)
        """
        total_waste = self.WASTE_PER_PERSON * number_of_people * duration_days
        plastic_waste = total_waste * self.PLASTIC_WASTE_RATIO
        
        return {
            'total_waste_kg': round(total_waste, 2),
            'plastic_waste_kg': round(plastic_waste, 2)
        }
    
    def calculate_distance(self, origin_lat, origin_lon, dest_lat, dest_lon):
        """
        Calculate distance between two points using geodesic distance
        
        Returns: Distance in kilometers
        """
        distance = geodesic(
            (origin_lat, origin_lon),
            (dest_lat, dest_lon)
        ).kilometers
        return round(distance, 2)
    
    def calculate_impact(self, origin_coords, destination_coords, transport_mode='car',
                        passengers=1, duration_days=1, number_of_people=1):
        """
        Calculate complete environmental impact
        
        Args:
            origin_coords: Tuple of (lat, lon)
            destination_coords: Tuple of (lat, lon)
            transport_mode: Mode of transport
            passengers: Number of passengers
            duration_days: Duration of visit
            number_of_people: Number of people visiting
        
        Returns: Dict with all impact metrics
        """
        # Calculate distance
        distance = self.calculate_distance(
            origin_coords[0], origin_coords[1],
            destination_coords[0], destination_coords[1]
        )
        
        # Calculate emissions (round trip)
        one_way_emissions = self.calculate_carbon_emissions(distance, transport_mode, passengers)
        round_trip_emissions = one_way_emissions * 2
        
        # Calculate waste
        waste_data = self.calculate_waste_generation(duration_days, number_of_people)
        
        # Calculate equivalent trees needed to offset
        # 1 tree absorbs ~21 kg CO2 per year = ~0.058 kg per day
        trees_needed = round(round_trip_emissions / (0.058 * duration_days), 1) if duration_days > 0 else 0
        
        return {
            'distance_km': distance,
            'transport_mode': transport_mode,
            'carbon_emissions_kg': round_trip_emissions,
            'waste_generation_kg': waste_data['total_waste_kg'],
            'plastic_waste_kg': waste_data['plastic_waste_kg'],
            'trees_needed_to_offset': trees_needed,
            'duration_days': duration_days,
            'number_of_people': number_of_people
        }
    
    def get_eco_suggestions(self, impact_data):
        """
        Get eco-friendly suggestions based on impact
        
        Args:
            impact_data: Output from calculate_impact()
        
        Returns: List of suggestions
        """
        suggestions = []
        
        # Transport suggestions
        if impact_data['carbon_emissions_kg'] > 50:
            suggestions.append({
                'type': 'transport',
                'priority': 'high',
                'message': f"Your trip will generate {impact_data['carbon_emissions_kg']} kg of CO2. Consider using public transport or carpooling to reduce emissions.",
                'impact_reduction': 'Up to 50% reduction with public transport'
            })
        
        if impact_data['transport_mode'] == 'car' and impact_data['carbon_emissions_kg'] > 20:
            suggestions.append({
                'type': 'transport',
                'priority': 'medium',
                'message': 'Consider using train or bus for longer distances to reduce carbon footprint.',
                'impact_reduction': '40-70% reduction with public transport'
            })
        
        # Waste suggestions
        if impact_data['plastic_waste_kg'] > 1:
            suggestions.append({
                'type': 'waste',
                'priority': 'high',
                'message': f"Estimated plastic waste: {impact_data['plastic_waste_kg']} kg. Bring reusable water bottles and avoid single-use plastics.",
                'impact_reduction': 'Reduce plastic waste by 80% with reusable items'
            })
        
        if impact_data['waste_generation_kg'] > 2:
            suggestions.append({
                'type': 'waste',
                'priority': 'medium',
                'message': 'Pack food in reusable containers and carry a trash bag to leave no trace.',
                'impact_reduction': 'Minimize waste generation'
            })
        
        # Offset suggestions
        if impact_data['trees_needed_to_offset'] > 5:
            suggestions.append({
                'type': 'offset',
                'priority': 'medium',
                'message': f"Consider planting {impact_data['trees_needed_to_offset']} trees to offset your carbon emissions, or support reforestation programs.",
                'impact_reduction': 'Carbon neutral trip'
            })
        
        # General suggestions
        suggestions.append({
            'type': 'general',
            'priority': 'low',
            'message': 'Support beach cleanup initiatives and practice responsible tourism.',
            'impact_reduction': 'Positive environmental impact'
        })
        
        return suggestions
    
    def compare_transport_modes(self, distance_km, passengers=1):
        """
        Compare environmental impact of different transport modes
        
        Returns: Dict comparing all transport modes
        """
        comparisons = {}
        
        for mode, emission_factor in self.EMISSION_FACTORS.items():
            if mode in ['bicycle', 'walking']:
                continue  # Skip zero-emission modes for comparison
            
            emissions = self.calculate_carbon_emissions(distance_km * 2, mode, passengers)
            comparisons[mode] = {
                'carbon_emissions_kg': emissions,
                'relative_impact': 'high' if emissions > 50 else ('medium' if emissions > 20 else 'low')
            }
        
        # Sort by emissions
        sorted_comparisons = sorted(
            comparisons.items(),
            key=lambda x: x[1]['carbon_emissions_kg']
        )
        
        return dict(sorted_comparisons)


# Global instance
calculator = EcoImpactCalculator()
