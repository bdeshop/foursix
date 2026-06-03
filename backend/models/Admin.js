const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'admin'
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminRole'
  },
  roleName: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to get all permissions
adminSchema.methods.getAllPermissions = async function() {
  if (this.role === 'super_admin') {
    return { isSuperAdmin: true, allPermissions: true };
  }
  
  if (this.roleId) {
    const AdminRole = mongoose.model('AdminRole');
    const role = await AdminRole.findById(this.roleId);
    if (role && role.permissions) {
      const permissions = {};
      role.permissions.forEach(perm => {
        permissions[perm] = { view: true, create: true, edit: true, delete: true };
      });
      return permissions;
    }
  }
  
  return {};
};

module.exports = mongoose.model('Admin', adminSchema);