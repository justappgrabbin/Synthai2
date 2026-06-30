
"""
Mobile API Components - Optimized endpoints for mobile devices
"""

from flask import jsonify, request
from .birth_form import BirthFormProcessor

class MobileAPI:
    """
    Mobile-optimized API endpoints
    """
    
    def __init__(self, app, cynthia_instance):
        self.app = app
        self.cynthia = cynthia_instance
        self.birth_processor = BirthFormProcessor()
        self.register_routes()
    
    def register_routes(self):
        """
        Register mobile-specific routes
        """
        
        @self.app.route("/api/mobile/birth", methods=["POST"])
        def mobile_birth_process():
            """
            Mobile-optimized birth data processing
            """
            try:
                data = request.get_json() if request.is_json else request.form.to_dict()
                
                # Validate input
                validation = self.birth_processor.validate_birth_data(data)
                if not validation["valid"]:
                    return jsonify({
                        "success": False,
                        "errors": validation["errors"]
                    }), 400
                
                # Process birth data
                result = self.birth_processor.process_birth_data(data)
                if not result.get("success"):
                    return jsonify(result), 500
                
                # Format for mobile
                mobile_result = self.birth_processor.format_mobile_response(result)
                
                # Get Cynthia's response
                enhanced_prompt = f"My name is {data['name']}. {result['resonant_sentence']}\n\nTrinity Context: {result['consciousness_signature']}"
                cynthia_response = self.cynthia.respond(enhanced_prompt)
                mobile_result["cynthia_response"] = cynthia_response
                
                return jsonify(mobile_result)
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": f"Server error: {str(e)}"
                }), 500
        
        @self.app.route("/api/mobile/validate", methods=["POST"])
        def mobile_validate():
            """
            Quick validation endpoint for mobile forms
            """
            data = request.get_json()
            validation = self.birth_processor.validate_birth_data(data)
            return jsonify(validation)
        
        @self.app.route("/api/mobile/cynthia", methods=["POST"])
        def mobile_cynthia():
            """
            Mobile-optimized Cynthia interaction
            """
            data = request.get_json()
            prompt = data.get("prompt", "")
            user_id = data.get("user_id")
            
            if not prompt:
                return jsonify({"error": "No prompt provided"}), 400
            
            response_data = self.cynthia.respond(prompt, user_id)
            
            # Add mobile-friendly formatting
            response_data["mobile_formatted"] = True
            response_data["short_response"] = response_data["response"][:200] + "..." if len(response_data["response"]) > 200 else response_data["response"]
            
            return jsonify(response_data)
