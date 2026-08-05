import sqlite3

conn = sqlite3.connect("course.db")
cursor = conn.cursor()

# Student table
cursor.execute("""
CREATE TABLE IF NOT EXISTS Student(
    StudentID INTEGER PRIMARY KEY,
    StudentName TEXT
)
""")

# Course Registration table
cursor.execute("""
CREATE TABLE IF NOT EXISTS Course_Registration(
    RegistrationID INTEGER PRIMARY KEY,
    StudentID INTEGER,
    CourseName TEXT,
    FOREIGN KEY(StudentID) REFERENCES Student(StudentID)
)
""")

# Insert records
cursor.execute("INSERT INTO Student VALUES(1,'Vishal')")
cursor.execute("INSERT INTO Student VALUES(2,'Anjali')")

cursor.execute("INSERT INTO Course_Registration VALUES(101,1,'Python')")
cursor.execute("INSERT INTO Course_Registration VALUES(102,2,'Data Science')")

conn.commit()

# JOIN Query
cursor.execute("""
SELECT Student.StudentName, Course_Registration.CourseName
FROM Student
JOIN Course_Registration
ON Student.StudentID = Course_Registration.StudentID
""")

print("Student Name\tCourse")

for row in cursor.fetchall():
    print(row[0], "\t\t", row[1])

conn.close()