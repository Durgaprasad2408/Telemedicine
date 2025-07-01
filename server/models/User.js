import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  // Doctor-specific fields
  specialization: {
    type: String,
    required: function() { 
      return this.role === 'doctor' && !this.isNew; 
    },
    validate: {
      validator: function(v) {
        if (this.role === 'doctor') {
          return v && v.trim().length > 0;
        }
        return true;
      },
      message: 'Specialization is required for doctors'
    }
  },
  licenseNumber: {
    type: String,
    required: function() { 
      return this.role === 'doctor' && this.isNew; 
    }
  },
  experience: {
    type: Number,
    required: function() { 
      return this.role === 'doctor' && !this.isNew; 
    },
    min: [0, 'Experience cannot be negative'],
    validate: {
      validator: function(v) {
        if (this.role === 'doctor') {
          return v !== undefined && v !== null && v >= 0;
        }
        return true;
      },
      message: 'Experience is required for doctors and must be a positive number'
    }
  },
  consultationFee: {
    type: Number,
    required: function() { 
      return this.role === 'doctor' && !this.isNew; 
    },
    min: [0, 'Consultation fee cannot be negative'],
    validate: {
      validator: function(v) {
        if (this.role === 'doctor') {
          return v !== undefined && v !== null && v >= 0;
        }
        return true;
      },
      message: 'Consultation fee is required for doctors and must be a positive number'
    }
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String
  }],
  // Patient-specific fields
  dateOfBirth: {
    type: Date,
    required: function() { 
      return this.role === 'patient' && !this.isNew; 
    },
    validate: {
      validator: function(v) {
        if (this.role === 'patient') {
          return v && v instanceof Date && !isNaN(v.getTime());
        }
        return true;
      },
      message: 'Valid date of birth is required for patients'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: function() { 
      return this.role === 'patient' && !this.isNew; 
    },
    validate: {
      validator: function(v) {
        if (this.role === 'patient') {
          return v && ['male', 'female', 'other'].includes(v);
        }
        return true;
      },
      message: 'Gender is required for patients'
    }
  },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-validate middleware to handle conditional validation during updates
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  const options = this.getOptions();
  
  // Skip validation if explicitly disabled
  if (options.runValidators === false) {
    return next();
  }
  
  // Enable validation for updates
  this.setOptions({ runValidators: true, context: 'query' });
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);