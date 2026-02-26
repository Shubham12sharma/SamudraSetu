"""
Personalized Itinerary Builder using Graph Algorithms
Uses Dijkstra's algorithm to find optimal beach routes
"""
import networkx as nx
from geopy.distance import geodesic
from beaches.models import Beach
import heapq


class ItineraryBuilder:
    """
    Builds optimal beach itineraries using graph algorithms
    Beaches are nodes, distances are edges
    """
    
    def __init__(self):
        self.graph = None
        self.beach_coords = {}
    
    def build_graph(self, beaches):
        """
        Build a graph where beaches are nodes and distances are edge weights
        
        Args:
            beaches: QuerySet or list of Beach objects
        """
        self.graph = nx.Graph()
        self.beach_coords = {}
        
        # Add nodes (beaches)
        for beach in beaches:
            node_id = str(beach._id)
            self.graph.add_node(node_id, beach=beach)
            self.beach_coords[node_id] = (beach.latitude, beach.longitude)
        
        # Add edges (distances between beaches)
        beach_list = list(beaches)
        for i, beach1 in enumerate(beach_list):
            for beach2 in beach_list[i+1:]:
                node1_id = str(beach1._id)
                node2_id = str(beach2._id)
                
                # Calculate distance using geodesic (Haversine formula)
                distance = geodesic(
                    (beach1.latitude, beach1.longitude),
                    (beach2.latitude, beach2.longitude)
                ).kilometers
                
                # Only add edges for beaches within reasonable distance (e.g., 500km)
                if distance <= 500:
                    self.graph.add_edge(node1_id, node2_id, weight=distance)
    
    def dijkstra_shortest_path(self, start_beach_id, end_beach_id=None):
        """
        Find shortest path using Dijkstra's algorithm
        
        Args:
            start_beach_id: Starting beach ID
            end_beach_id: Optional destination beach ID
        
        Returns:
            List of beach IDs in shortest path
        """
        if not self.graph:
            return []
        
        start_node = str(start_beach_id)
        end_node = str(end_beach_id) if end_beach_id else None
        
        if start_node not in self.graph:
            return []
        
        if end_node and end_node not in self.graph:
            return []
        
        try:
            if end_node:
                # Shortest path between two beaches
                path = nx.shortest_path(self.graph, start_node, end_node, weight='weight')
                return path
            else:
                # Return all reachable beaches with distances
                distances, paths = nx.single_source_dijkstra(
                    self.graph, start_node, weight='weight'
                )
                return distances, paths
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []
    
    def build_optimal_itinerary(self, start_beach_id, preferences, time_constraint_hours=8, max_beaches=5):
        """
        Build optimal itinerary based on preferences and constraints
        
        Args:
            start_beach_id: Starting beach ID
            preferences: Dict with keys like 'activity_type' (swimming/family/adventure),
                        'max_distance', 'min_suitability_score'
            time_constraint_hours: Maximum hours available
            max_beaches: Maximum number of beaches to visit
        
        Returns:
            List of beach IDs in optimal order
        """
        if not self.graph:
            return []
        
        start_node = str(start_beach_id)
        if start_node not in self.graph:
            return []
        
        activity_type = preferences.get('activity_type', 'overall')
        min_score = preferences.get('min_suitability_score', 50)
        max_distance = preferences.get('max_distance', 200)  # km
        
        # Get all beaches sorted by suitability score
        all_beaches = []
        for node_id in self.graph.nodes():
            beach = self.graph.nodes[node_id]['beach']
            
            # Filter by suitability score
            if activity_type == 'swimming' and beach.swimming_score < min_score:
                continue
            elif activity_type == 'family' and beach.family_score < min_score:
                continue
            elif activity_type == 'adventure' and beach.adventure_score < min_score:
                continue
            elif beach.suitability_score < min_score:
                continue
            
            # Get distance from start
            try:
                distance = nx.shortest_path_length(
                    self.graph, start_node, node_id, weight='weight'
                )
                if distance <= max_distance:
                    all_beaches.append((node_id, beach, distance))
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue
        
        if not all_beaches:
            return [start_node]
        
        # Sort by suitability score (descending)
        if activity_type == 'swimming':
            all_beaches.sort(key=lambda x: x[1].swimming_score, reverse=True)
        elif activity_type == 'family':
            all_beaches.sort(key=lambda x: x[1].family_score, reverse=True)
        elif activity_type == 'adventure':
            all_beaches.sort(key=lambda x: x[1].adventure_score, reverse=True)
        else:
            all_beaches.sort(key=lambda x: x[1].suitability_score, reverse=True)
        
        # Build itinerary using greedy approach with distance constraints
        itinerary = [start_node]
        current_node = start_node
        total_distance = 0
        avg_speed = 50  # km/h (assumed average travel speed)
        
        visited = {start_node}
        
        for node_id, beach, _ in all_beaches[:max_beaches * 2]:  # Consider more than needed
            if node_id in visited or len(itinerary) >= max_beaches:
                continue
            
            try:
                # Calculate distance from current position
                distance_to_next = nx.shortest_path_length(
                    self.graph, current_node, node_id, weight='weight'
                )
                
                # Estimate time (travel + 2 hours at each beach)
                estimated_time = (total_distance + distance_to_next) / avg_speed + (len(itinerary) * 2)
                
                if estimated_time <= time_constraint_hours and distance_to_next <= max_distance:
                    itinerary.append(node_id)
                    total_distance += distance_to_next
                    current_node = node_id
                    visited.add(node_id)
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue
        
        return itinerary
    
    def optimize_route_order(self, beach_ids):
        """
        Optimize the order of beaches in an itinerary using TSP approximation
        
        Args:
            beach_ids: List of beach IDs to visit
        
        Returns:
            Optimized list of beach IDs
        """
        if not self.graph or len(beach_ids) < 2:
            return beach_ids
        
        beach_ids = [str(bid) for bid in beach_ids]
        beach_ids = [bid for bid in beach_ids if bid in self.graph]
        
        if len(beach_ids) < 2:
            return beach_ids
        
        # Use NetworkX's approximate TSP solver
        try:
            subgraph = self.graph.subgraph(beach_ids)
            if nx.is_connected(subgraph):
                # Use Christofides algorithm for approximate TSP
                cycle = nx.approximation.traveling_salesman_problem(
                    subgraph, weight='weight', cycle=True
                )
                # Remove the last node (duplicate start) if cycle=True
                if cycle and cycle[0] == cycle[-1]:
                    cycle = cycle[:-1]
                return cycle
        except:
            pass
        
        # Fallback: Nearest neighbor heuristic
        if len(beach_ids) > 0:
            current = beach_ids[0]
            route = [current]
            remaining = set(beach_ids[1:])
            
            while remaining:
                nearest = min(
                    remaining,
                    key=lambda x: self.graph.get_edge_data(current, x, {}).get('weight', float('inf'))
                )
                route.append(nearest)
                remaining.remove(nearest)
                current = nearest
            
            return route
        
        return beach_ids


# Global instance
itinerary_builder = ItineraryBuilder()
