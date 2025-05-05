const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// Get all roles (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
});

// Create new role (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Validate required fields
    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Name and permissions array are required'
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists'
      });
    }

    const role = new Role({
      name: name.toLowerCase(),
      description,
      permissions
    });

    await role.save();
    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
});

// Update role (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if new name conflicts with existing role
    if (name && name.toLowerCase() !== role.name) {
      const existingRole = await Role.findOne({ name: name.toLowerCase() });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        });
      }
    }

    // Update role
    role.name = name ? name.toLowerCase() : role.name;
    role.description = description || role.description;
    role.permissions = permissions || role.permissions;

    await role.save();
    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error.message
    });
  }
});

// Delete role (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if role is in use
    if (role.userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is assigned to users'
      });
    }

    await role.remove();
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error.message
    });
  }
});

module.exports = router; 