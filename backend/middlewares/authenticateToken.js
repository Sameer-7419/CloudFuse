import jwt from "jsonwebtoken";
import User from "../db/User.js";

const authenticateToken = async (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(401).json({ message: "Access token is missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user; // Attach user to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

export default authenticateToken;