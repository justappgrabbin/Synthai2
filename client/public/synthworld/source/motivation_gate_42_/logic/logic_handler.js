export class MotivationGate42Logic {
  constructor(userProfile) {
    this.profile = userProfile;
    this.gateNumber = 42;
  }

  activate() {
    const isActivated = this.profile.activeGates.includes(this.gateNumber);
    
    if (!isActivated && this.canActivate()) {
      this.profile.activeGates.push(this.gateNumber);
      return {
        success: true,
        message: "Gate 42 activated! You now honor completion and rest cycles.",
        newCoherence: this.calculateNewCoherence()
      };
    }
    
    return {
      success: false,
      message: isActivated ? "Gate already active" : "Prerequisites not met",
      requirements: this.getRequirements()
    };
  }

  canActivate() {
    const hasRequiredGate = this.profile.activeGates.includes(1);
    const hasCoherence = this.profile.coherence >= 0.5;
    const hasRequiredFields = ['heart', 'soul'].every(field => 
      this.profile.activeFields.includes(field)
    );
    
    return hasRequiredGate && hasCoherence && hasRequiredFields;
  }

  calculateNewCoherence() {
    const boost = 0.05;
    return Math.min(1.0, this.profile.coherence + boost);
  }

  getRequirements() {
    return {
      requiredGates: [1],
      minCoherence: 0.5,
      requiredFields: ['heart', 'soul']
    };
  }

  generateGuidance() {
    const coherenceLevel = this.profile.coherence;
    
    if (coherenceLevel < 0.5) {
      return "Your system needs more rest. Gate 42 awaits higher coherence.";
    } else if (coherenceLevel < 0.7) {
      return "You're learning to honor completion. Rest when the cycle calls.";
    } else {
      return "Gate 42 fully activated. You embody the wisdom of completion through rest.";
    }
  }
}
