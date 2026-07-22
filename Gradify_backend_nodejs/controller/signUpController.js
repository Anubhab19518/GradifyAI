const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { insertRows, selectRows, bufferToDataUrl } = require("../config/supabase");

// Register (Sign Up)
// Register (Sign Up)
exports.register = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: "name, username, email, and password are required" });
        }

        const existingTeacher = await selectRows("teachers", { email }, { single: true });
        if (existingTeacher) return res.status(400).json({ message: "Email already registered" });

        const existingUsername = await selectRows("teachers", { username }, { single: true });
        if (existingUsername) return res.status(400).json({ message: "Username already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);

        let profilePictureUrl = "";
        if (req.file) {
            profilePictureUrl = bufferToDataUrl(req.file.buffer, req.file.mimetype);
        }

        const insertedTeachers = await insertRows("teachers", [{
            name,
            username,
            email,
            password_hash: hashedPassword,
            profile_picture: profilePictureUrl,
        }]);

        const newTeacher = insertedTeachers[0];

        const token = jwt.sign(
            { id: newTeacher.id, email: newTeacher.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(201).json({
            message: "Teacher registered successfully",
            teacher: {
                id: newTeacher.id,
                name: newTeacher.name,
                username: newTeacher.username,
                email: newTeacher.email,
                profilePicture: newTeacher.profile_picture,
            },
            token,
        });

    } catch (error) {
        console.error(error);  // Log the error for debugging purposes
        return res.status(500).json({ message: "Error registering teacher", error: error.message });
    }
};


// Login (Sign In)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const teacher = await selectRows("teachers", { email }, { single: true });
        if (!teacher) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, teacher.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: teacher.id, email: teacher.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({
            message: "Login successful",
            token,
            teacher: {
                id: teacher.id,
                name: teacher.name,
                username: teacher.username,
                email: teacher.email,
                profilePicture: teacher.profile_picture,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error });
    }
};

// Update Profile Picture
exports.updateProfilePicture = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        let profilePictureUrl = "";
        if (req.file) {
            profilePictureUrl = bufferToDataUrl(req.file.buffer, req.file.mimetype);
        } else {
            return res.status(400).json({ message: "No image file provided" });
        }

        const { updateRows } = require("../config/supabase");
        await updateRows("teachers", { profile_picture: profilePictureUrl }, { email });

        res.json({
            message: "Profile picture updated successfully",
            profilePicture: profilePictureUrl
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile picture", error: error.message });
    }
};

// Update Profile (Name and Username)
exports.updateProfile = async (req, res) => {
    try {
        const { email, name, username } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required to identify user" });

        const updateData = {};
        if (name) updateData.name = name;
        if (username) updateData.username = username;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No data provided to update" });
        }

        const { updateRows } = require("../config/supabase");
        await updateRows("teachers", updateData, { email });

        res.json({
            message: "Profile updated successfully",
            updatedData: updateData
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};
