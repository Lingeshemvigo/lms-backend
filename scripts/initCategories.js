const mongoose = require('mongoose');
const Category = require('../models/Category');

const categories = [
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Learn web development technologies and frameworks'
  },
  {
    name: 'Backend Development',
    slug: 'backend-development',
    description: 'Server-side programming and database management'
  },
  {
    name: 'Frontend Development',
    slug: 'frontend-development',
    description: 'Client-side programming and UI/UX development'
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'Mobile app development for iOS and Android'
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    description: 'Data analysis, visualization, and statistical modeling'
  },
  {
    name: 'Machine Learning',
    slug: 'machine-learning',
    description: 'Machine learning algorithms and applications'
  },
  {
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    description: 'AI concepts, neural networks, and deep learning'
  },
  {
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    description: 'Cloud platforms, services, and deployment'
  },
  {
    name: 'DevOps',
    slug: 'devops',
    description: 'Development operations, CI/CD, and automation'
  },
  {
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Security practices, tools, and threat prevention'
  }
];

const initCategories = async () => {
  try {
    // First, clear existing categories
    await Category.deleteMany({});
    
    // Then create all categories
    await Promise.all(
      categories.map(category => 
        Category.create(category)
      )
    );
    
    console.log('Categories initialized successfully');
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
};

module.exports = initCategories; 