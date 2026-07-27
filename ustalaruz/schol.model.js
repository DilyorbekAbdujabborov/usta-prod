const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:'); // yoki MySQL/PostgreSQL ulanishi

// Users Model
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role: {
    type: DataTypes.ENUM('student', 'parent', 'teacher', 'admin'),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  school_id: {
    type: DataTypes.INTEGER
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Users',
  timestamps: false
});

// Schools Model
const School = sequelize.define('School', {
  school_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(200)
  },
  region: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'Schools',
  timestamps: false
});

// Classes Model
const Class = sequelize.define('Class', {
  class_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  teacher_id: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'Classes',
  timestamps: false
});

// Students Model
const Student = sequelize.define('Student', {
  student_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'Students',
  timestamps: false
});

// Journals Model
const Journal = sequelize.define('Journal', {
  journal_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('daily', 'weekly', 'lesson'),
    allowNull: false
  }
}, {
  tableName: 'Journals',
  timestamps: false
});

// Grades Model
const Grade = sequelize.define('Grade', {
  grade_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  journal_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  grade: {
    type: DataTypes.INTEGER
  },
  comment: {
    type: DataTypes.TEXT
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'Grades',
  timestamps: false
});

// Attendance Model
const Attendance = sequelize.define('Attendance', {
  attendance_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  journal_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'Attendance',
  timestamps: false
});

// Subjects Model
const Subject = sequelize.define('Subject', {
  subject_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  teacher_id: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'Subjects',
  timestamps: false
});

// Assignments Model
const Assignment = sequelize.define('Assignment', {
  assignment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  journal_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  file_url: {
    type: DataTypes.STRING(200)
  },
  due_date: {
    type: DataTypes.DATEONLY
  }
}, {
  tableName: 'Assignments',
  timestamps: false
});

// Bog'lanishlar
User.belongsTo(School, { foreignKey: 'school_id' });
Class.belongsTo(School, { foreignKey: 'school_id' });
Class.belongsTo(User, { foreignKey: 'teacher_id', as: 'Teacher' });
Student.belongsTo(User, { foreignKey: 'user_id' });
Student.belongsTo(Class, { foreignKey: 'class_id' });
Student.belongsTo(User, { foreignKey: 'parent_id', as: 'Parent' });
Journal.belongsTo(Class, { foreignKey: 'class_id' });
Journal.belongsTo(Subject, { foreignKey: 'subject_id' });
Grade.belongsTo(Journal, { foreignKey: 'journal_id' });
Grade.belongsTo(Student, { foreignKey: 'student_id' });
Attendance.belongsTo(Journal, { foreignKey: 'journal_id' });
Attendance.belongsTo(Student, { foreignKey: 'student_id' });
Subject.belongsTo(User, { foreignKey: 'teacher_id', as: 'Teacher' });
Assignment.belongsTo(Journal, { foreignKey: 'journal_id' });

module.exports = { User, School, Class, Student, Journal, Grade, Attendance, Subject, Assignment };
