
"""
Birth Form Component - Modular birth data input handler
Separates form logic from main app for better organization
"""

from datetime import datetime
from typing import Dict, Any, Optional
import json

class BirthFormProcessor:
    """
    Handles birth data validation, processing, and chart generation
    """
    
    def __init__(self):
        self.required_fields = ['name', 'birth_date', 'birth_time', 'city', 'country']
    
    def validate_birth_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate birth form data
        """
        errors = []
        
        # Check required fields
        for field in self.required_fields:
            if not data.get(field):
                errors.append(f"Missing required field: {field}")
        
        # Validate date format
        if data.get('birth_date'):
            try:
                datetime.strptime(data['birth_date'], "%Y-%m-%d")
            except ValueError:
                errors.append("Invalid date format")
        
        # Validate time format
        if data.get('birth_time'):
            try:
                # Handle both HH:MM and HH:MM:SS formats
                if data['birth_time'].count(':') == 2:
                    datetime.strptime(data['birth_time'], "%H:%M:%S")
                else:
                    datetime.strptime(data['birth_time'], "%H:%M")
            except ValueError:
                errors.append("Invalid time format")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "data": data
        }
    
    def process_birth_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process validated birth data into Trinity Chart
        """
        from spec1_calculator import TrinityChartCalculator
        from sentence_engine import generate_sentence
        
        try:
            # Parse datetime
            birth_datetime = datetime.strptime(
                f"{data['birth_date']} {data['birth_time']}", 
                "%Y-%m-%d %H:%M:%S" if ':' in data['birth_time'] and data['birth_time'].count(':') == 2 
                else "%Y-%m-%d %H:%M"
            )
            
            # Get coordinates if provided
            latitude = float(data.get('latitude', 0.0)) if data.get('latitude') else 0.0
            longitude = float(data.get('longitude', 0.0)) if data.get('longitude') else 0.0
            
            # Generate Trinity Chart with coordinates
            calc = TrinityChartCalculator()
            trinity_chart = calc.generate_trinity_chart(birth_datetime, latitude, longitude)
            field_seed = calc.chart_to_field_seed(trinity_chart)
            
            # Generate resonant sentence
            pos = trinity_chart["sun_position"]
            resonance = trinity_chart["resonance_signature"]
            
            sentence = generate_sentence(
                f"Your {resonance['color_name']} consciousness flows through Gate {pos['gate']} Line {pos['line']}, {resonance['tone_name']} in its {resonance['base_name']} foundation",
                tone="mystical",
                keywords=[f"gate_{pos['gate']}", "trinity", resonance['color_name'].lower()]
            )
            
            return {
                "success": True,
                "name": data['name'],
                "trinity_chart": trinity_chart,
                "field_seed": field_seed,
                "consciousness_signature": resonance["quantum_structure"],
                "resonant_sentence": sentence,
                "birth_info": {
                    "date": data['birth_date'],
                    "time": data['birth_time'],
                    "location": f"{data['city']}, {data['country']}"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error processing birth data: {str(e)}"
            }
    
    def format_mobile_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format response data for mobile display
        """
        if not result.get("success"):
            return result
        
        # Create mobile-friendly summary
        chart = result["trinity_chart"]
        mobile_summary = {
            "name": result["name"],
            "essence_code": f"{chart['sun_position']['gate']}.{chart['sun_position']['line']}.{chart['sun_position']['color']}.{chart['sun_position']['tone']}.{chart['sun_position']['base']}",
            "resonance": f"{chart['resonance_signature']['color_name']} • {chart['resonance_signature']['tone_name']} • {chart['resonance_signature']['base_name']}",
            "genetic_code": chart["genetic_code"]["codon"],
            "message": result["resonant_sentence"]
        }
        
        result["mobile_summary"] = mobile_summary
        return result
