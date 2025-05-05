const Course = require('../models/Course');
const Category = require('../models/Category');
const CourseLevel = require('../models/CourseLevel');

// @desc    Get all courses
// @route   GET /api/courses
exports.getAllCourses = async (req, res) => {
  try {
    const { category, level, search, status } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (level) filter.level = level;
    
    // Status filtering logic - improved for admin routes
    const isAdminRoute = req.originalUrl.indexOf('/admin') !== -1;
    console.log(`Request URL: ${req.originalUrl}, isAdminRoute: ${isAdminRoute}, status param: ${status}`);
    
    // Only filter by status if:
    // 1. Status is explicitly provided and not 'all'
    // 2. It's not an admin route and no status is specified (default to published)
    if (status && status !== 'all') {
      filter.status = status;
      console.log(`Filtering by status: ${status}`);
    } else if (!isAdminRoute && !status) {
      // Only default to published courses for non-admin routes when no status is specified
      filter.status = 'published';
      console.log('Non-admin route with no status - defaulting to published courses only');
    } else {
      console.log('Not filtering by status - returning ALL courses');
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Course filter:', filter); // Log filter for debugging

    const courses = await Course.find(filter)
      .populate('category', 'name')
      .populate('level', 'name')
      .populate('instructor', 'name email')
      .populate({
        path: 'comments.student',
        select: 'name email avatar'
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${courses.length} courses`); // Log found courses count
    
    // For testing purposes, ensure course IDs are logged
    if (courses.length > 0) {
      console.log('Available course IDs for testing:');
      courses.forEach(course => {
        console.log(`- ${course.title}: ${course._id} (status: ${course.status})`);
      });
    }

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('category', 'name')
      .populate('level', 'name')
      .populate('instructor', '_id name');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error.message
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      language,
      price,
      thumbnail,
      sections = [] // Default to empty array if not provided
    } = req.body;

    // Create new course with initial sections
    const course = new Course({
      title,
      description,
      instructor: req.user._id, // Get instructor ID from authenticated user
      category,
      level,
      language,
      price,
      thumbnail,
      sections: sections.map((section, sectionIndex) => ({
        ...section,
        order: sectionIndex + 1,
        lessons: section.lessons ? section.lessons.map((lesson, lessonIndex) => ({
          ...lesson,
          order: lessonIndex + 1
        })) : []
      })),
      status: 'draft' // New courses start as drafts
    });

    await course.save();

    // Fetch the saved course with populated fields
    const savedCourse = await Course.findById(course._id)
      .populate('category', 'name')
      .populate('level', 'name')
      .populate('instructor', '_id name');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: savedCourse
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    // If sections are provided, ensure proper ordering
    if (req.body.sections) {
      req.body.sections = req.body.sections.map((section, sectionIndex) => ({
        ...section,
        order: sectionIndex + 1,
        lessons: section.lessons ? section.lessons.map((lesson, lessonIndex) => ({
          ...lesson,
          order: lessonIndex + 1
        })) : []
      }));
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true,
        runValidators: true 
      }
    )
    .populate('category', 'name')
    .populate('level', 'name')
    .populate('instructor', '_id name');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message
    });
  }
};

// @desc    Publish course
// @route   PUT /api/courses/:id/publish
exports.publishCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: 'published' },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error publishing course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish course',
      error: error.message
    });
  }
};

// @desc    Unpublish course
// @route   PUT /api/courses/:id/unpublish
exports.unpublishCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: 'draft' },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error unpublishing course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish course',
      error: error.message
    });
  }
};

// @desc    Get courses by instructor
// @route   GET /api/courses/instructor/:instructorId
exports.getCoursesByInstructor = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.params.instructorId })
      .populate('category', 'name')
      .populate('level', 'name')
      .populate({
        path: 'comments.student',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructor courses',
      error: error.message
    });
  }
};

// @desc    Add a comment to a course
// @route   POST /api/courses/:id/comments
exports.addComment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const comment = {
      student: req.user._id,
      text: req.body.text
    };

    course.comments.push(comment);
    await course.save();

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// @desc    Ensure there's at least one published course for testing
// @route   GET /api/courses/test/ensure-published
exports.ensurePublishedCourse = async (req, res) => {
  try {
    // Check if there are any published courses
    const publishedCount = await Course.countDocuments({ status: 'published' });
    
    if (publishedCount > 0) {
      return res.json({
        success: true,
        message: `There are already ${publishedCount} published courses available for testing`,
        action: 'none'
      });
    }
    
    // If no published courses, find a draft course to publish
    const draftCourse = await Course.findOne({ status: 'draft' });
    
    if (draftCourse) {
      // Publish the draft course
      draftCourse.status = 'published';
      await draftCourse.save();
      
      return res.json({
        success: true,
        message: 'Successfully published a course for testing',
        action: 'published',
        course: {
          id: draftCourse._id,
          title: draftCourse.title,
          price: draftCourse.price
        }
      });
    }
    
    // If no draft courses either, create a new test course
    const newCourse = new Course({
      title: 'Test Payment Course',
      description: 'This course was automatically created for payment testing',
      instructor: req.user ? req.user._id : '000000000000000000000000', // Use user ID if available or placeholder
      thumbnail: 'https://via.placeholder.com/300x200?text=Test+Course',
      price: 9.99,
      category: '000000000000000000000000', // Placeholder ID
      level: '000000000000000000000000', // Placeholder ID
      language: 'English',
      duration: 60,
      status: 'published',
      sections: [
        {
          title: 'Test Section',
          description: 'Test section for payment testing',
          order: 1,
          lessons: [
            {
              title: 'Test Lesson',
              content: 'Test lesson content',
              order: 1,
              duration: 15
            }
          ]
        }
      ]
    });
    
    try {
      await newCourse.save();
      
      return res.status(201).json({
        success: true,
        message: 'Created a new published course for testing',
        action: 'created',
        course: {
          id: newCourse._id,
          title: newCourse.title,
          price: newCourse.price
        }
      });
    } catch (createError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create test course',
        error: createError.message
      });
    }
  } catch (error) {
    console.error('Error ensuring published course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ensure published course',
      error: error.message
    });
  }
};

// @desc    Get comments for a course
// @route   GET /api/courses/:id/comments
exports.getComments = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'comments.student',
        select: 'name email avatar'
      });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course.comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
}; 