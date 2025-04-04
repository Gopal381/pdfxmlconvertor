import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        const token = req.header("Authorization");

        if (!token) {
            return res.status(401).json({ error: "Access denied, no token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.SECRET_KEY);
        req.user = decoded; // Attach user info to request
        next();
        
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};

export default authMiddleware;
