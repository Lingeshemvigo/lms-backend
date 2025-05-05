const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get course content
// @route   GET /api/courses/:courseId/content
exports.getCourseContent = async (req, res) => {
  try {
    console.log('Fetching course content for:', req.params.courseId);
    console.log('User:', req.user._id);
    
    const course = await Course.findById(req.params.courseId)
      .populate('sections.lessons');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if course is published or user is admin/instructor
    if (course.status !== 'published' && req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Course is not published' });
    }

    // If user is not admin or instructor, check enrollment
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      console.log('Checking enrollment for user:', req.user._id);
      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        course: req.params.courseId,
        status: { $in: ['active', 'completed'] }
      });

      console.log('Found enrollment:', enrollment);

      if (!enrollment) {
        return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
      }
    }

    // Sort sections and lessons by order
    const sortedSections = course.sections.map(section => {
      const sortedLessons = section.lessons.sort((a, b) => a.order - b.order);
      return {
        ...section.toObject(),
        lessons: sortedLessons
      };
    }).sort((a, b) => a.order - b.order);

    console.log('Sending course content');
    res.json({ 
      success: true, 
      data: { 
        sections: sortedSections,
        title: course.title,
        description: course.description
      } 
    });
  } catch (error) {
    console.error('Error fetching course sections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course sections', error: error.message });
  }
};

// @desc    Add section to course
// @route   POST /api/courses/:courseId/sections
exports.addSection = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const maxOrder = course.sections.length > 0 ? Math.max(...course.sections.map(s => s.order)) : 0;
    const newSection = { ...req.body, order: maxOrder + 1, lessons: [] };
    course.sections.push(newSection);
    await course.save();
    const addedSection = course.sections[course.sections.length - 1];
    res.status(201).json({ success: true, data: addedSection });
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({ success: false, message: 'Failed to add section', error: error.message });
  }
};

// @desc    Update section
// @route   PUT /api/courses/:courseId/sections/:sectionId
exports.updateSection = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    Object.assign(section, req.body);
    await course.save();
    res.json({ success: true, data: section });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ success: false, message: 'Failed to update section', error: error.message });
  }
};

// @desc    Delete section
// @route   DELETE /api/courses/:courseId/sections/:sectionId
exports.deleteSection = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    section.remove();
    course.sections.forEach((sec, idx) => { sec.order = idx + 1; });
    await course.save();
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ success: false, message: 'Failed to delete section', error: error.message });
  }
};

// @desc    Add lesson to section
// @route   POST /api/courses/:courseId/sections/:sectionId/lessons
exports.addLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    const maxOrder = section.lessons.length > 0 ? Math.max(...section.lessons.map(l => l.order)) : 0;
    const newLesson = { ...req.body, order: maxOrder + 1 };
    section.lessons.push(newLesson);
    await course.save();
    const addedLesson = section.lessons[section.lessons.length - 1];
    res.status(201).json({ success: true, data: addedLesson });
  } catch (error) {
    console.error('Error adding lesson:', error);
    res.status(500).json({ success: false, message: 'Failed to add lesson', error: error.message });
  }
}; 