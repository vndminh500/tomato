import commentModel from '../models/commentModel.js';
import userModel from '../models/userModel.js';

// Add a new comment
const addComment = async (req, res) => {
    const { productId, rating, comment } = req.body;
    const userId = req.body.userId;

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const newComment = new commentModel({
            userId,
            productId,
            userName: user.name,
            rating,
            comment
        });

        await newComment.save();
        res.json({ success: true, message: "Comment added successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error adding comment" });
    }
};

// Get all comments for a product
const listComments = async (req, res) => {
    const { productId } = req.params;

    try {
        const comments = await commentModel.find({ productId: productId }).sort({ createdAt: -1 });
        res.json({ success: true, data: comments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching comments" });
    }
};

export { addComment, listComments };
