const logout = (req, res) => {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure in production
            sameSite: "strict", 
            expires: new Date(0), // Expire immediately
        };

        // Clear the token cookie
        return res.cookie('token', '', cookieOptions).status(200).json({
            message: "Logout successful",
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error",
            error: true,
        });
    }
};

module.exports = logout;
